# Registry Submission Copy-Paste Pack

Ready-to-use text for submitting FOT immediately after generating the mainnet mint.

---

### 1. Jupiter (no application — organic verification)
- The old `jup-ag/token-list` PR flow is **deprecated — all PRs are closed**.
- Once the LP exists, the token page appears automatically at:
  `https://jup.ag/tokens/<MAINNET_MINT>`
- **Verification** (the checkmark) is driven by Jupiter Verify: organic score +
  community **smart likes** on that token page. Ask holders/community to like it.
- A tweet from the project account attesting the mint address (tagging
  `@JupiterExchange`) helps reviewers; keep the URL of that tweet.
- Registry metadata for exchange uploads: see generated
  `launch-assets/jupiter-token-entry.json`

---

### 2. CoinGecko Application
- **URL:** `https://www.coingecko.com/en/coins/new`
- **Name:** FilmAuth Token
- **Symbol:** FOT
- **Blockchain:** Solana
- **Contract Address:** `<MAINNET_MINT>`
- **Description:**
  ```text
  FilmAuth Token (FOT) is the utility token powering on-chain file authentication and deliverable verification on Solana. Each photo, dataset, or document authenticated creates an immutable SHA-256 cryptographic anchor on Solana, preventing tampering and enabling trustless agent-to-agent contract settlement.
  ```
- **Website:** `https://www.filmauthtoken.com`
- **Explorer:** `https://solscan.io/token/<MAINNET_MINT>`
- **GitHub:** `https://github.com/goodrica/solana-file-auth`

---

### 3. DexScreener / Birdeye Update Info
- **DexScreener:** Automatic once Raydium/Orca LP is created. (Optional: Claim profile via DexScreener dashboard using Twitter/Website verification).
- **Birdeye:** Indexed automatically from Jupiter.
