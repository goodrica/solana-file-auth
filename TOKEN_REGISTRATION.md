# FOT Token Registration Guide

This document tracks where FOT has been registered, where it's been
submitted, and what's still pending. Keep this in sync as submissions
go in.

## Token Information

| Field | Value |
|---|---|
| Token Name | FilmAuth Token |
| Symbol | FOT |
| Decimals | 9 |
| Network | Solana (SPL) |
| Initial supply | 1,000,000,000 |
| Mint authority | Revoked on mainnet (active on devnet) |
| Freeze authority | Revoked |
| Standard | SPL Token + Token-2022 metadata |

## Mint addresses

| Network | Mint address | Status |
|---|---|---|
| Devnet | `4zaq8xFC2grs6u9q9gjSiQCPqmXCJeqKk9b1UiHzRovA` | Live (test only) |
| Mainnet | TBD — see [MAINNET_LAUNCH.md](./MAINNET_LAUNCH.md) | Not deployed |

**Do not** use the devnet mint for production. Devnet tokens have no
real value and can be reset by the Solana Foundation at any time.

## Repository & metadata

- **Repository:** https://github.com/goodrica/solana-file-auth
- **Logo URL:** `https://filmauthtoken.com/assets/fot-logo.png`
- **Metadata URL:** `https://filmauthtoken.com/assets/fot-metadata.json`
- **Website:** https://www.filmauthtoken.com
- **Lovable preview (deprecated):** https://filmauth.lovable.app

## Registration status

### ✅ Done

- [x] Token created on devnet
- [x] Token-2022 metadata published at `public/assets/fot-metadata.json`
- [x] Public repo open-source
- [x] MIT license added

### 🟡 In progress

- [ ] Token deployed to mainnet (see MAINNET_LAUNCH.md)
- [ ] Mint authority revoked on mainnet
- [ ] Initial LP created on Raydium/Orca
- [ ] LP tokens locked on Streamflow

### ⏳ Pending (after mainnet launch)

- [ ] **Jupiter** — token page appears automatically at `jup.ag/tokens/<MINT>`
      once LP exists; verification (checkmark) needs community **smart likes**.
      No application: the `jup-ag/token-list` PR repo is deprecated/closed.
- [ ] **CoinGecko** — https://www.coingecko.com/en/coins/new
- [ ] **CoinMarketCap** — https://coinmarketcap.com/request/
- [ ] **Birdeye** — automatic once LP + Jupiter page exist
- [ ] **DexScreener** — automatic once LP exists

## How to submit (after mainnet)

### Jupiter

No submission needed. Once the Raydium/Orca LP exists, the token is
tradeable on Jupiter and its page lives at
`https://jup.ag/tokens/<MAINNET_MINT>`.

**Verification** (the checkmark badge) comes from Jupiter Verify: tokens
with organic score and community **smart likes** on that page get
verified. Steps:

1. Post the launch thread with the mint address, tagging
   `@JupiterExchange` (attestation tweet — keep the URL).
2. Ask holders/community to open the token page and smart-like it.
3. The PR-based `jup-ag/token-list` repo is **deprecated — all PRs are
   closed**; do not submit there.

### CoinGecko

Go to https://www.coingecko.com/en/coins/new and submit with:
- **Contract address:** the mainnet mint
- **Project name:** FilmAuth Token
- **Symbol:** FOT
- **Category:** Token
- **Logo:** the URL above (must be 128×128 or larger, square)
- **Description:** "FilmAuth provides cryptographic proof of a photo's
  authenticity using the Solana blockchain. FOT is the utility token:
  each photo authentication burns 1 FOT."
- **Official website:** https://www.filmauthtoken.com
- **GitHub:** https://github.com/goodrica/solana-file-auth

CoinGecko's free listing takes 1-4 weeks for review. They may ask for
evidence of trading volume, holders, or organic community.

### CoinMarketCap

Same flow at https://coinmarketcap.com/request/. CMC is more strict
about minimum market cap and trading volume; expect to wait longer.

## File structure

```
public/assets/
├── fot-logo.png        # 512x512 PNG logo (use this for registry submissions)
└── fot-metadata.json   # Token-2022 metadata
```
