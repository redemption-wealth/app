import { describe, expect, it } from "vitest";
import { BaseError, UserRejectedRequestError } from "viem";
import {
  classifyWalletError,
  isContractRevert,
  isInsufficientFunds,
  isUserReject,
} from "@/lib/wallet-errors";

class FakeBaseError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause ? { cause: cause as Error } : undefined);
  }
}

describe("isUserReject", () => {
  it("matches viem UserRejectedRequestError", () => {
    expect(isUserReject(new UserRejectedRequestError(new Error("nope")))).toBe(
      true,
    );
  });

  it("matches EIP-1193 code 4001", () => {
    expect(isUserReject({ code: 4001 })).toBe(true);
  });

  it("matches name string", () => {
    expect(isUserReject({ name: "UserRejectedRequestError" })).toBe(true);
  });

  it("matches message regex", () => {
    expect(isUserReject({ message: "User rejected the request" })).toBe(true);
  });

  it("walks BaseError cause chain", () => {
    const inner = new UserRejectedRequestError(new Error("rejected"));
    const wrapped = new FakeBaseError("outer", inner);
    expect(isUserReject(wrapped)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isUserReject(new Error("network down"))).toBe(false);
    expect(isUserReject(null)).toBe(false);
    expect(isUserReject(undefined)).toBe(false);
    expect(isUserReject({})).toBe(false);
  });
});

describe("isInsufficientFunds", () => {
  it("matches by name on the chain", () => {
    const inner = { name: "InsufficientFundsError", message: "no eth" };
    const wrapped = new FakeBaseError("outer", inner);
    expect(isInsufficientFunds(wrapped)).toBe(true);
  });

  it("matches by message text", () => {
    expect(isInsufficientFunds({ message: "insufficient funds for gas" })).toBe(
      true,
    );
  });

  it("returns false otherwise", () => {
    expect(isInsufficientFunds(new Error("rate limited"))).toBe(false);
    expect(isInsufficientFunds(null)).toBe(false);
  });
});

describe("isContractRevert", () => {
  it("flags revert with reason from chain", () => {
    const inner = {
      name: "ContractFunctionRevertedError",
      reason: "ERC20: insufficient allowance",
    };
    const wrapped = new FakeBaseError("outer", inner);
    expect(isContractRevert(wrapped)).toEqual({
      reverted: true,
      reason: "ERC20: insufficient allowance",
    });
  });

  it("flags revert without reason", () => {
    const node = { name: "ContractFunctionRevertedError" };
    expect(isContractRevert(node)).toEqual({
      reverted: true,
      reason: undefined,
    });
  });

  it("returns reverted:false otherwise", () => {
    expect(isContractRevert(new Error("network"))).toEqual({ reverted: false });
    expect(isContractRevert(null)).toEqual({ reverted: false });
  });
});

describe("classifyWalletError", () => {
  it("maps the raw insufficient-funds gas error to a friendly message", () => {
    const err = new Error(
      "insufficient funds for gas * price + value: have 0 want 45295404479905",
    );
    expect(classifyWalletError(err)).toEqual({
      reason: "insufficient_gas",
      message: "Saldo ETH tidak cukup untuk biaya gas. Top up gas dulu.",
    });
  });

  it("maps a contract revert to its reason", () => {
    const inner = {
      name: "ContractFunctionRevertedError",
      reason: "ERC20: transfer amount exceeds balance",
    };
    const wrapped = new FakeBaseError("outer", inner);
    expect(classifyWalletError(wrapped)).toEqual({
      reason: "transfer_failed",
      message: "ERC20: transfer amount exceeds balance",
    });
  });

  it("falls back to a generic network message and never leaks raw errors", () => {
    expect(classifyWalletError(new Error("ECONNRESET blah blah"))).toEqual({
      reason: "rpc_error",
      message: "Terjadi kesalahan jaringan. Coba lagi.",
    });
    expect(classifyWalletError(null)).toEqual({
      reason: "rpc_error",
      message: "Terjadi kesalahan jaringan. Coba lagi.",
    });
  });
});
