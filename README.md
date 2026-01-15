# MantlePredict

Decentralized prediction markets for Real World Asset (RWA) events on Mantle Network.

## Features

- **Create prediction markets** for any binary outcome
- **AMM-based pricing** using Constant Product Market Maker (no order books needed)
- **Focus on RWA events**: commodities, bonds, real estate, crypto
- **Low fees** on Mantle L2 (~$0.01 per transaction)
- **Transparent, on-chain resolution**
- **Oracle integration** for automated price-based resolution

## Tech Stack

| Component | Technology |
|-----------|------------|
| Smart Contracts | Solidity 0.8.20+, Hardhat |
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Web3 Integration | wagmi v2, viem, RainbowKit |
| Network | Mantle Sepolia Testnet (Chain ID: 5003) |

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or compatible wallet
- Mantle testnet MNT (get from [faucet](https://faucet.sepolia.mantle.xyz))

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/mantle-predict
cd mantle-predict

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up environment
cp .env.example .env.local
# Add your WalletConnect Project ID
```

### Run Locally

```bash
# Terminal 1: Start local Hardhat node
cd contracts
npm run node

# Terminal 2: Deploy contracts to local node
npm run deploy:local

# Terminal 3: Start frontend
cd frontend
npm run dev

# Open http://localhost:3000
```

### Run Tests

```bash
cd contracts
npm test
```

### Deploy to Mantle Testnet

```bash
cd contracts

# Set up environment variables
cp .env.example .env
# Edit .env with your private key

# Deploy
npm run deploy:mantle
```

## Contract Addresses (Mantle Sepolia Testnet)

| Contract | Address |
|----------|---------|
| MarketFactory | `0xa91FcC187e67118fdFAe556A885Bb8695408F062` |
| PriceOracle | `0x97071685437B7210c6a9e47bB360C56E8b43497c` |

### Sample Markets

| Market | Address |
|--------|---------|
| Gold $3000 | `0x627B9Ff522149BB4b45FF195647A3128CE9121e8` |
| Treasury Yield | `0x2996cb97A074D9eb79613Ff896CA332B54432AFe` |
| Bitcoin ETF AUM | `0x18BA89EA5A08e70AB3D26CE8C9E738A974CF7fe8` |

## How It Works

```
User deposits MNT
    ↓
Buys Yes/No shares
    ↓
Price reflects market sentiment
    ↓
Resolution determines winners
    ↓
Winners claim payout
```

### Pricing Mechanism

Uses simplified Constant Product Market Maker:
- **Yes Price** = No Pool / (Yes Pool + No Pool)
- **No Price** = Yes Pool / (Yes Pool + No Pool)
- Prices always sum to ~100%
- More demand on one side shifts the price

### Market Lifecycle

1. **Creation**: Creator sets question, end date, resolution date, and seeds initial liquidity
2. **Trading**: Users buy/sell Yes/No shares until end date
3. **Resolution**: Resolver (or oracle) determines the outcome
4. **Settlement**: Winners claim their proportional share of the pool

## Project Structure

```
mantle-predict/
├── contracts/
│   ├── src/
│   │   ├── PredictionMarket.sol    # Core market logic
│   │   ├── MarketFactory.sol       # Market creation & tracking
│   │   ├── PriceOracle.sol         # Oracle integration
│   │   └── interfaces/
│   ├── test/                       # Contract tests
│   └── script/                     # Deployment scripts
├── frontend/
│   ├── app/                        # Next.js pages
│   │   ├── page.tsx                # Home/market list
│   │   ├── market/[id]/page.tsx    # Individual market
│   │   └── create/page.tsx         # Create market
│   ├── components/                 # React components
│   ├── hooks/                      # Custom hooks
│   └── lib/                        # Utilities & config
└── docs/
    └── ONE-PAGER.md               # Pitch document
```

## Smart Contract API

### PredictionMarket.sol

```solidity
// Buy shares
function buyShares(bool isYes, uint256 minShares) external payable;

// Sell shares
function sellShares(bool isYes, uint256 shares, uint256 minPayout) external;

// Get current prices
function getPrice(bool isYes) external view returns (uint256);

// Resolve market (resolver only)
function resolve(bool outcome) external;

// Claim winnings after resolution
function claimWinnings() external;
```

### MarketFactory.sol

```solidity
// Create new market
function createMarket(
    string calldata question,
    string calldata category,
    uint256 endTime,
    uint256 resolutionTime,
    address resolver
) external payable returns (address);

// Get all markets
function getMarkets() external view returns (address[] memory);

// Get active markets
function getActiveMarkets() external view returns (address[] memory);
```

## Roadmap

- [ ] Oracle integration for automated resolution (Pyth, API3)
- [ ] Liquidity provider incentives
- [ ] Cross-chain markets
- [ ] Mobile app
- [ ] Governance token

## Security Considerations

- ReentrancyGuard on all state-changing functions
- Timelock checks for betting and resolution periods
- Resolver-only access for market resolution
- Slippage protection on trades

## License

MIT

## Links

- [Mantle Network](https://mantle.xyz)
- [Mantle Faucet](https://faucet.sepolia.mantle.xyz)
- [Mantle Explorer](https://sepolia.mantlescan.xyz)

---

Built for Mantle Network Hackathon 2026
