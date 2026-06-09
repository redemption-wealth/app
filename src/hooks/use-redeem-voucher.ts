"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useSendTransaction } from "@privy-io/react-auth";
import { encodeFunctionData, parseUnits } from "viem";
import { useAuth } from "@/hooks/use-auth";
import { TARGET_CHAIN_ID } from "@/lib/chain";
import { useWalletHealth } from "@/hooks/use-wallet-health";
import { ApiError } from "@/lib/api/errors";
import { endpoints } from "@/lib/api/endpoints";
import { env } from "@/lib/env";
import { ERC20_ABI } from "@/lib/erc20-abi";
import { telemetry } from "@/lib/telemetry";
import { classifyWalletError, isUserReject } from "@/lib/wallet-errors";
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
  const { walletAddress, login, authenticated } = useAuth();
  const { sendTransaction } = useSendTransaction();
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
      onBroadcast: () => void,
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
      // Gasless redemption: Privy sponsors the gas (`sponsor: true`) so users
      // never need ETH to redeem. Sponsorship is enabled + funded in the Privy
      // dashboard; the flag is per-transaction (not automatic), so only this
      // WEALTH transfer is sponsored. `showWalletUIs: false` keeps our own
      // Indonesian signing UI in control, matching the global Privy config.
      const { hash: txHash } = await sendTransaction(
        {
          to: tokenAddress,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [treasury, parsedAmount],
          }),
          chainId: TARGET_CHAIN_ID,
        },
        {
          sponsor: true,
          address: walletAddress,
          uiOptions: { showWalletUIs: false },
        },
      );
      // Past this point a transaction exists on-chain — it must NOT be cancelled.
      onBroadcast();

      transition("broadcasting", { txHash });
      transition("submitting-hash");
      await submitTxWithRetry(redemptionId, txHash);

      transition("polling-confirmation");
      router.push(`/qr/${redemptionId}`);
    },
    [router, sendTransaction, transition, walletAddress, walletHealth],
  );

  const start = useCallback(
    async (voucherId: string) => {
      // Defense-in-depth: button-level guard is primary; this prevents
      // a redemption attempt if the consumer skips the button gating.
      if (!authenticated) return;
      let pendingRedemptionId: string | null = null;
      let broadcasted = false;
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

        pendingRedemptionId = redemption.id;
        await signAndSubmit(
          redemption.id,
          amount,
          treasury,
          tokenAddress,
          () => {
            broadcasted = true;
          },
        );
      } catch (err) {
        // If the wallet never broadcast a tx (gas too low, user reject, wallet
        // error), release the reserved pending so no orphan transaction lingers.
        if (pendingRedemptionId && !broadcasted) {
          await endpoints.cancelRedemption(pendingRedemptionId).catch(() => {});
        }
        if (isUserReject(err)) {
          reset();
          return;
        }
        if (err instanceof ApiError && err.isUnauthorized) {
          reset();
          login();
          return;
        }
        telemetry.capture(err, { scope: "redeem-voucher", voucherId });
        setError(classifyWalletError(err).message);
      }
    },
    [
      authenticated,
      initiateStore,
      login,
      reset,
      router,
      setError,
      signAndSubmit,
      transition,
    ],
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
