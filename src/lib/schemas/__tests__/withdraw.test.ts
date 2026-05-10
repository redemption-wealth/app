import { describe, expect, it } from "vitest";
import {
  hasGasBudget,
  makeWithdrawSchema,
  parseWithdrawAmount,
} from "@/lib/schemas/withdraw";

const ADDRESS_VALID = "0x" + "ab".repeat(20);

describe("makeWithdrawSchema", () => {
  it("accepts valid amount and address", () => {
    const schema = makeWithdrawSchema({ rawBalance: 10n ** 18n * 5n });
    const result = schema.safeParse({
      amount: "1.5",
      targetAddress: ADDRESS_VALID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty amount", () => {
    const schema = makeWithdrawSchema({ rawBalance: 10n ** 18n });
    const result = schema.safeParse({
      amount: "",
      targetAddress: ADDRESS_VALID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects 7+ decimal places", () => {
    const schema = makeWithdrawSchema({ rawBalance: 10n ** 18n });
    const result = schema.safeParse({
      amount: "1.0000001",
      targetAddress: ADDRESS_VALID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const schema = makeWithdrawSchema({ rawBalance: 10n ** 18n });
    const result = schema.safeParse({
      amount: "0",
      targetAddress: ADDRESS_VALID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects amount over balance", () => {
    const schema = makeWithdrawSchema({ rawBalance: 10n ** 18n }); // 1 WEALTH
    const result = schema.safeParse({
      amount: "2",
      targetAddress: ADDRESS_VALID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toMatch(/saldo/i);
    }
  });

  it("rejects malformed addresses", () => {
    const schema = makeWithdrawSchema({ rawBalance: 10n ** 18n });
    const cases = [
      "0xabc",
      "ab".repeat(20),
      "0x" + "zz".repeat(20),
      "0x" + "ab".repeat(19),
    ];
    for (const targetAddress of cases) {
      expect(schema.safeParse({ amount: "1", targetAddress }).success).toBe(
        false,
      );
    }
  });
});

describe("parseWithdrawAmount", () => {
  it("parses to wei (18 decimals)", () => {
    expect(parseWithdrawAmount("1")).toBe(10n ** 18n);
    expect(parseWithdrawAmount("1.5")).toBe(15n * 10n ** 17n);
    expect(parseWithdrawAmount("0.000001")).toBe(10n ** 12n);
  });

  it("returns null for invalid input", () => {
    expect(parseWithdrawAmount("")).toBeNull();
    expect(parseWithdrawAmount("abc")).toBeNull();
    expect(parseWithdrawAmount("1.0000001")).toBeNull();
  });
});

describe("hasGasBudget", () => {
  it("returns true when nativeBalance covers gas", () => {
    expect(
      hasGasBudget({
        nativeBalance: 1_000_000n,
        estimatedGas: 21_000n,
        gasPrice: 1n,
      }),
    ).toBe(true);
  });

  it("returns false when nativeBalance is short", () => {
    expect(
      hasGasBudget({
        nativeBalance: 1_000n,
        estimatedGas: 21_000n,
        gasPrice: 1n,
      }),
    ).toBe(false);
  });

  it("returns false on zero nativeBalance with non-zero gas", () => {
    expect(
      hasGasBudget({ nativeBalance: 0n, estimatedGas: 21_000n, gasPrice: 1n }),
    ).toBe(false);
  });

  it("returns true when estimatedGas is zero (defensive)", () => {
    expect(
      hasGasBudget({ nativeBalance: 0n, estimatedGas: 0n, gasPrice: 1n }),
    ).toBe(true);
  });
});
