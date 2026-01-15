// Contract addresses - Deployed on Mantle Sepolia Testnet
export const CONTRACTS = {
  FACTORY: "0xa91FcC187e67118fdFAe556A885Bb8695408F062" as `0x${string}`,
  ORACLE: "0x97071685437B7210c6a9e47bB360C56E8b43497c" as `0x${string}`,
  MARKETS: [
    "0x627B9Ff522149BB4b45FF195647A3128CE9121e8",
    "0x2996cb97A074D9eb79613Ff896CA332B54432AFe",
    "0x18BA89EA5A08e70AB3D26CE8C9E738A974CF7fe8",
  ] as `0x${string}`[],
} as const;

// MarketFactory ABI
export const FACTORY_ABI = [
  {
    inputs: [
      { name: "question", type: "string" },
      { name: "category", type: "string" },
      { name: "endTime", type: "uint256" },
      { name: "resolutionTime", type: "uint256" },
      { name: "resolver", type: "address" },
    ],
    name: "createMarket",
    outputs: [{ name: "marketAddress", type: "address" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarkets",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "category", type: "string" }],
    name: "getMarketsByCategory",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveMarkets",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "marketAddress", type: "address" },
      { indexed: false, name: "question", type: "string" },
      { indexed: false, name: "category", type: "string" },
      { indexed: false, name: "creator", type: "address" },
    ],
    name: "MarketCreated",
    type: "event",
  },
] as const;

// PredictionMarket ABI
export const MARKET_ABI = [
  {
    inputs: [
      { name: "isYes", type: "bool" },
      { name: "minShares", type: "uint256" },
    ],
    name: "buyShares",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "isYes", type: "bool" },
      { name: "shares", type: "uint256" },
      { name: "minPayout", type: "uint256" },
    ],
    name: "sellShares",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "isYes", type: "bool" }],
    name: "getPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "isYes", type: "bool" },
      { name: "amount", type: "uint256" },
    ],
    name: "calculateShares",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "outcome", type: "bool" }],
    name: "resolve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimWinnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getPosition",
    outputs: [
      { name: "yesShares", type: "uint256" },
      { name: "noShares", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarketInfo",
    outputs: [
      {
        components: [
          { name: "question", type: "string" },
          { name: "category", type: "string" },
          { name: "endTime", type: "uint256" },
          { name: "resolutionTime", type: "uint256" },
          { name: "resolver", type: "address" },
          { name: "resolved", type: "bool" },
          { name: "outcome", type: "bool" },
          { name: "totalYesShares", type: "uint256" },
          { name: "totalNoShares", type: "uint256" },
          { name: "totalPool", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "buyer", type: "address" },
      { indexed: false, name: "isYes", type: "bool" },
      { indexed: false, name: "shares", type: "uint256" },
      { indexed: false, name: "cost", type: "uint256" },
    ],
    name: "SharesPurchased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "seller", type: "address" },
      { indexed: false, name: "isYes", type: "bool" },
      { indexed: false, name: "shares", type: "uint256" },
      { indexed: false, name: "payout", type: "uint256" },
    ],
    name: "SharesSold",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "outcome", type: "bool" }],
    name: "MarketResolved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "WinningsClaimed",
    type: "event",
  },
] as const;
