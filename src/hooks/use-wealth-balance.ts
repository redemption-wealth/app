"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI } from "@/lib/erc20-abi";
import { env } from "@/lib/env";

export function useWealthBalance(walletAddress?: string | null) {
  const tokenAddress = env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS as `0x${string}`;

  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(walletAddress),
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
