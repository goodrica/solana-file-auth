// Placeholder edge function so the security-smoke test directory is recognized
// by the Supabase functions test runner. The real logic lives in
// `security_smoke_test.ts` alongside this file.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({
      ok: true,
      message:
        "security-smoke is a test-only function. Run via supabase--test_edge_functions.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
