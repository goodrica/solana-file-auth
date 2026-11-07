# Mainnet Launch Runbook — FOT

> Step-by-step procedure for deploying FOT to Solana mainnet.
> Every step is verifiable. Do not skip verification.

## Pre-flight checklist

- [ ] Decide which wallet will own the mint authority (will be revoked)
- [ ] Decide final max supply (recommended: 1,000,000,000 FOT)
- [ ] Decide initial LP size (recommended: $20,000+ in SOL equivalent)
- [ ] Decide initial FOT distribution (treasury / team / airdrop split)
- [ ] Set up Streamflow account (https://streamflow.finance)
- [ ] Set up Raydium or Orca LP (https://raydium.io or https://www.orca.so)
- [ ] Back up the mint authority wallet's seed phrase OFFLINE
- [ ] Fund the fee-payer wallet (~2–4 SOL covers mint rent, metadata, and fees)
- [ ] Confirm both URLs are live: `assets/fot-logo.png` and `assets/fot-metadata.json`
      on https://filmauthtoken.com (the mint's metadata URI points there)

## Step 1 — Mint the token on mainnet

Use `spl-token` CLI (install/update with `npm install -g @solana/spl-token`;
`--enable-metadata` and `initialize-metadata` need spl-token ≥ 0.4.0 —
check with `spl-token --version`):

```bash
# 1a. Create the Token-2022 mint with the metadata extension enabled.
#     (--url is the RPC/cluster flag — NOT metadata. Metadata is added
#     with --enable-metadata here and populated via initialize-metadata.)
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --decimals 9 \
  --enable-metadata \
  --fee-payer ~/.config/solana/id.json \
  --mint-authority ~/.config/solana/id.json \
  --freeze-authority ~/.config/solana/id.json

# 1b. Save the resulting mint address — this is your mainnet mint.
MAINNET_MINT="PASTE_NEW_MINT_ADDRESS_HERE"
echo "Mainnet mint: $MAINNET_MINT"

# 1c. Populate the on-mint metadata (name, symbol, URI -> the hosted JSON).
spl-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  initialize-metadata $MAINNET_MINT \
  "FilmAuth Token" "FOT" \
  "https://filmauthtoken.com/assets/fot-metadata.json"
```

**Verify:** Search `$MAINNET_MINT` on https://solscan.io. The page
should show:
- Program: Token-2022 (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`)
- Supply: 0 (nothing minted yet)
- Decimals: 9
- Metadata: name "FilmAuth Token", symbol "FOT", URI resolving to the
  hosted JSON above (broken icon = the URI doesn't resolve — fix first)
- Mint authority: your wallet address
- Freeze authority: your wallet address

## Step 2 — Mint the initial supply

```bash
# Create the treasury's associated token account and CAPTURE its address —
# --recipient below needs the TOKEN ACCOUNT, not the owner wallet.
TREASURY="YOUR_TREASURY_WALLET_ADDRESS"
TREASURY_ATA="$(spl-token create-account $MAINNET_MINT --owner $TREASURY \
  --fee-payer ~/.config/solana/id.json | awk '/Creating account/ {print $3}')"
echo "Treasury token account: $TREASURY_ATA"

# Mint the full supply into it (no decimals — uses the smallest unit)
# 1B FOT * 10^9 = 1_000_000_000_000_000_000
spl-token mint $MAINNET_MINT 1000000000000000000 \
  --recipient "$TREASURY_ATA" \
  --mint-authority ~/.config/solana/id.json
```

**Verify:** On Solscan, the mint's supply should now show
`1000000000.000000000` (1B FOT).

## Step 3 — Revoke the authorities

This is the most important step. **Once revoked, no one — including
you — can ever mint more FOT or freeze any wallet's tokens.**

```bash
# Disable mint authority (cannot be re-enabled)
spl-token authorize $MAINNET_MINT mint --disable

# Disable freeze authority (cannot be re-enabled)
spl-token authorize $MAINNET_MINT freeze --disable
```

**Verify:** On Solscan, both "Mint Authority" and "Freeze Authority"
should now say "None" or show a disabled state. **This is permanent.
You cannot undo this.** Make sure the supply is correct first.

## Step 4 — Set up the LP

Decide your split. A common pattern:

| Side | Amount | % |
|---|---|---|
| FOT | 200,000,000 (20% of supply) | 50% |
| SOL (or USDC) | ~$10,000 worth | 50% |
| Total LP value | ~$20,000 | — |

```bash
# Option A: Raydium (CLMM, more features)
# → https://raydium.io/liquidity-pools/

# Option B: Orca (Whirlpools, simpler)
# → https://www.orca.so/pools

# After creating the pool, you'll receive LP tokens.
# SAVE the LP token mint address.
LP_MINT="PASTE_LP_TOKEN_MINT_HERE"
```

**Verify:** The pool should show on https://dexscreener.com within
a few minutes. Take a screenshot — you'll need it for token
registration.

## Step 5 — Lock the LP on Streamflow

```bash
# 1. Go to https://streamflow.finance/finance/lock
# 2. Connect your wallet
# 3. Select "Lock" → "LP token"
# 4. Choose your LP token mint ($LP_MINT from step 4)
# 5. Enter the amount of LP tokens to lock (lock ALL of them)
# 6. Set unlock date: at least 6 months out, ideally 12+
# 7. Confirm the transaction
# 8. SAVE the lock URL Streamflow gives you
LOCK_URL="https://streamflow.finance/finance/lock/PASTE_HERE"
```

**Verify:** Open the lock URL. It should show:
- Token: your LP token mint
- Amount locked
- Unlock date
- Your wallet as the locker

Anyone can view this URL. **This is the proof that you cannot rug.**

## Step 6 — Update all references

Run the cutover script (it flips `.env`, TOKEN_REGISTRATION.md, and
generates the registry metadata entry):

```bash
./scripts/cutover-to-mainnet.sh "$MAINNET_MINT" "$LOCK_URL"
```

The front-end switches to mainnet automatically when
`VITE_FOT_MINT_MAINNET` is non-empty (Tokenomics devnet banner hides
itself). Still check by hand:

1. **`src/pages/Tokenomics.tsx`** — verify the flip rendered; add the
   Streamflow lock URL where the page wants it
2. **`src/components/FotTokenPurchase.tsx`** — verify it uses the
   mainnet mint from env
3. **`public/assets/fot-metadata.json`** — already mainnet-agnostic
4. **`src/integrations/supabase/types.ts`** — check for hardcoded devnet mints
5. **`.env.example`** — document the new value (`.env` itself is gitignored)
6. **README.md** — update the token table

Then `npm run build` and deploy the site.

## Step 7 — Submit to registries

See [TOKEN_REGISTRATION.md](./TOKEN_REGISTRATION.md) and the copy-paste
pack in `launch-assets/REGISTRATION_COPY_PASTE.md`. Order:

1. **Jupiter** — no application: the page appears automatically at
   `jup.ag/tokens/<MINT>` once the LP exists; push community **smart
   likes** there for the verified badge (the old token-list PR repo is
   deprecated/closed)
2. **DexScreener** (auto-indexes when LP exists — claim the profile)
3. **Birdeye** (auto-indexes)
4. **CoinGecko** (free listing, takes 1-4 weeks)
5. **CoinMarketCap** (slower, stricter)

## Step 8 — Announce

- Tweet the launch thread (`LAUNCH_THREAD.md` — draft ready, review and
  post on launch day; do not post before the mint is live)
- Post in the project Discord (when set up)
- Submit to r/CryptoCurrency and r/Solana (if appropriate)
- Email the early airdrop list

## Step 9 — Verify everything from a clean wallet

Use a fresh wallet you haven't used before:

1. Buy a small amount of FOT on Jupiter/DEX
2. Try to authenticate a test photo
3. Verify the burn on Solscan (FOT balance should decrease)
4. Verify the hash is on-chain
5. Try to verify that hash from a different wallet
6. Try to sell — confirm the LP works

## Things to NEVER do

- Never re-enable the mint authority after revoking it (impossible,
  but make sure the supply is right first)
- Never transfer the LP tokens out of the Streamflow lock (the
  lock contract is ownerless; once you deposit, no one can withdraw
  early)
- Never change the token metadata after submission (wallets and
  registries cache it; updates take days/weeks to propagate)
- Never list a different token on CoinGecko/CMC under the FOT name
  (this will get the new token blacklisted as an "impersonator")

## Rollback plan

If something goes wrong during mainnet deploy:

- **Before Step 3 (revoke):** you can burn or transfer any tokens,
  update the supply, change authorities, etc. Nothing is permanent.
- **After Step 3 (revoke):** the supply is fixed forever. You cannot
  add more FOT, but you CAN still transfer tokens you hold. So if
  you discover a bug, you can still move tokens to a recovery
  address.
- **After Step 5 (LP lock):** the LP cannot be pulled. You can still
  trade FOT personally, but the LP stays locked. This is the
  commitment point — once you lock, you're committed.

## After launch

Monitor these daily for the first week, weekly after that:

- Holder count (Solscan → Holders)
- Top 10 holder concentration (should stay <50%)
- LP size and depth (DexScreener)
- Daily authentication volume (admin dashboard)
- Community sentiment (Discord / Telegram / X)
- Any security disclosures (security@filmauthtoken.com)
