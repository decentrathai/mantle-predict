"use client";

import Link from "next/link";
import { calculateTimeRemaining, CATEGORY_COLORS } from "@/lib/utils";

interface MarketCardProps {
  address: `0x${string}`;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  totalPool: string;
  endTime: number;
  resolved: boolean;
  outcome?: boolean;
}

export function MarketCard({
  address,
  question,
  category,
  yesPrice,
  noPrice,
  totalPool,
  endTime,
  resolved,
  outcome,
}: MarketCardProps) {
  const timeRemaining = calculateTimeRemaining(endTime);
  const isEnded = timeRemaining === "Ended";
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;

  return (
    <Link href={`/market/${address}`}>
      <div className="group relative rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {resolved ? (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                outcome
                  ? "bg-yes/20 text-yes"
                  : "bg-no/20 text-no"
              }`}
            >
              {outcome ? "Yes Won" : "No Won"}
            </span>
          ) : isEnded ? (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
              Awaiting Resolution
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-400">
              Active
            </span>
          )}
        </div>

        {/* Category Badge */}
        <span
          className={`inline-block text-xs font-medium px-2 py-1 rounded-full border mb-3 ${categoryColor}`}
        >
          {category}
        </span>

        {/* Question */}
        <h3 className="text-lg font-semibold text-foreground mb-4 line-clamp-2 pr-16">
          {question}
        </h3>

        {/* Price Bars */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-yes font-medium">Yes</span>
            <span className="text-muted-foreground">{yesPrice}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-yes rounded-full transition-all duration-300"
              style={{ width: `${yesPrice}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-no font-medium">No</span>
            <span className="text-muted-foreground">{noPrice}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-no rounded-full transition-all duration-300"
              style={{ width: `${noPrice}%` }}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{totalPool} MNT</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{timeRemaining}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
