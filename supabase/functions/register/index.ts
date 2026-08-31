// register/index.ts
// Hardened 2026-08-30:
//   - Replace broken `npm:@supabase/supabase-js@2/cors` import with inline CORS headers
//   - Add on-chain uniqueness check before signing (rejects if a memo
//     with the same hash already exists on this program)
//   - Restrict CORS to filmauthtoken.com
//   - Bump http library version to match other functions
//
// This function is the one that actually writes hashes on-chain via
// the SPL Memo program. The frontend's FileAuthentication flow should
// be reconciled to call this directly (or include this call) — see
// docs/SECURITY_AUDIT.md for the architectural note.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "https://esm.sh/@solana/web3.js@1.95.4";
import bs58 from "https://esm.sh/bs58@5.0.0";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.filmauthtoken.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Accept both formats: with and without the 0x prefix
const RegisterSchema = z.object({
  hash: z
    .string()
    .regex(/^(0x)?[0-9a-fA-F]{64}$/, 'hash must be 64 hex characters (with optional "0x" prefix)'),
});

// Rate limit: 5 requests / minute / IP
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

function loadServiceWallet(): Keypair {
  const raw = Deno.env.get("SERVICE_SECRET_JSON");
  if (!raw) throw new Error("SERVICE_SECRET_JSON is not configured");
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(trimmed) as number[]));
  }
  return Keypair.fromSecretKey(bs58.decode(trimmed));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return json({
      ok: false,
      error: "rate_limited",
      message: "You're going a bit fast — only 5 registrations per minute are allowed. Please try again shortly.",
    }, 429);
  }

  try {
    const parsed = RegisterSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.flatten().fieldErrors }, 400);
    }
    // Normalize: strip 0x prefix if present, lowercase
    const hash = parsed.data.hash.toLowerCase().replace(/^0x/, "");

    const rpcUrl = Deno.env.get("SOLANA_RPC_URL");
    if (!rpcUrl) throw new Error("SOLANA_RPC_URL is not configured");

    const connection = new Connection(rpcUrl, "confirmed");
    const payer = loadServiceWallet();

    // ── Uniqueness check: scan recent signatures of the payer for
    // any memo transaction containing this hash. This is a best-
    // effort check (limited to getSignaturesForAddress's 1000-sig
    // window) but it prevents accidental double-registration. Full
    // on-chain uniqueness would require an indexer.
    const recentSigs = await connection.getSignaturesForAddress(payer.publicKey, {
      limit: 1000,
    });
    for (const sig of recentSigs) {
      if (sig.err) continue; // skip failed txs
      const tx = await connection.getTransaction(sig.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!tx) continue;
      // Check if any instruction in this tx wrote the same hash
      // as memo data to the Memo program.
      const ixs = tx.transaction.message.compiledInstructions ?? [];
      for (const ix of ixs) {
        const programId = tx.transaction.message.staticAccountKeys[ix.programIdIndex];
        if (programId?.equals(MEMO_PROGRAM_ID)) {
          const dataStr = new TextDecoder().decode(new Uint8Array(ix.data as Uint8Array));
          if (dataStr === hash) {
            return json({
              ok: false,
              error: "already_registered",
              message: "This hash has already been registered on-chain",
              existingSignature: sig.signature,
            }, 409);
          }
        }
      }
    }

    const instruction = new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: new TextEncoder().encode(hash) as unknown as Buffer,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer], {
      commitment: "confirmed",
    });

    console.log("Registered hash on", Deno.env.get("SOLANA_CLUSTER") ?? "mainnet-beta", signature);
    return json({ ok: true, signature });
  } catch (error) {
    console.error("register error:", error);
    return json({ ok: false, error: (error as Error).message ?? "Internal server error" }, 500);
  }
});
