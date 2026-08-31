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

- [ ] **Jupiter token list** — submit to https://github.com/jup-ag/token-list
- [ ] **Solana token list** — submit to https://github.com/solana-labs/token-list
- [ ] **CoinGecko** — https://www.coingecko.com/en/coins/new
- [ ] **CoinMarketCap** — https://coinmarketcap.com/request/
- [ ] **Birdeye** — automatic once Jupiter-verified
- [ ] **DexScreener** — automatic once LP exists

## How to submit (after mainnet)

### Jupiter token list

1. Fork https://github.com/jup-ag/token-list
2. Add a new file under `src/tokens/`:
   ```json
   {
     "address": "MAINNET_MINT_HERE",
     "chainId": 101,
     "decimals": 9,
     "name": "FilmAuth Token",
     "symbol": "FOT",
     "logoURI": "https://filmauthtoken.com/assets/fot-logo.png",
     "tags": ["utility", "file-authentication"]
   }
   ```
3. Open a pull request with the link to the lock proof and a brief
   description. Jupiter reviews within ~3-5 days.

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
