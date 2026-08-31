// process-airdrop/index.ts
// Hardened 2026-08-30:
//   - Admin role check (user_profiles.role = 'admin')
//   - Per-user credit cap (matches DB CHECK constraint)
//   - Bulk upsert (no N+1)
//   - CORS restricted to filmauthtoken.com
//   - Audit logging

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.filmauthtoken.com";
const MAX_AIRDROP_PER_USER = 100_000; // matches DB constraint

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // ── Env + clients ────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !supabaseServiceKey) {
    return json({ error: "Supabase configuration missing" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Auth ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentication required" }, 401);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: "Invalid authentication token" }, 401);

  // ── Admin role check ─────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return json({ error: "Failed to verify admin role" }, 500);
  }
  if (!profile || profile.role !== "admin") {
    // Audit the failed attempt
    await supabase.from("purchase_audit").insert({
      user_id: user.id,
      action: "process_airdrop_denied",
      ip_address: getClientIp(req),
      user_agent: req.headers.get("user-agent") ?? "unknown",
      metadata: { reason: "not_admin", actual_role: profile?.role ?? "none" },
    });
    return json({ error: "Admin role required" }, 403);
  }

  // ── Body ─────────────────────────────────────────────────────
  let body: { campaignId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { campaignId } = body;
  if (!campaignId || typeof campaignId !== "string") {
    return json({ error: "campaignId required" }, 400);
  }

  // ── Campaign lookup ──────────────────────────────────────────
  const { data: campaign, error: campaignError } = await supabase
    .from("airdrop_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    return json({ error: "Failed to fetch campaign" }, 500);
  }
  if (!campaign) {
    return json({ error: "Campaign not found" }, 404);
  }

  // Active + not expired
  const now = new Date();
  const endDate = new Date(campaign.end_date);
  if (!campaign.is_active || now > endDate) {
    return json({ error: "Campaign is not active or has expired" }, 400);
  }

  // ── Cap per-user credit (belt-and-suspenders to DB CHECK) ────
  const perUserCredits = Math.max(0, Math.min(campaign.token_amount, MAX_AIRDROP_PER_USER));
  if (perUserCredits === 0) {
    return json({ error: "Campaign has invalid token_amount" }, 400);
  }

  // ── Eligible users ───────────────────────────────────────────
  const { data: eligibleUsers, error: usersError } = await supabase
    .from("user_profiles")
    .select("user_id, referral_code")
    .eq("airdrop_eligible", true)
    .lt("signup_date", campaign.end_date);

  if (usersError) {
    return json({ error: "Failed to fetch eligible users" }, 500);
  }
  if (eligibleUsers.length === 0) {
    return json({ success: true, message: "No eligible users", participantCount: 0, tokenAmount: perUserCredits });
  }

  // ── Bulk insert participants (one round-trip) ────────────────
  const participants = eligibleUsers.map((u) => ({
    campaign_id: campaignId,
    user_id: u.user_id,
    tokens_allocated: perUserCredits,
    is_eligible: true,
  }));

  const { error: insertError } = await supabase
    .from("airdrop_participants")
    .upsert(participants, { onConflict: "campaign_id,user_id", ignoreDuplicates: true });

  if (insertError) {
    return json({ error: "Failed to create participant records" }, 500);
  }

  // ── Bulk credit update via a single SQL RPC if possible ──────
  // Postgres function: increment_purchased_credits_for_users(user_ids[], amount)
  // We define it inline as a fallback: one upsert per user, but in a
  // single batched call. Note: this is still N round-trips; a proper
  // fix is to add a Postgres function and call it via .rpc().

  // For now, do bulk-upsert in chunks of 100
  const BATCH = 100;
  let creditsUpdated = 0;
  for (let i = 0; i < eligibleUsers.length; i += BATCH) {
    const batch = eligibleUsers.slice(i, i + BATCH);
    const rows = batch.map((u) => ({
      user_id: u.user_id,
      purchased_credits: perUserCredits,
    }));
    // upsert is a single POST per batch (not per user)
    const { error: creditError } = await supabase
      .from("user_credits")
      .upsert(rows, { onConflict: "user_id" });
    if (creditError) {
      console.error("Credit batch update failed:", creditError);
    } else {
      creditsUpdated += batch.length;
    }
  }

  // ── Mark as claimed ──────────────────────────────────────────
  const { error: claimError } = await supabase
    .from("airdrop_participants")
    .update({
      tokens_claimed: perUserCredits,
      claimed_at: new Date().toISOString(),
    })
    .eq("campaign_id", campaignId);

  if (claimError) {
    console.error("Claim update error:", claimError);
  }

  // ── Audit log ────────────────────────────────────────────────
  await supabase.from("purchase_audit").insert({
    user_id: user.id,
    action: "process_airdrop_success",
    amount_credits: perUserCredits * eligibleUsers.length,
    signature: null,
    ip_address: getClientIp(req),
    user_agent: req.headers.get("user-agent") ?? "unknown",
    metadata: {
      campaign_id: campaignId,
      participants: eligibleUsers.length,
      credits_updated: creditsUpdated,
    },
  });

  return json({
    success: true,
    message: `Airdrop processed for ${eligibleUsers.length} eligible users`,
    participantCount: eligibleUsers.length,
    tokenAmount: perUserCredits,
    creditsUpdated,
  });
});
