# FOT Token Registration Guide

## Token Information
- **Token Address**: `4zaq8xFC2grs6u9q9gjSiQCPqmXCJeqKk9b1UiHzRovA`
- **Token Name**: FilmAuth Token
- **Symbol**: FOT
- **Logo**: [fot-logo.png](./public/assets/fot-logo.png)
- **Metadata**: [fot-metadata.json](./public/assets/fot-metadata.json)

## Next Steps for Token Registration

### 1. Update GitHub URLs
After pushing to GitHub, update the image URLs in `fot-metadata.json`:
- Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username
- Replace `YOUR_REPO_NAME` with your repository name

### 2. Token Registry Submissions

#### Solana Token List
Submit to the official Solana Token List:
1. Fork: https://github.com/solana-labs/token-list
2. Add your token to `src/tokens/solana.tokenlist.json`
3. Submit pull request

#### Jupiter Token List
Submit to Jupiter for DEX integration:
1. Fork: https://github.com/jup-ag/token-list
2. Follow their validation requirements
3. Submit pull request

#### CoinGecko & CoinMarketCap
- CoinGecko: https://www.coingecko.com/en/coins/new
- CoinMarketCap: https://coinmarketcap.com/request/

### 3. Wallet Integration
Popular wallets will automatically recognize your token once it's in the official registries.

### 4. Required Information for Submissions
- Token contract address: `4zaq8xFC2grs6u9q9gjSiQCPqmXCJeqKk9b1UiHzRovA`
- Logo URL (from GitHub)
- Metadata URL (from GitHub)
- Website: https://filmauth.lovable.app
- Social links (if available)

## File Structure
```
public/assets/
├── fot-logo.png        # 512x512 PNG logo
└── fot-metadata.json   # Token metadata
```