#!/usr/bin/env bash
# Cutover script: flips the repository references from Devnet to Mainnet.
#
# Usage:
#   ./scripts/cutover-to-mainnet.sh <MAINNET_MINT_ADDRESS> <STREAMFLOW_LOCK_URL>
#
# Run AFTER the mint is live and LP is locked (see MAINNET_LAUNCH.md).
# Safe to re-run: every replacement is idempotent once the values are set.

set -euo pipefail

if [ -z "${1:-}" ] || [ -z "${2:-}" ]; then
  echo "Usage: ./scripts/cutover-to-mainnet.sh <MAINNET_MINT_ADDRESS> <STREAMFLOW_LOCK_URL>"
  exit 1
fi

MINT="$1"
LOCK_URL="$2"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Updating FilmAuth codebase for Mainnet: $MINT"

# --- .env: the front-end flips to mainnet automatically when
#     VITE_FOT_MINT_MAINNET is non-empty (Tokenomics banner hides itself).
if [ -f "$ROOT_DIR/.env" ]; then
  sed -i "s#^VITE_FOT_MINT_MAINNET=.*#VITE_FOT_MINT_MAINNET=\"$MINT\"#" "$ROOT_DIR/.env" || true
  sed -i "s#^VITE_SOLANA_NETWORK=.*#VITE_SOLANA_NETWORK=mainnet-beta#" "$ROOT_DIR/.env" || true
  echo "✓ Updated .env (VITE_FOT_MINT_MAINNET + VITE_SOLANA_NETWORK)"
else
  echo "⚠ .env not found — copy .env.example and set VITE_FOT_MINT_MAINNET=\"$MINT\" manually"
fi

# --- TOKEN_REGISTRATION.md: replace the TBD mainnet row.
#     (The replacement contains a literal pipe, so the sed delimiter is '#'.)
sed -i "s#| Mainnet | TBD.*#| Mainnet | \`$MINT\` | Live on Mainnet |#" \
  "$ROOT_DIR/TOKEN_REGISTRATION.md" || true
echo "✓ Updated TOKEN_REGISTRATION.md mainnet row"

# --- Registry metadata entry (used for CoinGecko/CMC uploads; Jupiter
#     verification is organic — see docs/LISTING_SUBMISSIONS.md).
mkdir -p "$ROOT_DIR/launch-assets"
cat << JUP_EOF > "$ROOT_DIR/launch-assets/jupiter-token-entry.json"
{
  "address": "$MINT",
  "chainId": 101,
  "decimals": 9,
  "name": "FilmAuth Token",
  "symbol": "FOT",
  "logoURI": "https://filmauthtoken.com/assets/fot-logo.png",
  "tags": ["utility", "file-authentication", "ai-agents"],
  "extensions": {
    "website": "https://www.filmauthtoken.com",
    "lockProof": "$LOCK_URL"
  }
}
JUP_EOF
echo "✓ Generated launch-assets/jupiter-token-entry.json"

echo "==> Cutover complete. Next: npm run build + deploy the site, then submit"
echo "    listings per docs/LISTING_SUBMISSIONS.md. Jupiter needs no submission —"
echo "    the token page appears at jup.ag/tokens/$MINT once the LP exists;"
echo "    verification is driven by community smart likes."
