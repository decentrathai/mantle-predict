"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import { MARKET_ABI } from "@/lib/contracts";

interface PositionPanelProps {
  marketAddress: `0x${string}`;
  yesShares: bigint;
  noShares: bigint;
  yesPrice: number;
  noPrice: number;
  isActive: boolean;
  isResolved: boolean;
  outcome?: boolean;
}

export function PositionPanel({
  marketAddress,
  yesShares,
  noShares,
  yesPrice,
  noPrice,
  isActive,
  isResolved,
  outcome,
}: PositionPanelProps) {
  const [sellAmount, setSellAmount] = useState<{ side: "yes" | "no"; amount: string } | null>(null);

  const { writeContract: sellContract, data: sellHash, isPending: isSelling } = useWriteContract();
  const { writeContract: claimContract, data: claimHash, isPending: isClaiming } = useWriteContract();

  const { isLoading: isSellConfirming, isSuccess: sellSuccess } = useWaitForTransactionReceipt({
    hash: sellHash,
  });
  const { isLoading: isClaimConfirming, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const hasPosition = yesShares > 0n || noShares > 0n;

  const yesValue = (Number(formatEther(yesShares)) * yesPrice) / 100;
  const noValue = (Number(formatEther(noShares)) * noPrice) / 100;

  const handleSell = (side: "yes" | "no", shares: bigint) => {
    sellContract({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: "sellShares",
      args: [side === "yes", shares, BigInt(0)],
    });
  };

  const handleClaim = () => {
    claimContract({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: "claimWinnings",
    });
  };

  if (!hasPosition && !isResolved) {
    return null;
  }

  const canClaim =
    isResolved &&
    ((outcome && yesShares > 0n) || (!outcome && noShares > 0n));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Your Position</h2>

      {/* Position Display */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Yes Position */}
        <div
          className={`p-4 rounded-lg ${
            isResolved && outcome
              ? "bg-yes/20 border border-yes/30"
              : "bg-secondary/50"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Yes Shares</span>
            {isResolved && outcome && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yes/20 text-yes">
                Winner
              </span>
            )}
          </div>
          <div className="text-2xl font-bold">
            {Number(formatEther(yesShares)).toFixed(4)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Value: ~{yesValue.toFixed(4)} MNT
          </div>

          {isActive && yesShares > 0n && (
            <button
              onClick={() => handleSell("yes", yesShares)}
              disabled={isSelling || isSellConfirming}
              className="mt-3 w-full py-2 px-4 rounded-lg bg-yes/20 text-yes hover:bg-yes/30 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {isSelling || isSellConfirming ? "Selling..." : "Sell All"}
            </button>
          )}
        </div>

        {/* No Position */}
        <div
          className={`p-4 rounded-lg ${
            isResolved && !outcome
              ? "bg-no/20 border border-no/30"
              : "bg-secondary/50"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">No Shares</span>
            {isResolved && !outcome && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-no/20 text-no">
                Winner
              </span>
            )}
          </div>
          <div className="text-2xl font-bold">
            {Number(formatEther(noShares)).toFixed(4)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Value: ~{noValue.toFixed(4)} MNT
          </div>

          {isActive && noShares > 0n && (
            <button
              onClick={() => handleSell("no", noShares)}
              disabled={isSelling || isSellConfirming}
              className="mt-3 w-full py-2 px-4 rounded-lg bg-no/20 text-no hover:bg-no/30 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {isSelling || isSellConfirming ? "Selling..." : "Sell All"}
            </button>
          )}
        </div>
      </div>

      {/* Claim Button */}
      {canClaim && (
        <div className="border-t border-border pt-4">
          {claimSuccess ? (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
              <p className="text-green-400 font-medium">Winnings Claimed!</p>
              <a
                href={`https://sepolia.mantlescan.xyz/tx/${claimHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-400/80 underline"
              >
                View Transaction
              </a>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming || isClaimConfirming}
              className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isClaiming || isClaimConfirming
                ? "Claiming..."
                : "Claim Winnings"}
            </button>
          )}
        </div>
      )}

      {/* Transaction Status */}
      {sellSuccess && (
        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
          Shares sold successfully!{" "}
          <a
            href={`https://sepolia.mantlescan.xyz/tx/${sellHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View Transaction
          </a>
        </div>
      )}
    </div>
  );
}
