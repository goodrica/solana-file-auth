# FilmAuth (FOT) — On-Chain Photo Authenticity

> **Cryptographic proof that a photo is real, anchored to Solana.**

FilmAuth lets anyone anchor a SHA-256 hash of a photo to the Solana
blockchain, then verify later that the photo hasn't been edited or
replaced. FOT is the utility token that powers the service — every
authentication burns 1 FOT, like a digital film negative.

This repository contains the public web app (filmauthtoken.com) and the
Supabase edge functions that orchestrate the on-chain writes. The
on-chain program that does the actual anchoring is private during
mainnet hardening; the public verification path is open here.

---

## What FOT does

1. User uploads a photo in the browser (or an autonomous AI agent produces a deliverable)
2. Computes the SHA-256 hash locally — **the file/payload never leaves the device for hashing**
3. Submits a Solana transaction that anchors the hash on-chain and burns 1 FOT
4. The caller receives a verifiable proof + Solscan link
5. Anyone can verify: "is the cryptographic hash of this output anchored on-chain?" — yes/no answer with proof

**Why burn?** A burned FOT can never be reused, so each authentication/deliverable is
provably unique. Total FOT supply monotonically decreases as the network
is used. The token is tied to real platform activity, not speculation.

---

## 🤖 A2A Trust & Internet Court Performance Bond

FilmAuth powers the **Agent-to-Agent (A2A) Trust & Bond Protocol**, enabling autonomous AI agents to transact, anchor deliverables, and settle escrows with cryptographic accountability:

- **Proof-of-Deliverable:** When an agent finishes a task (code, dataset, research), its hash is anchored on Solana and 1 FOT is burned.
- **Seller Performance Bond:** Agents stake FOT as a performance bond.
- **Dispute Resolution & Slashing:** Integrates with [Internet Court](https://github.com/internet-court/internet-court-skill) adjudication (GenLayer, Kleros, UMA). If deliverable fails empirical checks, seller bond is slashed.
- **SDK & CLI:** Run `npm run test:a2a` or `npx tsx src/lib/a2a-trust/cli.ts` (see [A2A Trust Specification](./docs/A2A_TRUST_SPEC.md) & [Internet Court Integration](./docs/INTERNET_COURT_INTEGRATION.md)).

```bash
# Agent CLI Quickstart
npx tsx src/lib/a2a-trust/cli.ts hash deliverable.json
npx tsx src/lib/a2a-trust/cli.ts propose-deal --buyer <PUBKEY> --seller <PUBKEY> --amount 1000000000 --bond 100
npx tsx src/lib/a2a-trust/cli.ts anchor --deal-id deal_abc123 --file deliverable.json
npx tsx src/lib/a2a-trust/cli.ts verify --file deliverable.json --hash <SHA256>
```

---

## Token (FOT)

| Field | Value |
|---|---|
| Symbol | FOT |
| Name | FilmAuth Token |
| Network | Solana (SPL) |
| Decimals | 9 |
| Initial supply | 1,000,000,000 FOT (1B) |
| Mint authority | **Revoked on mainnet** (active on devnet) |
| Freeze authority | **Revoked** |
| Standard | SPL Token + Token-2022 metadata |
| Utility price | $0.10 per FOT (1 FOT = 1 authentication) |

### Current deployment status

- **Devnet mint:** `4zaq8xFC2grs6u9q9gjSiQCPqmXCJeqKk9b1UiHzRovA` — for development only, no value
- **Mainnet mint:** TBD — see [MAINNET_LAUNCH.md](./MAINNET_LAUNCH.md) for the runbook
- **LP lock:** TBD — Streamflow lock proof will be linked here once mainnet launches
- **Verified supply cap:** 1B (will be hard-coded into the mint instruction, then mint authority revoked)

---

## Repository layout

```
.
├── src/                          # React + Vite frontend
│   ├── pages/                    # Route-level pages
│   │   ├── Index.tsx             # Landing
│   │   ├── Dashboard.tsx         # User auth/verify dashboard
│   │   ├── Tokenomics.tsx        # FOT tokenomics page
│   │   └── AdminDashboard.tsx    # Admin (auth-gated)
│   ├── components/
│   │   ├── FileAuthentication.tsx  # Hash + submit flow
│   │   ├── FileVerification.tsx    # Verify by hash
│   │   ├── FotTokenPurchase.tsx    # Buy FOT
│   │   ├── AirdropPromo.tsx        # Airdrop + referral
│   │   └── ...
│   └── integrations/supabase/    # Supabase client + types
├── supabase/
│   ├── functions/                # 7 Deno edge functions
│   │   ├── solana-file-auth/     # Main: write hash on-chain + burn FOT
│   │   ├── fot-token-purchase/   # FOT purchase flow
│   │   ├── verify/               # Hash lookup
│   │   ├── register/             # User signup
│   │   ├── process-airdrop/      # Airdrop distribution
│   │   ├── send-involvement-email/
│   │   └── security-smoke/       # Test harness
│   └── migrations/               # 11 SQL migrations (Aug 2025 – Jun 2026)
├── public/                       # Static assets
│   ├── assets/fot-logo.png
│   └── assets/fot-metadata.json  # Token-2022 metadata
└── .env.example                  # Environment template (no secrets)
```

---

## Local development

```bash
# Requirements: Node 20+, npm or bun
git clone https://github.com/goodrica/solana-file-auth.git
cd solana-file-auth

# Install
npm install    # or: bun install

# Set up environment
cp .env.example .env
# Edit .env: add your Supabase URL + anon key (see .env.example for what to fill)

# Run dev server
npm run dev
# → http://localhost:8080
```

For Supabase function work:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase   # or download from supabase.com

# Link to the project (requires project access)
supabase link --project-ref thfalxtopjlgpoiadcmt

# Run a single function locally
supabase functions serve solana-file-auth --no-verify-jwt
```

---

## Trust & verification

Before trusting FOT with anything, verify the project yourself:

| What to check | Where to look |
|---|---|
| Token exists on-chain | Solscan → search the mint address |
| Mint authority revoked | Solscan → mint page → "Mint Authority" should say "None" or "Disabled" |
| Freeze authority revoked | Solscan → mint page → "Freeze Authority" should say "None" or "Disabled" |
| LP locked | Streamflow lock page (linked in Tokenomics page) |
| Supply cap | Solscan → mint page → "Supply" should match the cap |
| Source code open | This repo |
| Smart contract audits | (TBD — see [SECURITY.md](./SECURITY.md) when published) |

If any of these are missing or different from what this README claims,
**the token may not be the one we control. Verify before interacting.**

---

## Deployment model

```
Browser (Vite)         Supabase (Auth + DB + Edge Functions)        Solana
─────────────────     ─────────────────────────────────────        ──────
SHA-256 hash in JS  →  Edge function: validate + build tx       →   Hash written
                       Look up user credits (DB)                     FOT burned
                       Verify balance (RPC)                         Tx confirmed
                       Sign + send tx (or return unsigned)            ↓
                                                                    Solscan link
                       ←  {authId, signature, timestamp}              returned
```

The user signs the Solana transaction in their own wallet. The
application never holds user funds or signs on the user's behalf.

---

## License

MIT — see [LICENSE](./LICENSE).

## Security disclosure

Email: security@filmauthtoken.com (or open a private security advisory
on GitHub). Do not file public issues for security bugs.

## Links

- Website: https://www.filmauthtoken.com
- Twitter/X: TBD
- Discord: TBD
- GitHub: https://github.com/goodrica/solana-file-auth
- Token registration: [TOKEN_REGISTRATION.md](./TOKEN_REGISTRATION.md)
- Mainnet launch runbook: [MAINNET_LAUNCH.md](./MAINNET_LAUNCH.md)
