import { BaseError, UserRejectedRequestError } from "viem";

function walkError(err: unknown): unknown[] {
  const chain: unknown[] = [];
  if (err instanceof BaseError) {
    err.walk((cause) => {
      chain.push(cause);
      return false;
    });
  }
  chain.push(err);
  return chain;
}

export function isUserReject(err: unknown): boolean {
  if (err instanceof UserRejectedRequestError) return true;

  for (const node of walkError(err)) {
    if (node instanceof UserRejectedRequestError) return true;
    if (node && typeof node === "object") {
      const e = node as { code?: number; name?: string; message?: string };
      if (e.code === 4001) return true;
      if (e.name === "UserRejectedRequestError") return true;
      if (typeof e.message === "string" && /user rejected/i.test(e.message)) {
        return true;
      }
    }
  }
  return false;
}

export function isInsufficientFunds(err: unknown): boolean {
  for (const node of walkError(err)) {
    if (node && typeof node === "object") {
      const e = node as { name?: string; message?: string };
      if (e.name === "InsufficientFundsError") return true;
      if (
        typeof e.message === "string" &&
        /insufficient funds/i.test(e.message)
      ) {
        return true;
      }
    }
  }
  return false;
}

export type ContractRevertResult =
  | { reverted: true; reason: string | undefined }
  | { reverted: false };

export function isContractRevert(err: unknown): ContractRevertResult {
  for (const node of walkError(err)) {
    if (node && typeof node === "object") {
      const e = node as {
        name?: string;
        shortMessage?: string;
        reason?: string;
      };
      if (
        e.name === "ContractFunctionRevertedError" ||
        e.name === "ContractFunctionExecutionError"
      ) {
        const reason =
          (typeof e.reason === "string" && e.reason) ||
          (typeof e.shortMessage === "string" && e.shortMessage) ||
          undefined;
        return { reverted: true, reason };
      }
    }
  }
  return { reverted: false };
}

export type WalletErrorReason =
  | "insufficient_gas"
  | "transfer_failed"
  | "rpc_error";

export interface WalletErrorInfo {
  reason: WalletErrorReason;
  message: string;
}

/**
 * Maps a thrown wallet/transaction error to a friendly Indonesian message.
 * Caller should handle `isUserReject` separately (it is not an error to show).
 */
export function classifyWalletError(err: unknown): WalletErrorInfo {
  if (isInsufficientFunds(err)) {
    return {
      reason: "insufficient_gas",
      message: "Saldo ETH tidak cukup untuk biaya gas. Top up gas dulu.",
    };
  }
  const revert = isContractRevert(err);
  if (revert.reverted) {
    return {
      reason: "transfer_failed",
      message: revert.reason ?? "Transaksi ditolak oleh kontrak. Coba lagi.",
    };
  }
  return {
    reason: "rpc_error",
    message: "Terjadi kesalahan jaringan. Coba lagi.",
  };
}
