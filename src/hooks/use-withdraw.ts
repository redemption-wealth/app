"use client";

import { useCallback, useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import { useAuth } from "@/hooks/use-auth";
import { env } from "@/lib/env";
import { ERC20_ABI } from "@/lib/erc20-abi";
import { hasGasBudget } from "@/lib/schemas/withdraw";
import { telemetry } from "@/lib/telemetry";
import { classifyWalletError, isUserReject } from "@/lib/wallet-errors";

export type WithdrawState =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "success"; txHash: `0x${string}` }
  | {
      kind: "error";
      reason:
        | "insufficient_gas"
        | "transfer_failed"
        | "rpc_error"
        | "wallet_unavailable";
      message: string;
    };

interface StartArgs {
  amountWei: bigint;
  targetAddress: `0x${string}`;
}

export function useWithdraw() {
  const { walletAddress } = useAuth();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<WithdrawState>({ kind: "idle" });

  const start = useCallback(
    async ({ amountWei, targetAddress }: StartArgs) => {
      if (!walletAddress || !publicClient) {
        setState({
          kind: "error",
          reason: "wallet_unavailable",
          message: "Dompet belum siap. Coba refresh halaman.",
        });
        return;
      }

      const tokenAddress =
        env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS as `0x${string}`;
      const account = walletAddress as `0x${string}`;

      try {
        setState({ kind: "signing" });

        const [estimatedGas, gasPrice, nativeBalance] = await Promise.all([
          publicClient.estimateContractGas({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [targetAddress, amountWei],
            account,
          }),
          publicClient.getGasPrice(),
          publicClient.getBalance({ address: account }),
        ]);

        if (!hasGasBudget({ nativeBalance, estimatedGas, gasPrice })) {
          setState({
            kind: "error",
            reason: "insufficient_gas",
            message: "Saldo ETH tidak cukup untuk biaya gas. Top up gas dulu.",
          });
          return;
        }

        const txHash = await writeContractAsync({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [targetAddress, amountWei],
        });

        setState({ kind: "success", txHash });
      } catch (err) {
        if (isUserReject(err)) {
          setState({ kind: "idle" });
          return;
        }
        const { reason, message } = classifyWalletError(err);
        if (reason === "rpc_error") {
          telemetry.capture(err, { scope: "useWithdraw" });
        }
        setState({ kind: "error", reason, message });
      }
    },
    [publicClient, walletAddress, writeContractAsync],
  );

  const reset = useCallback(() => setState({ kind: "idle" }), []);

  return { state, start, reset };
}
