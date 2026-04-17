"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { parseUnits, UserRejectedRequestError } from "viem";
import { useWriteContract } from "wagmi";
import { useAuth } from "@/hooks/use-auth";
import { useWalletHealth } from "@/hooks/use-wallet-health";
import { ApiError } from "@/lib/api/errors";
import { endpoints } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { ERC20_ABI } from "@/lib/erc20-abi";
import { telemetry } from "@/lib/telemetry";
import type {
  RedeemVoucherResponse,
  Redemption,
} from "@/lib/schemas/redemption";
import { useRedemptionFlow } from "@/stores/redemption-flow";

const SUBMIT_TX_MAX_ATTEMPTS = 3;
const SUBMIT_TX_BASE_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUserReject(err: unknown): boolean {
  if (err instanceof UserRejectedRequestError) return true;
  if (err && typeof err === "object") {
    const e = err as { code?: number; name?: string; message?: string };
    if (e.code === 4001) return true;
    if (e.name === "UserRejectedRequestError") return true;
    if (typeof e.message === "string" && /user rejected/i.test(e.message))
      return true;
  }
  return false;
}

async function submitTxWithRetry(
  redemptionId: string,
  txHash: string,
): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= SUBMIT_TX_MAX_ATTEMPTS; attempt += 1) {
    try {
      await endpoints.submitTxHash(redemptionId, txHash);
      return;
    } catch (err) {
      lastErr = err;
      const retriable =
        err instanceof ApiError ? err.isServerError || err.status === 0 : true;
      if (!retriable || attempt === SUBMIT_TX_MAX_ATTEMPTS) break;
      await sleep(SUBMIT_TX_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

function existingRedemptionNeedsSignature(redemption: Redemption): boolean {
  return redemption.status === "pending" && !redemption.txHash;
}

export function useRedeemVoucher() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const { writeContractAsync } = useWriteContract();
  const walletHealth = useWalletHealth();
  const initiateStore = useRedemptionFlow((s) => s.initiate);
  const transition = useRedemptionFlow((s) => s.transition);
  const setError = useRedemptionFlow((s) => s.setError);
  const reset = useRedemptionFlow((s) => s.reset);

  const signAndSubmit = useCallback(
    async (
      redemptionId: string,
      amountWealth: string,
      treasury: `0x${string}`,
      tokenAddress: `0x${string}`,
    ) => {
      transition("opening-wallet", { redemptionId });
      if (!walletAddress) {
        throw new Error("Wallet belum siap");
      }

      if (!walletHealth.isHealthy()) {
        transition("wallet-recovering");
        const recovered = await walletHealth.recover(10_000);
        if (!recovered) {
          router.push(`/qr/${redemptionId}`);
          return;
        }
        transition("opening-wallet");
      }

      transition("awaiting-signature");
      const parsedAmount = parseUnits(amountWealth, 18);
      const txHash = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [treasury, parsedAmount],
      });

      transition("broadcasting", { txHash });
      transition("submitting-hash");
      await submitTxWithRetry(redemptionId, txHash);

      transition("polling-confirmation");
      router.push(`/qr/${redemptionId}`);
    },
    [router, transition, walletAddress, walletHealth, writeContractAsync],
  );

  const start = useCallback(
    async (voucherId: string) => {
      try {
        initiateStore(voucherId);

        const priceData = await endpoints.getWealthPrice();
        transition("initiating", { priceLock: priceData.priceIdr });

        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        let redeemResult: RedeemVoucherResponse;
        try {
          redeemResult = await endpoints.redeemVoucher(voucherId, {
            idempotencyKey,
            wealthPriceIdr: priceData.priceIdr,
          });
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            const existingId =
              (err.body?.redemptionId as string | undefined) ?? null;
            if (existingId) {
              transition("polling-confirmation", { redemptionId: existingId });
              router.push(`/qr/${existingId}`);
              return;
            }
          }
          throw err;
        }

        const { redemption, alreadyExists, txDetails } = redeemResult;

        if (alreadyExists && redemption.txHash) {
          transition("polling-confirmation", {
            redemptionId: redemption.id,
            txHash: redemption.txHash,
          });
          router.push(`/qr/${redemption.id}`);
          return;
        }

        if (alreadyExists && !existingRedemptionNeedsSignature(redemption)) {
          transition("polling-confirmation", { redemptionId: redemption.id });
          router.push(`/qr/${redemption.id}`);
          return;
        }

        const tokenAddress = (txDetails?.tokenContractAddress ??
          env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS) as `0x${string}`;
        const treasury = txDetails?.treasuryWalletAddress as
          | `0x${string}`
          | undefined;
        if (!treasury) {
          throw new Error(
            "Treasury wallet tidak tersedia dari backend. Coba lagi.",
          );
        }
        const amount = txDetails?.wealthAmount ?? redemption.wealthAmount;

        await signAndSubmit(redemption.id, amount, treasury, tokenAddress);
      } catch (err) {
        if (isUserReject(err)) {
          reset();
          return;
        }
        if (err instanceof ApiError && err.isUnauthorized) {
          reset();
          router.push("/auth/login");
          return;
        }
        telemetry.capture(err, { scope: "redeem-voucher", voucherId });
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
        setError(message);
      }
    },
    [initiateStore, reset, router, setError, signAndSubmit, transition],
  );

  const retry = useCallback(
    async (voucherId: string) => {
      reset();
      await start(voucherId);
    },
    [reset, start],
  );

  return { start, retry, cancel: reset };
}
