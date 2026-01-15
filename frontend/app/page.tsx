"use client";

import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";
import { MarketCard } from "@/components/MarketCard";
import { CATEGORIES, type Category } from "@/lib/utils";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  // Read all markets from factory
  const { data: markets, isLoading } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: "getMarkets",
  });

  // Mock data for development (before contracts are deployed)
  const mockMarkets = [
    {
      address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
      question: "Will gold exceed $3000 by Dec 31, 2025?",
      category: "Commodities",
      yesPrice: 65,
      noPrice: 35,
      totalPool: "125.5",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 30,
      resolved: false,
    },
    {
      address: "0x2345678901234567890123456789012345678901" as `0x${string}`,
      question: "Will US 10Y Treasury yield stay below 5% in Q1 2026?",
      category: "Bonds",
      yesPrice: 42,
      noPrice: 58,
      totalPool: "89.2",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 60,
      resolved: false,
    },
    {
      address: "0x3456789012345678901234567890123456789012" as `0x${string}`,
      question: "Will Bitcoin ETF total AUM exceed $100B by March 2026?",
      category: "Crypto",
      yesPrice: 78,
      noPrice: 22,
      totalPool: "342.8",
      endTime: Math.floor(Date.now() / 1000) + 86400 * 90,
      resolved: false,
    },
  ];

  const displayMarkets = mockMarkets.filter(
    (m) => selectedCategory === "All" || m.category === selectedCategory
  );

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
          </button>
        ))}
      </div>

      {/* Markets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
    </div>
  );
}
