// verify/index.ts
// Hardened 2026-08-30:
//   - Replaced broken `npm:@supabase/supabase-js@2/cors` import with inline CORS
//   - Restricted CORS to filmauthtoken.com
//   - Better error messages
//   - Bump http std to 0.190.0 (was: not pinned)
//
// This function is PUBLIC read-only: anyone with a (signature, hash)
// pair can verify that a memo was written. No auth required.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { Connection } from "https://esm.sh/@solana/web3.js@1.95.4";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.filmauthtoken.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

// Accept both formats: with and without 0x prefix
const VerifySchema = z.object({
  hash: z
    .string()
    .regex(/^(0x)?[0-9a-fA-F]{64}$/, 'hash must be 64 hex characters (with optional "0x" prefix)'),
  signature: z.string().trim().min(64).max(120),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeMemos(tx: any): string[] {
  const memos: string[] = [];
  const message = tx?.transaction?.message;
  const instructions = [
    ...(message?.instructions ?? []),
    ...((tx?.meta?.innerInstructions ?? []).flatMap((i: any) => i.instructions ?? [])),
  ];

  for (const ix of instructions) {
    if (ix?.programId?.toString?.() !== MEMO_PROGRAM_ID && ix?.program !== "spl-memo") continue;
    if (typeof ix.parsed === "string") {
      memos.push(ix.parsed);
    } else if (typeof ix.data === "string") {
      try {
        memos.push(new TextDecoder().decode(Uint8Array.from(atob(ix.data), (c) => c.charCodeAt(0))));
      } catch {
        // ignore non-utf8 payloads
      }
    }
  }

  for (const log of tx?.meta?.logMessages ?? []) {
    const match = /Program log: Memo \(len \d+\): "(.*)"$/.exec(log);
    if (match) memos.push(match[1]);
  }

  return memos;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const parsed = VerifySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.flatten().fieldErrors }, 400);
    }
    // Normalize: strip 0x prefix if present, lowercase
    const hash = parsed.data.hash.toLowerCase().replace(/^0x/, "");
    const signature = parsed.data.signature;

    const rpcUrl = Deno.env.get("SOLANA_RPC_URL");
    if (!rpcUrl) throw new Error("SOLANA_RPC_URL is not configured");

    const connection = new Connection(rpcUrl, "confirmed");
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!tx) {
      return json({
        ok: false,
        error: "transaction_not_found",
        message: "Transaction not found on Solana mainnet.",
      }, 404);
    }

    const memos = decodeMemos(tx);
    const match = memos.some((m) => m.trim().toLowerCase() === hash);

    if (!match) {
      return json({
        ok: false,
        error: "hash_mismatch",
        message: "No memo in this transaction matches the provided hash.",
      });
    }

    return json({
      ok: true,
      signature,
      hash,
      blockTime: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
      slot: tx.slot,
    });
  } catch (error) {
    console.error("verify error:", error);
    return json({ ok: false, error: (error as Error).message ?? "Internal server error" }, 500);
  }
});
