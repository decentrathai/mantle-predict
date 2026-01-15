"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { CONTRACTS, FACTORY_ABI, MARKET_ABI } from "@/lib/contracts";
import { MarketCard } from "@/components/MarketCard";
import { CATEGORIES, type Category } from "@/lib/utils";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  // Read all market addresses from factory
  const { data: marketAddresses, isLoading: isLoadingAddresses } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: "getMarkets",
  });

  // Fetch market info for each address
  const marketContracts = useMemo(() => {
    if (!marketAddresses || marketAddresses.length === 0) return [];
    return marketAddresses.flatMap((address) => [
      {
        address,
        abi: MARKET_ABI,
        functionName: "getMarketInfo",
      } as const,
      {
        address,
        abi: MARKET_ABI,
        functionName: "getPrice",
        args: [true], // Yes price
      } as const,
    ]);
  }, [marketAddresses]);

  const { data: marketData, isLoading: isLoadingMarkets } = useReadContracts({
    contracts: marketContracts,
    query: {
      enabled: marketContracts.length > 0,
    },
  });

  // Transform on-chain data into display format
  const onChainMarkets = useMemo(() => {
    if (!marketAddresses || !marketData) return [];

    const markets = [];
    for (let i = 0; i < marketAddresses.length; i++) {
      const infoResult = marketData[i * 2];
      const priceResult = marketData[i * 2 + 1];

      if (infoResult?.status === "success" && priceResult?.status === "success") {
        const info = infoResult.result as {
          question: string;
          category: string;
          endTime: bigint;
          resolutionTime: bigint;
          resolver: string;
          resolved: boolean;
          outcome: boolean;
          totalYesShares: bigint;
          totalNoShares: bigint;
          totalPool: bigint;
        };
        // Contract returns price with 1e18 precision (1e18 = 100%)
        // Divide by 1e16 to convert to percentage (0-100)
        const yesPrice = Number(priceResult.result) / 1e16;

        markets.push({
          address: marketAddresses[i],
          question: info.question,
          category: info.category,
          yesPrice: Math.round(yesPrice),
          noPrice: Math.round(100 - yesPrice),
          totalPool: Number(formatEther(info.totalPool)).toFixed(2),
          endTime: Number(info.endTime),
          resolved: info.resolved,
        });
      }
    }
    return markets;
  }, [marketAddresses, marketData]);

  const isLoading = isLoadingAddresses || isLoadingMarkets;

  // 20 Example Prediction Markets - shown when no on-chain markets or as fallback
  const mockMarkets = [
    // === CRYPTO (6 markets) ===
    {
      address: "0x627B9Ff522149BB4b45FF195647A3128CE9121e8" as `0x${string}`,
      question: "Will Bitcoin reach $150,000 by end of 2026?",
      category: "Crypto",
      yesPrice: 62,
      noPrice: 38,
      totalPool: "1,245.8",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x2996cb97A074D9eb79613Ff896CA332B54432AFe" as `0x${string}`,
      question: "Will Bitcoin outperform Gold in 2026?",
      category: "Crypto",
      yesPrice: 59,
      noPrice: 41,
      totalPool: "892.3",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x18BA89EA5A08e70AB3D26CE8C9E738A974CF7fe8" as `0x${string}`,
      question: "Will Ethereum ETF AUM exceed $50B by June 2026?",
      category: "Crypto",
      yesPrice: 45,
      noPrice: 55,
      totalPool: "567.2",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 180,
      resolved: false,
    },
    {
      address: "0x4567890123456789012345678901234567890123" as `0x${string}`,
      question: "Will Solana reach $500 in 2026?",
      category: "Crypto",
      yesPrice: 34,
      noPrice: 66,
      totalPool: "423.1",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x5678901234567890123456789012345678901234" as `0x${string}`,
      question: "Will total crypto market cap exceed $5 trillion in 2026?",
      category: "Crypto",
      yesPrice: 71,
      noPrice: 29,
      totalPool: "756.9",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x6789012345678901234567890123456789012345" as `0x${string}`,
      question: "Will Bitcoin hit new ATH before March 2026?",
      category: "Crypto",
      yesPrice: 37,
      noPrice: 63,
      totalPool: "534.6",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 75,
      resolved: false,
    },

    // === COMMODITIES (5 markets) ===
    {
      address: "0x7890123456789012345678901234567890123456" as `0x${string}`,
      question: "Will Gold exceed $3,000/oz by December 2026?",
      category: "Commodities",
      yesPrice: 68,
      noPrice: 32,
      totalPool: "678.4",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x8901234567890123456789012345678901234567" as `0x${string}`,
      question: "Will Oil (WTI) stay above $70/barrel through Q1 2026?",
      category: "Commodities",
      yesPrice: 54,
      noPrice: 46,
      totalPool: "312.7",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 75,
      resolved: false,
    },
    {
      address: "0x9012345678901234567890123456789012345678" as `0x${string}`,
      question: "Will Silver reach $40/oz by end of 2026?",
      category: "Commodities",
      yesPrice: 41,
      noPrice: 59,
      totalPool: "234.5",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x0123456789012345678901234567890123456789" as `0x${string}`,
      question: "Will Natural Gas prices double from Jan 2026 levels?",
      category: "Commodities",
      yesPrice: 28,
      noPrice: 72,
      totalPool: "187.3",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0xABCDEF0123456789ABCDEF0123456789ABCDEF01" as `0x${string}`,
      question: "Will Copper reach all-time high in 2026?",
      category: "Commodities",
      yesPrice: 52,
      noPrice: 48,
      totalPool: "156.8",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },

    // === BONDS (3 markets) ===
    {
      address: "0xBCDEF0123456789ABCDEF0123456789ABCDEF012" as `0x${string}`,
      question: "Will US 10Y Treasury yield stay below 5% in 2026?",
      category: "Bonds",
      yesPrice: 58,
      noPrice: 42,
      totalPool: "445.2",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0xCDEF0123456789ABCDEF0123456789ABCDEF0123" as `0x${string}`,
      question: "Will Fed cut rates by 50+ basis points in 2026?",
      category: "Bonds",
      yesPrice: 43,
      noPrice: 57,
      totalPool: "623.8",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0xDEF0123456789ABCDEF0123456789ABCDEF01234" as `0x${string}`,
      question: "Will there be a Fed rate HIKE in 2026?",
      category: "Bonds",
      yesPrice: 18,
      noPrice: 82,
      totalPool: "389.1",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },

    // === REAL ESTATE (3 markets) ===
    {
      address: "0xEF0123456789ABCDEF0123456789ABCDEF012345" as `0x${string}`,
      question: "Will US housing prices drop more than 10% in 2026?",
      category: "RealEstate",
      yesPrice: 22,
      noPrice: 78,
      totalPool: "287.4",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0xF0123456789ABCDEF0123456789ABCDEF0123456" as `0x${string}`,
      question: "Will commercial real estate see 20%+ decline by 2026?",
      category: "RealEstate",
      yesPrice: 35,
      noPrice: 65,
      totalPool: "198.6",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x123456789ABCDEF0123456789ABCDEF01234567A" as `0x${string}`,
      question: "Will mortgage rates fall below 6% in 2026?",
      category: "RealEstate",
      yesPrice: 47,
      noPrice: 53,
      totalPool: "312.9",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },

    // === OTHER (3 markets) ===
    {
      address: "0x23456789ABCDEF0123456789ABCDEF01234567AB" as `0x${string}`,
      question: "Will S&P 500 return more than 10% in 2026?",
      category: "Other",
      yesPrice: 56,
      noPrice: 44,
      totalPool: "534.7",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x3456789ABCDEF0123456789ABCDEF01234567ABC" as `0x${string}`,
      question: "Will US GDP growth exceed 2.5% in 2026?",
      category: "Other",
      yesPrice: 41,
      noPrice: 59,
      totalPool: "267.3",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
    {
      address: "0x456789ABCDEF0123456789ABCDEF01234567ABCD" as `0x${string}`,
      question: "Will US unemployment rate exceed 5% in 2026?",
      category: "Other",
      yesPrice: 31,
      noPrice: 69,
      totalPool: "178.5",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 350,
      resolved: false,
    },
  ];

  // Combine on-chain markets with mock markets (on-chain first)
  const allMarkets = useMemo(() => {
    // Get addresses of on-chain markets to avoid duplicates
    const onChainAddresses = new Set(onChainMarkets.map((m) => m.address.toLowerCase()));
    // Filter out mock markets that have the same address as on-chain markets
    const filteredMockMarkets = mockMarkets.filter(
      (m) => !onChainAddresses.has(m.address.toLowerCase())
    );
    // On-chain markets first, then mock markets
    return [...onChainMarkets, ...filteredMockMarkets];
  }, [onChainMarkets, mockMarkets]);

  const displayMarkets = allMarkets.filter(
    (m) => selectedCategory === "All" || m.category === selectedCategory
  );

  // Calculate stats from all markets
  const totalVolume = useMemo(() => {
    const onChainVolume = onChainMarkets.reduce((sum, m) => sum + parseFloat(m.totalPool), 0);
    return onChainVolume > 0 ? onChainVolume.toFixed(2) : "8.2K";
  }, [onChainMarkets]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Predict the Future of{" "}
          <span className="text-primary">Real World Assets</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Trade on the outcomes of commodities, bonds, real estate, and more.
          Low fees on Mantle L2.
        </p>
        <Link
          href="/create"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create a Market
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-lg p-4 text-center border border-border">
          <div className="text-2xl font-bold text-primary">{onChainMarkets.length > 0 ? onChainMarkets.length : 20}</div>
          <div className="text-sm text-muted-foreground">{onChainMarkets.length > 0 ? "Live Markets" : "Example Markets"}</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border border-border">
          <div className="text-2xl font-bold text-primary">{onChainMarkets.length > 0 ? `${totalVolume} MNT` : "$8.2K"}</div>
          <div className="text-sm text-muted-foreground">Total Volume</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border border-border">
          <div className="text-2xl font-bold text-primary">5</div>
          <div className="text-sm text-muted-foreground">Categories</div>
        </div>
        <div className="bg-card rounded-lg p-4 text-center border border-border">
          <div className="text-2xl font-bold text-primary">~$0.01</div>
          <div className="text-sm text-muted-foreground">Avg Gas Fee</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {category}
            {category !== "All" && (
              <span className="ml-2 text-xs opacity-70">
                ({allMarkets.filter((m) => m.category === category).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Markets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-card animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayMarkets.map((market) => (
            <MarketCard key={market.address} {...market} />
          ))}
        </div>
      )}

      {displayMarkets.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No markets found in this category.
          </p>
          <Link
            href="/create"
            className="text-primary hover:underline"
          >
            Create the first one!
          </Link>
        </div>
      )}

      {/* Trending Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Inspired by Real Markets</h2>
        <p className="text-muted-foreground mb-4">
          Our prediction markets are inspired by trending topics on major platforms like Polymarket
        </p>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>Bitcoin vs Gold</span>
          <span>•</span>
          <span>Fed Rate Decisions</span>
          <span>•</span>
          <span>Commodity Prices</span>
          <span>•</span>
          <span>Real Estate Trends</span>
        </div>
      </div>
    </div>
  );
}
