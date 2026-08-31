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

## Step 1 — Mint the token on mainnet

Use `spl-token` CLI (install with `npm install -g @solana/spl-token`):

```bash
# Create the mint. Authority is your chosen wallet.
spl-token create-token \
  --decimals 9 \
  --url "https://filmauthtoken.com/assets/fot-metadata.json" \
  --fee-payer ~/.config/solana/id.json \
  --mint-authority ~/.config/solana/id.json \
  --freeze-authority ~/.config/solana/id.json

# Save the resulting mint address — this is your mainnet mint.
MAINNET_MINT="PASTE_NEW_MINT_ADDRESS_HERE"
echo "Mainnet mint: $MAINNET_MINT"
```

**Verify:** Search `$MAINNET_MINT` on https://solscan.io. The page
should show:
- Supply: 0 (nothing minted yet)
- Decimals: 9
- Mint authority: your wallet address
- Freeze authority: your wallet address
- Token-2022 metadata: pointing to the URL above (if the metadata URL
  doesn't resolve, Solscan will show a broken icon — fix the URL first)

## Step 2 — Mint the initial supply

```bash
# Create the associated token account for your treasury
TREASURY="YOUR_TREASURY_WALLET_ADDRESS"
spl-token create-account $MAINNET_MINT --owner $TREASURY

# Mint the full supply to the treasury (no decimals — uses smallest unit)
# 1B FOT * 10^9 = 1_000_000_000_000_000_000
spl-token mint $MAINNET_MINT 1000000000000000000 \
  --recipient $TREASURY \
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

The site and repo currently point at the devnet mint. Replace:

1. **`src/pages/Tokenomics.tsx`** — replace the devnet mint with the
   mainnet one; remove the "devnet only" banner; add the lock URL
2. **`src/components/FotTokenPurchase.tsx`** — same
3. **`public/assets/fot-metadata.json`** — already mainnet-agnostic
4. **`src/integrations/supabase/types.ts`** — update any hardcoded mints
5. **`.env`** (and `.env.example`) — set `VITE_FOT_MINT_MAINNET`
6. **README.md** — update the token table

## Step 7 — Submit to registries

See [TOKEN_REGISTRATION.md](./TOKEN_REGISTRATION.md) for the exact
text to use. Order:

1. **Jupiter** (most important for DEX trading)
2. **Solana token list** (for wallet recognition)
3. **CoinGecko** (free listing, takes 1-4 weeks)
4. **CoinMarketCap** (slower, stricter)
5. **Birdeye** (auto-indexes after Jupiter)
6. **DexScreener** (auto-indexes when LP exists)

## Step 8 — Announce

- Tweet the launch thread (see `LAUNCH_THREAD.md` when ready)
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
