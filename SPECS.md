# MantlePredict - Technical Specifications

## Project Overview

**MantlePredict** is a decentralized prediction market platform for Real World Asset (RWA) events built on the Mantle Network. Users can create markets, buy/sell outcome shares, and earn rewards based on real-world outcomes.

**Live URL**: https://mantlepredict.com
**GitHub**: https://github.com/decentrathai/mantle-predict
**Network**: Mantle Sepolia Testnet (Chain ID: 5003)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  Next.js 14 + TypeScript + TailwindCSS + wagmi + RainbowKit     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (Cloudflare Tunnel)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mantle Sepolia Testnet                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ MarketFactory   │  │ PredictionMarket│  │  PriceOracle    │  │
│  │ (Creates mkts)  │  │ (Trading logic) │  │ (Auto-resolve)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### 1. MarketFactory.sol

**Address**: `0xa91FcC187e67118fdFAe556A885Bb8695408F062`

**Purpose**: Factory contract to create and track prediction markets.

**Key Functions**:
```solidity
function createMarket(
    string calldata question,
    string calldata category,
    uint256 endTime,
    uint256 resolutionTime,
    address resolver
) external payable returns (address marketAddress);

function getMarkets() external view returns (address[] memory);
function getMarketsByCategory(string calldata category) external view returns (address[] memory);
function getActiveMarkets() external view returns (address[] memory);
```

**Events**:
- `MarketCreated(address indexed marketAddress, string question, string category, address creator)`

**State Variables**:
- `markets[]` - Array of all market addresses
- `marketsByCategory` - Mapping from category to market addresses
- `creationFee` - Fee to create a market (default: 0)
- `minInitialLiquidity` - Minimum seed liquidity (0.01 MNT)

---

### 2. PredictionMarket.sol

**Purpose**: Individual prediction market with binary outcomes (Yes/No).

**Sample Deployed Markets**:
| Market | Address |
|--------|---------|
| Gold $3000 | `0x627B9Ff522149BB4b45FF195647A3128CE9121e8` |
| Treasury Yield | `0x2996cb97A074D9eb79613Ff896CA332B54432AFe` |
| Bitcoin ETF AUM | `0x18BA89EA5A08e70AB3D26CE8C9E738A974CF7fe8` |

**Key Functions**:
```solidity
// Trading
function buyShares(bool isYes, uint256 minShares) external payable;
function sellShares(bool isYes, uint256 shares, uint256 minPayout) external;

// Price Discovery
function getPrice(bool isYes) public view returns (uint256);
function calculateShares(bool isYes, uint256 amount) public view returns (uint256);

// Resolution
function resolve(bool outcome) external; // Only resolver
function claimWinnings() external;

// Queries
function getPosition(address user) external view returns (uint256 yesShares, uint256 noShares);
function getMarketInfo() external view returns (MarketInfo memory);
```

**Pricing Formula (CPMM)**:
```
Yes Price = totalNoShares / (totalYesShares + totalNoShares)
No Price = totalYesShares / (totalYesShares + totalNoShares)
```

**Events**:
- `SharesPurchased(address indexed buyer, bool isYes, uint256 shares, uint256 cost)`
- `SharesSold(address indexed seller, bool isYes, uint256 shares, uint256 payout)`
- `MarketResolved(bool outcome)`
- `WinningsClaimed(address indexed user, uint256 amount)`

**Security Features**:
- ReentrancyGuard on all state-changing functions
- Time-based access control (can't bet after endTime)
- Resolution time enforcement
- Slippage protection on trades

---

### 3. PriceOracle.sol

**Address**: `0x97071685437B7210c6a9e47bB360C56E8b43497c`

**Purpose**: Oracle wrapper for automated market resolution based on external price feeds.

**Key Functions**:
```solidity
function setPriceFeed(string calldata asset, address feed) external onlyOwner;
function setMarketCondition(address market, string calldata asset, uint256 threshold, bool isAbove) external;
function checkCondition(string calldata asset, uint256 threshold, bool isAbove) external view returns (bool, int256);
function autoResolveMarket(address market) external;
function canAutoResolve(address market) external view returns (bool, int256, bool);
```

**Supported Oracle Interfaces**: Pyth Network, API3, Chainlink (compatible)

---

## Frontend Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Web3**: wagmi v2, viem, RainbowKit
- **Charts**: Recharts

### Directory Structure
```
frontend/
├── app/
│   ├── page.tsx              # Home - Market listing
│   ├── market/[id]/page.tsx  # Individual market view
│   ├── create/page.tsx       # Create new market
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── Header.tsx            # Navigation + wallet connect
│   ├── MarketCard.tsx        # Market preview card
│   ├── BetPanel.tsx          # Trading interface
│   ├── PositionPanel.tsx     # User positions display
│   ├── PriceChart.tsx        # Price history chart
│   └── Providers.tsx         # wagmi/RainbowKit providers
├── hooks/
│   └── useMarket.ts          # Market interaction hook
└── lib/
    ├── chains.ts             # Mantle chain config
    ├── contracts.ts          # ABIs & addresses
    ├── utils.ts              # Helper functions
    └── wagmi.ts              # wagmi configuration
```

### Key Components

**MarketCard**: Displays market summary with:
- Question text
- Category badge
- Yes/No price bars
- Pool size
- Time remaining
- Status (Active/Ended/Resolved)

**BetPanel**: Trading interface with:
- Yes/No toggle selection
- Amount input with MAX button
- Share calculation preview
- Potential payout display
- Transaction status

**PositionPanel**: User position display with:
- Yes/No share balances
- Estimated values
- Sell buttons (when active)
- Claim button (when resolved)

---

## Infrastructure

### Hosting
- **Server**: Self-hosted on local machine via Cloudflare Tunnel
- **Domain**: mantlepredict.com (GoDaddy)
- **DNS/CDN**: Cloudflare (free tier)
- **SSL**: Automatic via Cloudflare

### Cloudflare Tunnel Configuration
```yaml
tunnel: 36f5946f-5a34-43e4-9cfe-18e05c6dcbe3
credentials-file: ~/.cloudflared/36f5946f-5a34-43e4-9cfe-18e05c6dcbe3.json

ingress:
  - hostname: mantlepredict.com
    service: http://localhost:3001
  - hostname: www.mantlepredict.com
    service: http://localhost:3001
  - service: http_status:404
```

### Running Services
| Service | Port | Command |
|---------|------|---------|
| Frontend (prod) | 3001 | `npm run start` |
| Frontend (dev) | 3000 | `npm run dev` |
| Cloudflare Tunnel | - | `cloudflared tunnel run zchat` |

---

## Market Categories

1. **Commodities** - Gold, Silver, Oil, Natural Gas
2. **Bonds** - Treasury yields, Corporate bonds
3. **Crypto** - Bitcoin, Ethereum, Solana prices
4. **RealEstate** - Housing indices, REIT performance
5. **Other** - Macro events, Economic indicators

---

## API Reference

### Contract ABIs

Full ABIs available in `frontend/lib/contracts.ts`

### Key Types
```typescript
interface MarketInfo {
  question: string;
  category: string;
  endTime: bigint;
  resolutionTime: bigint;
  resolver: address;
  resolved: boolean;
  outcome: boolean;
  totalYesShares: bigint;
  totalNoShares: bigint;
  totalPool: bigint;
}
```

---

## Testing

### Contract Tests (22 passing)
```bash
cd contracts
npm test
```

**Test Coverage**:
- Market creation
- Buying Yes/No shares
- Selling shares
- Price updates
- Time restrictions
- Resolution flow
- Winnings distribution
- Double-claim prevention

---

## Deployment

### Contract Deployment
```bash
cd contracts
# Set PRIVATE_KEY in .env
npm run deploy:mantle
```

### Frontend Deployment
```bash
cd frontend
npm run build
npm run start  # Production on port 3001
```

---

## Environment Variables

### Contracts (.env)
```
PRIVATE_KEY=your_private_key
MANTLE_TESTNET_RPC=https://rpc.sepolia.mantle.xyz
MANTLESCAN_API_KEY=optional
```

### Frontend (.env.local)
```
NEXT_PUBLIC_WALLET_CONNECT_ID=your_walletconnect_id
```

---

## Security Considerations

1. **Smart Contracts**:
   - ReentrancyGuard on all payable functions
   - Access control for resolver functions
   - Time-based restrictions
   - Integer overflow protection (Solidity 0.8+)

2. **Frontend**:
   - No private keys stored
   - All transactions signed by user wallet
   - HTTPS enforced via Cloudflare

3. **Infrastructure**:
   - Cloudflare DDoS protection
   - Tunnel encryption
   - No direct server exposure

---

## Future Roadmap

- [ ] Pyth/API3 oracle integration for automated resolution
- [ ] Liquidity provider rewards
- [ ] Mobile app (React Native)
- [ ] Cross-chain deployment (Mantle mainnet)
- [ ] Governance token
- [ ] Advanced order types

---

## Credits

- **Developer**: decentrathai
- **AI Assistant**: Claude Opus 4.5
- **Network**: Mantle Network
- **Built for**: Mantle Network Hackathon 2025

---

## License

MIT License
