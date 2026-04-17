"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ERC20_ABI } from "@/lib/erc20-abi";
import { env } from "@/lib/env";

export function useSendWealth() {
  const tokenAddress = env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS as `0x${string}`;
  const treasuryAddress = env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS as `0x${string}`;

  const {
    writeContract,
    data: txHash,
    isPending: isSigning,
    error: signError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const sendWealth = (amount: string) => {
    const parsedAmount = parseUnits(amount, 18);

    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [treasuryAddress, parsedAmount],
    });
  };

  return {
    sendWealth,
    txHash,
    isSigning,
    isConfirming,
    isConfirmed,
    error: signError || confirmError,
  };
}
