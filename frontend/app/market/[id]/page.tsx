"use client";

import { useParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { MARKET_ABI } from "@/lib/contracts";
import { BetPanel } from "@/components/BetPanel";
import { PositionPanel } from "@/components/PositionPanel";
import { PriceChart } from "@/components/PriceChart";
import {
  calculateTimeRemaining,
  CATEGORY_COLORS,
  formatMNT,
  getPricePercentage,
} from "@/lib/utils";

export default function MarketPage() {
  const params = useParams();
  const marketAddress = params.id as `0x${string}`;
  const { address: userAddress } = useAccount();

  // Read market info
  const { data: marketInfo, isLoading: marketLoading } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: "getMarketInfo",
  });

  // Read user position
  const { data: position } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: "getPosition",
    args: userAddress ? [userAddress] : undefined,
  });

  // Mock data for development
  const mockMarketInfo = {
    question: "Will gold exceed $3000 by Dec 31, 2025?",
    category: "Commodities",
    endTime: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
    resolutionTime: BigInt(Math.floor(Date.now() / 1000) + 86400 * 31),
    resolver: "0x1234567890123456789012345678901234567890" as `0x${string}`,
    resolved: false,
    outcome: false,
    totalYesShares: BigInt(1e18) * BigInt(120),
    totalNoShares: BigInt(1e18) * BigInt(80),
    totalPool: BigInt(1e18) * BigInt(125),
  };

  const info = marketInfo || mockMarketInfo;
  const userPosition = position || [BigInt(0), BigInt(0)];

  const totalShares = info.totalYesShares + info.totalNoShares;
  const yesPrice = totalShares > 0
    ? Number((info.totalNoShares * BigInt(100)) / totalShares)
    : 50;
  const noPrice = 100 - yesPrice;

  const timeRemaining = calculateTimeRemaining(Number(info.endTime));
  const isActive = Date.now() / 1000 < Number(info.endTime) && !info.resolved;
  const categoryColor = CATEGORY_COLORS[info.category] || CATEGORY_COLORS.Other;

  if (marketLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-card rounded-lg w-3/4" />
          <div className="h-6 bg-card rounded w-1/2" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-card rounded-xl" />
            <div className="h-64 bg-card rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full border ${categoryColor}`}
          >
            {info.category}
          </span>
          {info.resolved ? (
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                info.outcome
                  ? "bg-yes/20 text-yes"
                  : "bg-no/20 text-no"
              }`}
            >
              Resolved: {info.outcome ? "Yes" : "No"}
            </span>
          ) : isActive ? (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400">
              Active
            </span>
          ) : (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
              Awaiting Resolution
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          {info.question}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{isActive ? `Ends in ${timeRemaining}` : timeRemaining}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Pool: {formatMNT(info.totalPool)} MNT</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Chart Section */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Price History</h2>
          <PriceChart yesPrice={yesPrice} noPrice={noPrice} />

          {/* Current Prices */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-yes/10 border border-yes/20">
              <div className="text-sm text-muted-foreground mb-1">Yes Price</div>
              <div className="text-2xl font-bold text-yes">{yesPrice}%</div>
            </div>
            <div className="p-4 rounded-lg bg-no/10 border border-no/20">
              <div className="text-sm text-muted-foreground mb-1">No Price</div>
              <div className="text-2xl font-bold text-no">{noPrice}%</div>
            </div>
          </div>
        </div>

        {/* Bet Panel */}
        <div className="lg:col-span-2">
          <BetPanel
            marketAddress={marketAddress}
            yesPrice={yesPrice}
            noPrice={noPrice}
            isActive={isActive}
            isResolved={info.resolved}
            outcome={info.outcome}
          />
        </div>
      </div>

      {/* Position Panel */}
      {userAddress && (
        <PositionPanel
          marketAddress={marketAddress}
          yesShares={userPosition[0]}
          noShares={userPosition[1]}
          yesPrice={yesPrice}
          noPrice={noPrice}
          isActive={isActive}
          isResolved={info.resolved}
          outcome={info.outcome}
        />
      )}

      {/* Market Info */}
      <div className="rounded-xl border border-border bg-card p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Market Details</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Betting Ends:</span>
            <span className="ml-2 text-foreground">
              {new Date(Number(info.endTime) * 1000).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Resolution Time:</span>
            <span className="ml-2 text-foreground">
              {new Date(Number(info.resolutionTime) * 1000).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Resolver:</span>
            <span className="ml-2 text-foreground font-mono text-xs">
              {info.resolver}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Market Address:</span>
            <span className="ml-2 text-foreground font-mono text-xs">
              {marketAddress}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
