import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatMNT(value: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0").slice(0, 4);

  return `${integerPart}.${fractionalStr}`;
}

export function parseMNT(value: string, decimals: number = 18): bigint {
  const [integerPart, fractionalPart = ""] = value.split(".");
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);
  const fullValue = integerPart + paddedFractional;
  return BigInt(fullValue);
}

export function calculateTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;

  if (remaining <= 0) return "Ended";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getPricePercentage(price: bigint): number {
  // Price is in wei (1e18 = 100%)
  return Number(price) / 1e16; // Returns 0-100
}

export const CATEGORIES = [
  "All",
  "Commodities",
  "Bonds",
  "RealEstate",
  "Crypto",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Commodities: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Bonds: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  RealEstate: "bg-green-500/20 text-green-400 border-green-500/30",
  Crypto: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
