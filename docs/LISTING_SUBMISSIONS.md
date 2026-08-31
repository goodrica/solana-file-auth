# Listing Submission Text — FOT

Copy-paste the relevant section into each registry's submission form.
**Don't fill these out until the mainnet mint is live and LP exists** —
most registries will reject submissions that point to devnet or have
no liquidity.

---

## Jupiter token list

GitHub: https://github.com/jup-ag/token-list

**File to add:** `src/tokens/filmauth.json`

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

**PR title:** `feat: add FOT (FilmAuth Token) — utility token for on-chain photo authentication`

**PR body:**

```
## Token
- Name: FilmAuth Token
- Symbol: FOT
- Mint: <MAINNET_MINT>
- Decimals: 9
- Network: Solana mainnet

## Verification
- Mint authority: revoked (verify on Solscan)
- Freeze authority: revoked
- Max supply: 1,000,000,000 FOT (hard-capped)
- Initial supply: 1,000,000,000 FOT
- LP: <LP_MINT> on <Raydium/Orca>
- LP lock: <STREAMFLOW_LOCK_URL>

## About
FOT is the utility token for FilmAuth (https://www.filmauthtoken.com), a
Solana-based service that anchors SHA-256 hashes of photos to the
blockchain. Each photo authentication burns 1 FOT, creating deflationary
pressure tied to real platform usage. Source code is open-source under MIT
license at https://github.com/goodrica/solana-file-auth.

## Contact
- GitHub: https://github.com/goodrica/solana-file-auth
- Twitter: <HANDLE>
- Discord: <INVITE>
```

---

## Solana token list

GitHub: https://github.com/solana-labs/token-list

**File to add:** Same format as Jupiter above. The file goes in
`src/tokens/solana.tokenlist.json` as part of the array.

---

## CoinGecko

URL: https://www.coingecko.com/en/coins/new

**Project name:** FilmAuth Token
**Symbol:** FOT
**Category:** Token
**Chain:** Solana

**Logo URL:** https://filmauthtoken.com/assets/fot-logo.png

**Description (short, ~250 chars):**
```
FilmAuth provides cryptographic proof of a photo's authenticity using the
Solana blockchain. FOT is the utility token: each photo authentication
burns 1 FOT. Open-source, MIT-licensed, max supply 1B.
```

**Description (long):**
```
FilmAuth is a Solana-based service that lets anyone anchor a SHA-256 hash
of a photo to the blockchain, then verify later that the photo hasn't
been edited or replaced. Use cases include: news organizations proving
photos weren't deepfaked, insurance documenting property condition, dating
apps verifying recent selfies, and creators timestamping their work.

FOT (FilmAuth Token) is the utility token that powers the service. Each
photo authentication burns 1 FOT, creating deflationary pressure directly
tied to platform usage. The token has a hard-capped supply of 1,000,000,000
units. Mint authority and freeze authority are both revoked on mainnet.
Liquidity provider (LP) tokens are locked on Streamflow.

The codebase is open-source under the MIT license at
https://github.com/goodrica/solana-file-auth. The front-end is deployed at
https://www.filmauthtoken.com.
```

**Tags / Categories:**
- Solana Ecosystem
- Utility Token
- Photo / Media
- Privacy / Security

**Links (fill in actual values):**
- Official website: https://www.filmauthtoken.com
- Whitepaper / docs: https://github.com/goodrica/solana-file-auth
- Twitter: <HANDLE>
- Telegram: <INVITE>
- Discord: <INVITE>
- GitHub: https://github.com/goodrica/solana-file-auth

**Contract address:** the mainnet mint

CoinGecko will email you within 1-4 weeks. They may ask for:
- Evidence of organic trading volume (DexScreener screenshots)
- Active social channels
- A direct wallet address for verification

---

## CoinMarketCap

URL: https://coinmarketcap.com/request/

**Project name:** FilmAuth Token
**Symbol:** FOT
**Chain:** Solana

**Description:** Same as CoinGecko long description.

**Logo URL:** https://filmauthtoken.com/assets/fot-logo.png

**Contract:** Mainnet mint

CMC is more strict than CoinGecko. You'll need:
- At least 1,000 organic holders (you will NOT have this at launch)
- Daily trading volume
- Active community

**Workaround:** CMC has a "request observation" tier that's more lenient.
Get listed there first, then upgrade to full listing once volume
materializes. Expect 4-12 weeks.

---

## DexScreener, Birdeye, CoinPaprika

These auto-index from on-chain data once your LP exists. No submission
needed, but you can claim the project page to add social links and
custom metadata.

- DexScreener: https://dexscreener.com/solana/<PAIR_ADDRESS>
- Birdeye: https://birdeye.so/token/<MAINNET_MINT>?chain=solana
- CoinPaprika: submit via their API

---

## Pre-submission checklist

- [ ] Mainnet mint deployed, both authorities revoked (verify on Solscan)
- [ ] LP created with $20,000+ initial liquidity
- [ ] LP tokens fully locked on Streamflow
- [ ] Logo image loads at the URL above (test in a fresh incognito tab)
- [ ] Metadata JSON loads and parses correctly
- [ ] All social links in the submission text are live
- [ ] README on the repo matches the submission description

If any of these are not done, the submission will be rejected or
auto-flagged as suspicious.
