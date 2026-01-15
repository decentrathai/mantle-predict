"use client";

import { useState } from "react";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { MARKET_ABI } from "@/lib/contracts";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface BetPanelProps {
  marketAddress: `0x${string}`;
  yesPrice: number;
  noPrice: number;
  isActive: boolean;
  isResolved: boolean;
  outcome?: boolean;
}

export function BetPanel({
  marketAddress,
  yesPrice,
  noPrice,
  isActive,
  isResolved,
  outcome,
}: BetPanelProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const currentPrice = selectedSide === "yes" ? yesPrice : noPrice;
  const estimatedShares = amount
    ? (parseFloat(amount) / (currentPrice / 100)).toFixed(4)
    : "0";

  const handleBuy = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    writeContract({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: "buyShares",
      args: [selectedSide === "yes", BigInt(0)], // 0 for minShares (no slippage protection for simplicity)
      value: parseEther(amount),
    });
  };

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Place Your Bet</h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Connect your wallet to place bets</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isResolved) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Market Resolved</h2>
        <div className="text-center py-8">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              outcome ? "bg-yes/20 text-yes" : "bg-no/20 text-no"
            }`}
          >
            <span className="font-medium">
              {outcome ? "Yes" : "No"} Won
            </span>
          </div>
          <p className="text-muted-foreground mt-4">
            Check your positions below to claim any winnings.
          </p>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Betting Closed</h2>
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Awaiting Resolution</span>
          </div>
          <p className="text-muted-foreground mt-4">
            Betting has ended. Waiting for the market to be resolved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Place Your Bet</h2>

      {/* Yes/No Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => setSelectedSide("yes")}
          className={`py-3 px-4 rounded-lg font-medium transition-all ${
            selectedSide === "yes"
              ? "bg-yes text-white"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          Yes ({yesPrice}%)
        </button>
        <button
          onClick={() => setSelectedSide("no")}
          className={`py-3 px-4 rounded-lg font-medium transition-all ${
            selectedSide === "no"
              ? "bg-no text-white"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          No ({noPrice}%)
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm text-muted-foreground mb-2">
          Amount (MNT)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 pr-20 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
          <button
            onClick={() => setAmount(balance ? formatEther(balance.value) : "0")}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-primary hover:text-primary/80"
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Balance: {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : "0"} MNT</span>
        </div>
      </div>

      {/* Estimated Shares */}
      <div className="p-4 rounded-lg bg-secondary/50 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated shares:</span>
          <span className="font-medium">{estimatedShares}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-muted-foreground">Price per share:</span>
          <span className="font-medium">{currentPrice}%</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-muted-foreground">Potential payout:</span>
          <span className="font-medium text-primary">
            {amount ? (parseFloat(amount) / (currentPrice / 100)).toFixed(4) : "0"} MNT
          </span>
        </div>
      </div>

      {/* Transaction Success */}
      {isSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          Transaction successful!{" "}
          <a
            href={`https://sepolia.mantlescan.xyz/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Explorer
          </a>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error.message.slice(0, 100)}...
        </div>
      )}

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={!amount || parseFloat(amount) <= 0 || isPending || isConfirming}
        className={`w-full py-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          selectedSide === "yes"
            ? "bg-yes hover:bg-yes/90 text-white"
            : "bg-no hover:bg-no/90 text-white"
        }`}
      >
        {isPending
          ? "Waiting for Approval..."
          : isConfirming
          ? "Confirming..."
          : `Buy ${selectedSide === "yes" ? "Yes" : "No"} Shares`}
      </button>
    </div>
  );
}
