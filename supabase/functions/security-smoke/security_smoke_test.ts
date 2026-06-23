// Security smoke tests.
//
// These tests assert that Row Level Security is correctly enforced for the
// most sensitive write paths in the app:
//   - public.user_credits          (credits balance — must not be client-writable)
//   - public.airdrop_participants  (eligibility / claim status — must not be client-writable)
//
// They also assert that if a future `public.cards` table is ever introduced,
// it has RLS enabled and is readable by the anon role (the originally
// requested "cards access" rule). If the table does not exist yet, that
// check is skipped — it is a forward-looking guard, not a failure.
//
// Run with:
//   supabase--test_edge_functions { "functions": ["security-smoke"] }

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Anon key and URL are public; fall back to literals when the test runner
// does not inject them. Service role key is optional — tests that need it
// will skip when it is not available.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ??
  "https://thfalxtopjlgpoiadcmt.supabase.co";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZmFseHRvcGpsZ3BvaWFkY210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTU2MTYsImV4cCI6MjA3MTE5MTYxNn0.aqK-oX4hYRZaIriLdvot3-esbEsXDT5_b19gTJOk6Ek";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const HAS_SERVICE_ROLE = SERVICE_ROLE_KEY.length > 0;

const anon = () =>
  createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/**
 * Create a throwaway authenticated user and return a client signed in as them.
 * The user is left in place; cleanup via service role at the end of the test.
 */
async function createAuthedClient() {
  const email = `smoke+${crypto.randomUUID()}@example.com`;
  const password = `Pw!${crypto.randomUUID()}`;

  const adminClient = admin();
  const { data: created, error: createErr } = await adminClient.auth.admin
    .createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createErr || !created.user) {
    throw new Error(`Failed to create test user: ${createErr?.message}`);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInErr } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    throw new Error(`Failed to sign in test user: ${signInErr.message}`);
  }

  return { client: userClient, userId: created.user.id, adminClient };
}

async function deleteUser(adminClient: ReturnType<typeof admin>, userId: string) {
  await adminClient.auth.admin.deleteUser(userId).catch(() => {});
}

// ---------------------------------------------------------------------------
// user_credits: unauthorized updates must be blocked
// ---------------------------------------------------------------------------
Deno.test("user_credits: anon cannot UPDATE", async () => {
  const { data, error } = await anon()
    .from("user_credits")
    .update({ purchased_credits: 999_999 })
    .neq("user_id", "00000000-0000-0000-0000-000000000000")
    .select();

  // Either the policy blocks it (error) or it returns zero rows updated.
  // What must NOT happen: rows actually getting updated.
  assert(
    error !== null || (Array.isArray(data) && data.length === 0),
    `anon UPDATE on user_credits unexpectedly succeeded: ${JSON.stringify(data)}`,
  );
});

Deno.test({
  name: "user_credits: authenticated user cannot UPDATE their own row",
  ignore: !HAS_SERVICE_ROLE,
  fn: async () => {
  const { client, userId, adminClient } = await createAuthedClient();
  try {
    // The signup trigger inserts a user_credits row with 100 free credits.
    // Give the trigger a moment, then try to self-grant extra credits.
    await new Promise((r) => setTimeout(r, 500));

    const { data, error } = await client
      .from("user_credits")
      .update({ purchased_credits: 1_000_000 })
      .eq("user_id", userId)
      .select();

    assert(
      error !== null || (Array.isArray(data) && data.length === 0),
      `authenticated self-UPDATE on user_credits unexpectedly succeeded: ${JSON.stringify(data)}`,
    );

    // Confirm via service role that nothing actually changed.
    const { data: row } = await adminClient
      .from("user_credits")
      .select("purchased_credits")
      .eq("user_id", userId)
      .maybeSingle();
    if (row) {
      assert(
        (row.purchased_credits ?? 0) < 1_000_000,
        "user_credits row was actually modified by an authenticated client",
      );
    }
  } finally {
    await deleteUser(adminClient, userId);
  }
  },
});

// ---------------------------------------------------------------------------
// airdrop_participants: unauthorized updates must be blocked
// ---------------------------------------------------------------------------
Deno.test("airdrop_participants: anon cannot UPDATE", async () => {
  const { data, error } = await anon()
    .from("airdrop_participants")
    .update({ tokens_claimed: 999_999 })
    .neq("user_id", "00000000-0000-0000-0000-000000000000")
    .select();

  assert(
    error !== null || (Array.isArray(data) && data.length === 0),
    `anon UPDATE on airdrop_participants unexpectedly succeeded: ${JSON.stringify(data)}`,
  );
});

Deno.test({
  name: "airdrop_participants: authenticated user cannot UPDATE rows",
  ignore: !HAS_SERVICE_ROLE,
  fn: async () => {
  const { client, userId, adminClient } = await createAuthedClient();
  try {
    const { data, error } = await client
      .from("airdrop_participants")
      .update({ tokens_claimed: 999_999 })
      .eq("user_id", userId)
      .select();

    assert(
      error !== null || (Array.isArray(data) && data.length === 0),
      `authenticated UPDATE on airdrop_participants unexpectedly succeeded: ${JSON.stringify(data)}`,
    );
  } finally {
    await deleteUser(adminClient, userId);
  }
  },
});

// ---------------------------------------------------------------------------
// cards table (forward-looking guard)
// ---------------------------------------------------------------------------
Deno.test({
  name: "cards: if table exists, anon SELECT must work and RLS must block anon writes",
  ignore: !HAS_SERVICE_ROLE,
  fn: async () => {
    const adminClient = admin();

    // Probe existence by selecting from cards with service role.
    const { error: probeErr } = await adminClient.from("cards").select("*").limit(1);
    if (probeErr && /relation .* does not exist|schema cache/i.test(probeErr.message)) {
      console.log("cards table not present — skipping (forward-looking guard).");
      return;
    }

  // Table exists. Anon should be able to read (public catalog).
  const { error: anonErr } = await anon().from("cards").select("*").limit(1);
  assertEquals(
    anonErr,
    null,
    `cards exists but anon SELECT failed — check GRANT/RLS policy: ${anonErr?.message}`,
  );

  // Anon must NOT be able to write.
  const { data: writeData, error: writeErr } = await anon()
    .from("cards")
    .update({ name: "pwned" })
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select();
  assert(
    writeErr !== null || (Array.isArray(writeData) && writeData.length === 0),
    "anon UPDATE on cards unexpectedly succeeded — RLS write policy missing",
  );
});
