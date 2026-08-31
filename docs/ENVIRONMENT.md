# Edge Function Environment Variables

Every Supabase Edge Function in this project reads from
`Deno.env.get(...)` and `import.meta.env.*` (frontend). The values
must be set in the Supabase dashboard under **Project Settings →
Edge Functions → Secrets**, and in `.env` (frontend) and `.env.example`
(template).

## Required for all functions

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | Auto-injected by Supabase | The Supabase project URL |
| `SUPABASE_ANON_KEY` | Auto-injected by Supabase | Used for user-auth JWT verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase | Used for writes that bypass RLS |
| `SOLANA_RPC_URL` | Set per function (in code, fallback to public mainnet) | RPC endpoint for Solana reads/writes |

## Per-function

### `fot-token-purchase` (writes — verify before crediting)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `FOT_TREASURY_ADDRESS` | **Yes** | `YourMainnetWalletAddress...` | Wallet that receives SOL/FOT for purchases |
| `FOT_MINT_ADDRESS` | **Yes** | `MainnetMintAddress...` | Mainnet FOT mint. Must match the token deployed via MAINNET_LAUNCH.md |
| `ALLOWED_ORIGIN` | Recommended | `https://www.filmauthtoken.com` | CORS allow-list |

### `solana-file-auth` (writes — DB only, not on-chain)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `ALLOWED_ORIGIN` | Recommended | `https://www.filmauthtoken.com` | CORS allow-list |

No other secrets needed — this function does not sign or submit
transactions. The actual on-chain write is in `register`.

### `process-airdrop` (admin-only)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `ALLOWED_ORIGIN` | Recommended | `https://www.filmauthtoken.com` | CORS allow-list |

Admin role is set per-user in the `user_profiles` table:
```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE user_id = 'YOUR_USER_ID';
```

### `register` (writes on-chain)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `SERVICE_SECRET_JSON` | **Yes** | `[12,34,56,...]` (64-byte array) OR base58 string | The service wallet's secret key. Used to sign the memo transaction. **Rotate quarterly.** |
| `SOLANA_CLUSTER` | No | `mainnet-beta` | Logged in tx output. Defaults to mainnet-beta. |
| `ALLOWED_ORIGIN` | Recommended | `https://www.filmauthtoken.com` | CORS allow-list |

### `verify` (public read-only)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `ALLOWED_ORIGIN` | Recommended | `https://www.filmauthtoken.com` | CORS allow-list |

### `send-involvement-email`

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `RESEND_API_KEY` | **Yes** | `re_xxxxxx` | Resend (email service) API key |
| `ALLOWED_ORIGIN` | Recommended | `https://www.filmauthtoken.com` | CORS allow-list |

## Frontend env vars (`.env` / `.env.example`)

The Vite frontend reads from `import.meta.env.VITE_*` (must have
`VITE_` prefix to be exposed to the browser).

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Yes | `https://thfalxtopjlgpoiadcmt.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | `eyJ...` (anon/publishable key) | Supabase client auth |
| `VITE_SUPABASE_PROJECT_ID` | Yes | `thfalxtopjlgpoiadcmt` | Display only |
| `VITE_FOT_MINT_DEVNET` | No | `4zaq8x...` | Devnet mint for testing |
| `VITE_FOT_MINT_MAINNET` | No | `MainnetMint...` | **Set after mainnet launch.** When non-empty, Tokenomics page flips to mainnet and hides the devnet warning |
| `VITE_FOT_PRICE_USD` | No | `0.10` | Display price |
| `VITE_STATCOUNTER_PROJECT` | No | `13169249` | Statcounter project ID |
| `VITE_STATCOUNTER_SECURITY` | No | `3acdd18b` | Statcounter security token |

## Security checklist before going live

- [ ] All `VITE_*` env vars set in deployed environment
- [ ] All Deno secrets set in Supabase function settings
- [ ] `ALLOWED_ORIGIN` set to `https://www.filmauthtoken.com` (or your custom domain)
- [ ] `FOT_TREASURY_ADDRESS` and `FOT_MINT_ADDRESS` set to your actual values
- [ ] `SERVICE_SECRET_JSON` rotated from any dev value
- [ ] Supabase RLS policies reviewed for `processed_transactions`, `purchase_audit`, `user_profiles.role`
- [ ] Migration `20260830000000_security_hardening.sql` applied to the production DB
- [ ] All existing rows in `user_profiles` have `role = 'user'` by default (migration handles this)
- [ ] At least one user manually promoted to `role = 'admin'` for `process-airdrop`
