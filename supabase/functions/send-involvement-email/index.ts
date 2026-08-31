// send-involvement-email/index.ts
// Hardened 2026-08-30:
//   - CORS restricted to filmauthtoken.com
//   - Per-IP rate limit (5/hour) — prevent Resend quota burn
//   - Length caps on name, email, reason
//   - HTML escaping on user-supplied content
//   - Mandatory IP + UA audit log
//   - Reject submission if honeypot field is non-empty
//   - Cap emails to 1 (the internal one) — skip the auto-responder
//     until we have proper unsubscribe tokens

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.filmauthtoken.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const WINDOW_MS = 60 * 60 * 1000;   // 1 hour
const MAX_PER_HOUR = 5;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_HOUR) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface InvolvementRequest {
  name: string;
  email: string;
  reason: string;
  timestamp: string;
  honeypot?: string;
}

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_REASON = 5000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") ?? "unknown";

  if (isRateLimited(ip)) {
    return json({ error: "rate_limited", message: "Too many submissions, please try again later." }, 429);
  }

  if (!resendApiKey) return json({ error: "Email service not configured" }, 500);
  if (!supabaseUrl || !supabaseServiceKey) return json({ error: "Database not configured" }, 500);

  let body: InvolvementRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { name, email, reason, timestamp, honeypot } = body;

  // Honeypot
  if (honeypot && honeypot.trim() !== "") {
    // Audit but pretend success so spammers don't learn
    await logAudit(supabaseUrl, supabaseServiceKey, ip, ua, "honeypot_triggered", email);
    return json({ success: true, message: "Your interest has been submitted successfully!" });
  }

  // Validate required fields
  if (!name || !email || !reason) {
    return json({ error: "All fields are required" }, 400);
  }
  if (typeof name !== "string" || name.length === 0 || name.length > MAX_NAME) {
    return json({ error: `Name must be 1-${MAX_NAME} characters` }, 400);
  }
  if (typeof reason !== "string" || reason.length === 0 || reason.length > MAX_REASON) {
    return json({ error: `Reason must be 1-${MAX_REASON} characters` }, 400);
  }
  if (typeof email !== "string" || email.length > MAX_EMAIL) {
    return json({ error: `Email must be 1-${MAX_EMAIL} characters` }, 400);
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return json({ error: "Invalid email address" }, 400);
  }

  const resend = new Resend(resendApiKey);

  // ── Single internal email (removed the auto-responder to prevent
  // abuse as a mail relay) ──
  try {
    const emailResponse = await resend.emails.send({
      from: "FilmAuth Development <noreply@filmauthtoken.com>",
      to: ["andrew@filmauthtoken.com"],
      subject: `New Development Interest: ${escapeHtml(name)}`,
      html: `
        <h2>New Development Interest Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Reason for Interest:</strong></p>
        <blockquote>${escapeHtml(reason)}</blockquote>
        <p><strong>Submitted:</strong> ${escapeHtml(timestamp)}</p>
        <p><strong>From IP:</strong> ${escapeHtml(ip)}</p>
        <hr>
        <p><em>This message was sent from the FilmAuth website development interest form.</em></p>
      `,
    });

    await logAudit(supabaseUrl, supabaseServiceKey, ip, ua, "involvement_email_sent", email, {
      resend_id: (emailResponse as { id?: string })?.id,
    });

    return json({
      success: true,
      message: "Your interest has been submitted successfully!",
    });
  } catch (error) {
    console.error("Resend error:", error);
    await logAudit(supabaseUrl, supabaseServiceKey, ip, ua, "involvement_email_failed", email, {
      error: (error as Error).message,
    });
    return json({ error: "Failed to send email. Please try again later." }, 500);
  }
};

async function logAudit(
  supabaseUrl: string,
  supabaseServiceKey: string,
  ip: string,
  ua: string,
  action: string,
  email: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await supabase.from("purchase_audit").insert({
      user_id: null,
      action,
      amount_credits: null,
      signature: null,
      ip_address: ip,
      user_agent: ua,
      metadata: { email, ...metadata },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}

serve(handler);
