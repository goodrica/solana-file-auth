// solana-file-auth/index.ts
// Hardened 2026-08-30:
//   - Input validation on fileHash (SHA-256 hex), fileName, fileSize
//   - Removed dead imports
//   - CORS restricted to filmauthtoken.com
//   - Better error messages
//
// Note: this function does NOT write to Solana. The actual on-chain
// write happens in the `register` edge function, which is called by
// the same frontend flow. The frontend should be reconciled so the
// call to `register` happens here too (or this function should be
// removed and the frontend should call `register` directly).
// For now, the DB-side authentication record is the source of truth
// for "was this photo verified by the user."

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Connection } from "https://esm.sh/@solana/web3.js@1.95.4";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.filmauthtoken.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const SHA256_HEX = /^[a-f0-9]{64}$/;
const MAX_FILE_NAME_LEN = 255;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB upper bound (we only store the hash, not the file)

interface FileAuthRequest {
  action: "authenticate" | "verify";
  fileHash: string;
  fileName?: string;
  fileSize?: number;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateRequest(body: unknown): { ok: true; data: FileAuthRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (b.action !== "authenticate" && b.action !== "verify") {
    return { ok: false, error: "action must be 'authenticate' or 'verify'" };
  }
  if (typeof b.fileHash !== "string" || !SHA256_HEX.test(b.fileHash)) {
    return { ok: false, error: "fileHash must be a 64-character hex SHA-256 string" };
  }
  if (b.fileName !== undefined) {
    if (typeof b.fileName !== "string") return { ok: false, error: "fileName must be a string" };
    if (b.fileName.length === 0 || b.fileName.length > MAX_FILE_NAME_LEN) {
      return { ok: false, error: `fileName length must be 1-${MAX_FILE_NAME_LEN}` };
    }
    // No control characters in the filename
    if (/[\x00-\x1f\x7f]/.test(b.fileName)) {
      return { ok: false, error: "fileName contains control characters" };
    }
  }
  if (b.fileSize !== undefined) {
    if (typeof b.fileSize !== "number" || !Number.isInteger(b.fileSize) || b.fileSize < 0 || b.fileSize > MAX_FILE_SIZE) {
      return { ok: false, error: `fileSize must be an integer between 0 and ${MAX_FILE_SIZE}` };
    }
  }
  return {
    ok: true,
    data: {
      action: b.action as "authenticate" | "verify",
      fileHash: b.fileHash as string,
      fileName: b.fileName as string | undefined,
      fileSize: b.fileSize as number | undefined,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // ── Env + clients ────────────────────────────────────────────
    const rpcUrl = Deno.env.get("SOLANA_RPC_URL") ?? "https://api.mainnet-beta.solana.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!rpcUrl) return json({ error: "SOLANA_RPC_URL not configured" }, 500);
    if (!supabaseUrl || !supabaseKey) return json({ error: "Supabase configuration missing" }, 500);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Auth ─────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) return json({ error: "Invalid authentication token" }, 401);

    // ── Body validation ──────────────────────────────────────────
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const v = validateRequest(raw);
    if (!v.ok) return json({ error: v.error }, 400);
    const { action, fileHash, fileName, fileSize } = v.data;

    const connection = new Connection(rpcUrl, "confirmed");

    if (action === "authenticate") {
      // ── Check + deduct credit ─────────────────────────────────
      const { data: creditsData, error: creditsError } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (creditsError) {
        console.error("Credits check error:", creditsError);
        return json({ error: "Failed to check user credits" }, 500);
      }

      let userCredits = creditsData;
      if (!userCredits) {
        const { data: newCredits, error: insertError } = await supabase
          .from("user_credits")
          .insert({
            user_id: user.id,
            free_credits_remaining: 10,
            purchased_credits: 0,
            total_authentications: 0,
          })
          .select()
          .single();
        if (insertError) {
          console.error("Failed to initialize credits:", insertError);
          return json({ error: "Failed to initialize user credits" }, 500);
        }
        userCredits = newCredits;
      }

      const totalCredits = (userCredits.free_credits_remaining ?? 0) + (userCredits.purchased_credits ?? 0);
      if (totalCredits <= 0) {
        return json({
          success: false,
          error: "insufficient_credits",
          message: "You have no authentication credits remaining. Purchase FOT tokens to continue.",
          creditsRemaining: 0,
        }, 402);
      }

      // ── Check if this hash has already been authenticated by this user ──
      // (avoids double-charging the user for re-submitting the same photo)
      const { data: existing } = await supabase
        .from("file_authentications")
        .select("id, authenticated_at")
        .eq("user_id", user.id)
        .eq("file_hash", fileHash)
        .maybeSingle();

      if (existing) {
        return json({
          success: true,
          message: "File already authenticated",
          data: {
            id: existing.id,
            fileHash,
            timestamp: existing.authenticated_at,
            blockchainNetwork: "solana",
          },
          creditsRemaining: totalCredits,
        });
      }

      // ── Insert the auth record ─────────────────────────────────
      const { data: authData, error: insertError } = await supabase
        .from("file_authentications")
        .insert({
          file_hash: fileHash,
          file_name: fileName,
          file_size: fileSize,
          blockchain_network: "solana",
          authenticated_at: new Date().toISOString(),
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Database error:", insertError);
        return json({ error: "Failed to store authentication record" }, 500);
      }

      // Deduct one credit (free first, then purchased)
      const freeRemaining = userCredits.free_credits_remaining ?? 0;
      const purchasedCredits = userCredits.purchased_credits ?? 0;
      const updatedFreeCredits = Math.max(0, freeRemaining - 1);
      const creditsToDeductFromPurchased = Math.max(0, 1 - freeRemaining);
      const updatedPurchasedCredits = Math.max(0, purchasedCredits - creditsToDeductFromPurchased);

      const { error: updateError } = await supabase
        .from("user_credits")
        .update({
          free_credits_remaining: updatedFreeCredits,
          purchased_credits: updatedPurchasedCredits,
          total_authentications: (userCredits.total_authentications ?? 0) + 1,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update credits:", updateError);
        // Don't fail the request — the auth record is more important
      }

      // Audit log
      await supabase.from("purchase_audit").insert({
        user_id: user.id,
        action: "authenticate",
        amount_credits: -1,
        signature: null,
        ip_address: req.headers.get("x-forwarded-for") ?? "unknown",
        user_agent: req.headers.get("user-agent") ?? "unknown",
        metadata: { file_hash: fileHash, file_name: fileName, file_size: fileSize },
      });

      // Network info (best effort)
      let slot: number | null = null;
      let blockTime: number | null = null;
      try {
        slot = await connection.getSlot();
        blockTime = await connection.getBlockTime(slot);
      } catch (e) {
        console.error("Network info fetch failed:", e);
      }

      return json({
        success: true,
        message: "File authenticated successfully",
        data: {
          id: authData.id,
          fileHash,
          timestamp: authData.authenticated_at,
          blockchainNetwork: "solana",
          networkSlot: slot,
          blockTime: blockTime ? new Date(blockTime * 1000).toISOString() : null,
        },
        creditsRemaining: updatedFreeCredits + updatedPurchasedCredits,
      });
    }

    if (action === "verify") {
      const { data: authRecord, error: verifyError } = await supabase
        .from("file_authentications")
        .select("*")
        .eq("file_hash", fileHash)
        .eq("user_id", user.id)
        .maybeSingle();

      if (verifyError) {
        console.error("Database verification error:", verifyError);
        return json({ error: "Failed to verify authentication record" }, 500);
      }

      if (!authRecord) {
        return json({
          success: true,
          verified: false,
          message: "File not found in authentication records",
        });
      }

      return json({
        success: true,
        verified: true,
        message: "File authentication verified",
        data: {
          id: authRecord.id,
          fileHash: authRecord.file_hash,
          fileName: authRecord.file_name,
          fileSize: authRecord.file_size,
          authenticatedAt: authRecord.authenticated_at,
          blockchainNetwork: authRecord.blockchain_network,
        },
      });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Error in solana-file-auth function:", error);
    return json({ error: (error as Error).message || "Internal server error" }, 500);
  }
});
