import { describe, expect, it } from "vitest";
import { BaseError, UserRejectedRequestError } from "viem";
import {
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
