"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const CATEGORIES = ["Commodities", "Bonds", "RealEstate", "Crypto", "Other"];

export default function CreateMarketPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [formData, setFormData] = useState({
    question: "",
    category: "Commodities",
    endDate: "",
    endTime: "",
    resolutionDate: "",
    resolutionTime: "",
    resolver: "",
    initialLiquidity: "0.1",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.question.length < 10) {
      newErrors.question = "Question must be at least 10 characters";
    }
    if (formData.question.length > 200) {
      newErrors.question = "Question must be less than 200 characters";
    }

    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const resolutionDateTime = new Date(`${formData.resolutionDate}T${formData.resolutionTime}`);
    const now = new Date();

    if (endDateTime <= now) {
      newErrors.endDate = "End date must be in the future";
    }

    if (resolutionDateTime <= endDateTime) {
      newErrors.resolutionDate = "Resolution date must be after end date";
    }

    const liquidity = parseFloat(formData.initialLiquidity);
    if (isNaN(liquidity) || liquidity < 0.01) {
      newErrors.initialLiquidity = "Minimum liquidity is 0.01 MNT";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const endTimestamp = Math.floor(
      new Date(`${formData.endDate}T${formData.endTime}`).getTime() / 1000
    );
    const resolutionTimestamp = Math.floor(
      new Date(`${formData.resolutionDate}T${formData.resolutionTime}`).getTime() / 1000
    );
    const resolverAddress = formData.resolver || address;

    writeContract({
      address: CONTRACTS.FACTORY,
      abi: FACTORY_ABI,
      functionName: "createMarket",
      args: [
        formData.question,
        formData.category,
        BigInt(endTimestamp),
        BigInt(resolutionTimestamp),
        resolverAddress as `0x${string}`,
      ],
      value: parseEther(formData.initialLiquidity),
    });
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Market Created!</h2>
          <p className="text-muted-foreground mb-6">
            Your prediction market has been successfully created.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              View All Markets
            </button>
            <a
              href={`https://sepolia.mantlescan.xyz/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 rounded-lg border border-border hover:bg-secondary"
            >
              View Transaction
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create a Market</h1>
        <p className="text-muted-foreground">
          Create a new prediction market for any binary outcome.
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            You need to connect your wallet to create a market.
          </p>
          <ConnectButton />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Question *
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Will gold exceed $3000 by Dec 31, 2025?"
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
            <div className="flex justify-between mt-2">
              {errors.question && (
                <span className="text-sm text-red-400">{errors.question}</span>
              )}
              <span className="text-sm text-muted-foreground ml-auto">
                {formData.question.length}/200
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Betting End Date *
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-28 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
                {errors.endDate && (
                  <span className="text-sm text-red-400 mt-1 block">{errors.endDate}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resolution Date *
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.resolutionDate}
                    onChange={(e) => setFormData({ ...formData, resolutionDate: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                  <input
                    type="time"
                    value={formData.resolutionTime}
                    onChange={(e) => setFormData({ ...formData, resolutionTime: e.target.value })}
                    className="w-28 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
                {errors.resolutionDate && (
                  <span className="text-sm text-red-400 mt-1 block">{errors.resolutionDate}</span>
                )}
              </div>
            </div>
          </div>

          {/* Resolver & Liquidity */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resolver Address
                </label>
                <input
                  type="text"
                  value={formData.resolver}
                  onChange={(e) => setFormData({ ...formData, resolver: e.target.value })}
                  placeholder={address || "0x..."}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Leave empty to use your connected wallet
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Initial Liquidity (MNT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.initialLiquidity}
                  onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
                {errors.initialLiquidity && (
                  <span className="text-sm text-red-400 mt-1 block">{errors.initialLiquidity}</span>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Minimum 0.01 MNT. This seeds the initial market liquidity.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {writeError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400">
              <p className="font-medium">Transaction Error</p>
              <p className="text-sm mt-1">{writeError.message}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending
              ? "Waiting for Approval..."
              : isConfirming
              ? "Confirming Transaction..."
              : "Create Market"}
          </button>
        </form>
      )}
    </div>
  );
}
