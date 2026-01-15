"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MARKET_ABI } from "@/lib/contracts";
import { formatEther, parseEther } from "viem";

interface UseMarketOptions {
  marketAddress: `0x${string}`;
}

export function useMarket({ marketAddress }: UseMarketOptions) {
  const { address } = useAccount();

  // Read market info
  const {
    data: marketInfo,
    isLoading: marketLoading,
    refetch: refetchMarket,
  } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: "getMarketInfo",
  });

  // Read user position
  const {
    data: position,
    isLoading: positionLoading,
    refetch: refetchPosition,
  } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: "getPosition",
    args: address ? [address] : undefined,
  });

  // Write functions
  const {
    writeContract: writeBuyShares,
    data: buyHash,
    isPending: isBuying,
  } = useWriteContract();

  const {
    writeContract: writeSellShares,
    data: sellHash,
    isPending: isSelling,
  } = useWriteContract();

  const {
    writeContract: writeClaimWinnings,
    data: claimHash,
    isPending: isClaiming,
  } = useWriteContract();

  // Transaction receipts
  const { isLoading: isBuyConfirming, isSuccess: buySuccess } =
    useWaitForTransactionReceipt({ hash: buyHash });
  const { isLoading: isSellConfirming, isSuccess: sellSuccess } =
    useWaitForTransactionReceipt({ hash: sellHash });
  const { isLoading: isClaimConfirming, isSuccess: claimSuccess } =
    useWaitForTransactionReceipt({ hash: claimHash });

  // Computed values
  const totalShares = marketInfo
    ? marketInfo.totalYesShares + marketInfo.totalNoShares
    : BigInt(0);

  const yesPrice = totalShares > 0n && marketInfo
    ? Number((marketInfo.totalNoShares * BigInt(100)) / totalShares)
    : 50;

  const noPrice = 100 - yesPrice;

  const isActive = marketInfo
    ? Date.now() / 1000 < Number(marketInfo.endTime) && !marketInfo.resolved
    : false;

  const timeRemaining = marketInfo
    ? Math.max(0, Number(marketInfo.endTime) - Math.floor(Date.now() / 1000))
    : 0;

  // Actions
  const buyShares = (isYes: boolean, amount: string, minShares: bigint = BigInt(0)) => {
    writeBuyShares({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: "buyShares",
      args: [isYes, minShares],
      value: parseEther(amount),
    });
  };

  const sellShares = (isYes: boolean, shares: bigint, minPayout: bigint = BigInt(0)) => {
    writeSellShares({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: "sellShares",
      args: [isYes, shares, minPayout],
    });
  };

  const claimWinnings = () => {
    writeClaimWinnings({
      address: marketAddress,
      abi: MARKET_ABI,
      functionName: "claimWinnings",
    });
  };

  const refetch = () => {
    refetchMarket();
    refetchPosition();
  };

  return {
    // Market data
    market: marketInfo,
    marketLoading,

    // Position data
    position: {
      yesShares: position?.[0] || BigInt(0),
      noShares: position?.[1] || BigInt(0),
    },
    positionLoading,

    // Computed values
    yesPrice,
    noPrice,
    isActive,
    timeRemaining,
    totalPool: marketInfo ? formatEther(marketInfo.totalPool) : "0",

    // Actions
    buyShares,
    sellShares,
    claimWinnings,
    refetch,

    // Transaction states
    transactions: {
      buy: {
        isPending: isBuying,
        isConfirming: isBuyConfirming,
        isSuccess: buySuccess,
        hash: buyHash,
      },
      sell: {
        isPending: isSelling,
        isConfirming: isSellConfirming,
        isSuccess: sellSuccess,
        hash: sellHash,
      },
      claim: {
        isPending: isClaiming,
        isConfirming: isClaimConfirming,
        isSuccess: claimSuccess,
        hash: claimHash,
      },
    },
  };
}
