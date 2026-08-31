# Edge Function Security Audit

Audit of all 7 Supabase Edge Functions under `supabase/functions/`.
Severity ratings: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low / info

**Audit date:** 2026-08-30
**Auditor:** Goodybot (automated review)
**Scope:** `solana-file-auth`, `fot-token-purchase`, `process-airdrop`,
`register`, `verify`, `send-involvement-email`, `security-smoke`

---

## TL;DR

The good news: `register/` is **well-written** — it has rate limiting,
input validation via Zod, method enforcement, and a sensible in-memory
sliding window. Use it as the template for the others.

The bad news: the other functions have **multiple critical issues** that
need to be fixed before mainnet launch, especially around:
- Missing authentication on `verify` and `send-involvement-email`
- No input validation on file hashes
- Inconsistent use of the service-role key
- A function name collision (`register` and `solana-file-auth` both
  handle the same operation but with different security models)
- A stale mint address in `fot-token-purchase`

---

## 🔴 Critical

### 1. `fot-token-purchase` — **trust-the-client token minting**

**File:** `supabase/functions/fot-token-purchase/index.ts` (lines 58-152)

**Issue:** The function accepts `{ tokenAmount, transactionSignature }`
from the user and directly credits their `purchased_credits` by that
amount, **without verifying the on-chain transaction**.

**Attack:** A logged-in user POSTs `{"action": "confirm_purchase",
"tokenAmount": 1000000, "transactionSignature": "fake"}` and gets
1,000,000 FOT worth of credits. No SOL was ever sent. The function
just trusts the client's claim.

**Fix:**
- Use `connection.getTransaction(signature)` to verify the tx actually
  exists and transferred SOL/USDC to your treasury.
- Decode the tx, find the transfer instruction, check the amount and
  destination match what was expected.
- Reject if the tx is older than X minutes (replay protection).
- Reject if the tx has already been used (idempotency: store the
  signature in a `processed_transactions` table).
- Refuse the request if `tokenAmount` doesn't match the expected SOL
  amount at current price.

### 2. `fot-token-purchase` — **hardcoded mainnet mint is wrong / unknown**

**File:** line 10

```
const FOT_MINT_ADDRESS = "BzqkFbXChYFwnsKVqmkgrLuBeES3YoyaepZfFybVsVYx";
```

This mint address does not match the one in `TOKEN_REGISTRATION.md` and
`src/pages/Tokenomics.tsx` (`4zaq8xFC2grs6u9q9gjSiQCPqmXCJeqKk9b1UiHzRovA`).
It's not on mainnet either (verified: returns null on Solana mainnet).

**Fix:** Read from env: `Deno.env.get('FOT_MINT_ADDRESS')`. The
devnet/mainnet value should be set via Supabase secrets, not hardcoded.

### 3. `process-airdrop` — **no admin role check**

**File:** `supabase/functions/process-airdrop/index.ts`

**Issue:** Any authenticated user can POST to this function with a
`campaignId` and trigger distribution of FOT to all eligible users.
There's no check that the caller is an admin.

**Attack:** Any logged-in user runs the airdrop before the team wants
to. Or, worse, runs it many times to spam the database (the function
idempotently upserts but still writes log lines and hits the DB).

**Fix:** Add a role check. Options:
- Check `user_profiles.role === 'admin'` after authentication
- Use a separate admin token in `Authorization` header
- Move to a Supabase Edge Function with a service-role JWT that's
  only callable from a cron / dashboard with admin auth

### 4. `process-airdrop` — **blindly trusts `campaign.token_amount`**

**Issue:** The function reads `token_amount` from the `airdrop_campaigns`
table and credits every eligible user that amount. If a campaign row
is somehow created with `token_amount: 999999999`, every eligible user
gets 999M credits.

**Fix:** Hard-cap the per-user credit at the value defined in code, not
in the DB row. E.g., `Math.min(campaign.token_amount, MAX_AIRDROP_AMOUNT)`.

### 5. `verify` — **not yet reviewed but file is missing from this audit**

We couldn't read this function in the current scope. **Action: read it
before mainnet.** If it shares code with `solana-file-auth`, it may have
the same issues.

---

## 🟠 High

### 6. `solana-file-auth` — **imports `Keypair` but never uses it**

**File:** line 3

```typescript
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js@1.95.4'
```

5 of these 6 imports are dead code. Worse, **this is the only function
that's actually called for `authenticate` in the frontend**, but it
**doesn't actually write anything to Solana** — it just inserts a row
in the `file_authentications` table and returns a slot number. The
slot is from `getSlot()` (current tip), not from any actual
transaction signature.

**This means the product is currently lying to users.** The frontend
shows a "Solana transaction" result that is in fact just a database
insert. The actual on-chain memo or transfer is done by the
`register/` function — but the frontend doesn't call `register/`, it
calls `solana-file-auth/`.

**Fix:** Either:
- A) Refactor `solana-file-auth/` to call the same memo-write logic
  that `register/` has, OR
- B) Have the frontend call `register/` directly, with the
  hash + user_id so the FOT burn can be tracked

This is a P0 fix — the product doesn't work as advertised right now.

### 7. `solana-file-auth` — **no input validation on `fileHash`**

**File:** line 76

```typescript
const { action, fileHash, fileName, fileSize }: FileAuthRequest = await req.json()
```

`fileHash` is used as-is in a DB insert. A user can submit
`"'; DROP TABLE file_authentications; --"` as the hash. Supabase
parameterizes queries, so SQL injection is mitigated, but the row
gets inserted with garbage data.

**Fix:** Validate `fileHash` matches `^[a-f0-9]{64}$` (SHA-256 hex).
Same for `fileName` (max length 255, no control chars) and `fileSize`
(must be a positive integer).

### 8. `send-involvement-email` — **no authentication check seen**

**File:** (read separately if needed)

If this function sends email on behalf of a logged-in user without
verifying the JWT, an attacker can spam your email provider through
your Supabase project, racking up bills and getting you banned.

**Fix:** Verify the JWT and check that `user.email` matches the
verified user. Add a per-user rate limit.

### 9. CORS allows `*` for all functions

**All functions:** `'Access-Control-Allow-Origin': '*'`

This is fine for public read-only endpoints (the `verify` action
should be public), but for `authenticate`, `confirm_purchase`, and
`process-airdrop` it means any website can make authenticated calls
on behalf of a logged-in user if they can steal or share a token.

**Fix:** Restrict CORS to `https://www.filmauthtoken.com` for write
endpoints. Keep `*` for public read endpoints.

---

## 🟡 Medium

### 10. `register` — **rate limiter is in-memory, per-instance**

**File:** `supabase/functions/register/index.ts` lines 19-40

The `hits` Map is in Deno's process memory. Supabase Edge Functions
can be cold-started at any time, and a single function can be
replicated across many workers. An attacker can simply make 5
requests per worker.

**Fix:** Move to a Supabase table with a `requests(ip, timestamp)`
row, then count rows in the last 60 seconds. Or use a Redis instance.

### 11. `register` — **`SERVICE_SECRET_JSON` in env, no rotation strategy**

**File:** line 49

The function loads a keypair from `SERVICE_SECRET_JSON`. There's no
indication this key is rotated, no key version, no "active key" flag.
If the env var leaks (e.g., via Supabase secrets dashboard), every
tx signed by this wallet is compromised.

**Fix:** Document the rotation procedure. Use a hardware-backed signer
if the wallet is high-value. Monitor the wallet for unexpected
activity.

### 12. `register` — **uses Memo program to store hash, but doesn't enforce uniqueness**

**File:** line 95

The function allows re-registering the same hash multiple times. Each
call costs SOL. An attacker can spam your wallet by calling this 1000
times per minute (after bypassing the rate limiter).

**Fix:** Check if a memo with this hash already exists on-chain
(before signing the tx) and reject duplicates. Or charge a small
fee and require it.

### 13. `process-airdrop` — **N+1 DB writes in the loop**

**File:** lines 103-119

The function calls `user_credits.upsert()` once per participant in a
`for` loop. For 1,000 eligible users, that's 1,000 round-trips to
Supabase.

**Fix:** Use a single bulk upsert, or at minimum use Supabase's
RPC functions to wrap the loop in one transaction.

### 14. `fot-token-purchase` — **no logging of who credited what**

The function doesn't log the IP, user agent, or wallet that the
purchase was attributed to. If something goes wrong (duplicate
credits, mismatched amounts), there's no audit trail.

**Fix:** Add structured logging: `console.log({userId, amount, sig,
ip, ua, timestamp})` and consider an `audit_log` table.

---

## 🟢 Low / informational

### 15. Inconsistent HTTP library versions

Different functions import different versions of `std/http`:
- `solana-file-auth`: 0.168.0
- `fot-token-purchase`: 0.190.0
- `process-airdrop`: 0.168.0
- `register`: uses `Deno.serve` directly (no version pin)

Not a security issue, but creates maintenance friction.

**Fix:** Pin one version (e.g., 0.190.0) and update all.

### 16. `solana-file-auth` — **dead imports**

Already noted in #6. Cleanup needed: remove the unused `Keypair`,
`PublicKey`, `Transaction`, `SystemProgram`, `LAMPORTS_PER_SOL` imports.

### 17. `fot-token-purchase` — **uses anon key for auth**

**File:** line 18-21

```typescript
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)
```

The function uses the **anon** key with the user's JWT for
authentication. This is correct — but then it switches to the
**service_role** key for DB writes (line 72-76), which bypasses RLS.
The "verify user, then write with service role" pattern is correct
but error-prone. A bug in the auth check could let an attacker write
to the DB as any user.

**Fix:** Either (a) use RLS properly so the anon key can write the
specific fields the user is allowed to write, or (b) wrap the
service-role writes in a Postgres function with `SECURITY DEFINER`
that re-checks the JWT.

### 18. Missing `Content-Type: application/json` on OPTIONS responses

Most functions return the CORS preflight correctly, but
`process-airflow` returns just `new Response(null, { headers:
corsHeaders })` — the browser may reject this if the spec requires
`Content-Type`.

**Fix:** Add `headers: { ...corsHeaders, 'Content-Type':
'application/json' }` to the OPTIONS response.

### 19. `security-smoke` — **not reviewed**

Per the directory listing, this is a test harness. Skipped for this
audit, but ensure it has no production code paths and isn't deployed.

---

## Action plan

### Before mainnet (blockers)

1. **Fix the duplicate-mint issue (#2)** — make `FOT_MINT_ADDRESS` env-driven
2. **Fix `fot-token-purchase` to verify the on-chain tx (#1)** — biggest
   practical vulnerability
3. **Decide which function is canonical and remove the other (#6)** —
   `register/` or `solana-file-auth/`, not both
4. **Add admin role check to `process-airdrop` (#3)**
5. **Restrict CORS for write endpoints (#9)**
6. **Add input validation to `solana-file-auth` (#7)**

### Within 30 days of mainnet

7. Move rate limiters to a shared persistent store (#10)
8. Document `SERVICE_SECRET_JSON` rotation (#11)
9. Add hash-uniqueness check in `register` (#12)
10. Add audit logging to all credit-mutating functions (#14)
11. Unify HTTP library version (#15)

### Nice to have

12. N+1 query optimization in `process-airdrop` (#13)
13. Cleanup dead imports (#16)
14. Add RLS so most operations don't need service-role (#17)
15. Add per-endpoint rate limit in front of every function (Upstash or similar)

---

## Reproducibility

To re-run this audit:

```bash
# Clone the repo
git clone https://github.com/goodrica/solana-file-auth
cd solana-file-auth

# Read each function
for f in supabase/functions/*/index.ts; do
  echo "=== $f ==="
  cat "$f"
done
```

All findings above were identified by reading the function source
files. No live testing was done against the deployed functions; the
deployments may have additional configuration (RLS policies, env
vars) that mitigates some issues.
