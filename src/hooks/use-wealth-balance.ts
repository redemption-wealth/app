"use client";

import { useReadContract } from "wagmi";
import { ERC20_ABI } from "@/lib/wagmi";
import { formatUnits } from "viem";

export function useWealthBalance(walletAddress?: string | null) {
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS as
    | `0x${string}`
    | undefined;

  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!walletAddress && !!tokenAddress,
      refetchInterval: 30_000,
    },
  });

  const formatted = balance ? formatUnits(balance as bigint, 18) : "0";

  return {
    balance: formatted,
    rawBalance: balance as bigint | undefined,
    isLoading,
    refetch,
  };
}
