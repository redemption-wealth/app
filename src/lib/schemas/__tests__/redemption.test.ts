import { describe, expect, it } from "vitest";
import {
  redeemVoucherRequestSchema,
  redeemVoucherResponseSchema,
  redemptionSchema,
} from "../redemption";

const baseRedemption = {
  id: "r1",
  userId: "u1",
  voucherId: "v1",
  wealthAmount: "10.5",
  priceIdrAtRedeem: 1000,
  wealthPriceIdrAtRedeem: "100",
  appFeeAmount: "0.21",
  gasFeeAmount: "0.5",
  txHash: null,
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  status: "pending" as const,
  redeemedAt: "2026-04-17T00:00:00Z",
  confirmedAt: null,
  createdAt: "2026-04-17T00:00:00Z",
};

describe("redemptionSchema", () => {
  it("parses a pending redemption", () => {
    expect(() => redemptionSchema.parse(baseRedemption)).not.toThrow();
  });

  it("rejects unknown status", () => {
    expect(() =>
      redemptionSchema.parse({ ...baseRedemption, status: "unknown" }),
    ).toThrow();
  });
});

describe("redeemVoucherRequestSchema", () => {
  it("accepts valid uuid idempotency key", () => {
    const request = {
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      wealthPriceIdr: 100,
    };
    expect(() => redeemVoucherRequestSchema.parse(request)).not.toThrow();
  });

  it("rejects non-uuid idempotency key", () => {
    expect(() =>
      redeemVoucherRequestSchema.parse({
        idempotencyKey: "not-a-uuid",
        wealthPriceIdr: 100,
      }),
    ).toThrow();
  });

  it("rejects non-positive price", () => {
    expect(() =>
      redeemVoucherRequestSchema.parse({
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
        wealthPriceIdr: 0,
      }),
    ).toThrow();
  });
});

describe("redeemVoucherResponseSchema", () => {
  it("parses alreadyExists=true with txDetails=null (idempotent replay)", () => {
    const response = {
      redemption: {
        ...baseRedemption,
        txHash: "0xabc",
        status: "confirmed" as const,
      },
      alreadyExists: true,
    };
    expect(() => redeemVoucherResponseSchema.parse(response)).not.toThrow();
  });

  it("parses first-time redemption with txDetails", () => {
    const response = {
      redemption: baseRedemption,
      txDetails: {
        tokenContractAddress: "0x" + "1".repeat(40),
        treasuryWalletAddress: "0x" + "2".repeat(40),
        wealthAmount: "10.5",
      },
    };
    expect(() => redeemVoucherResponseSchema.parse(response)).not.toThrow();
  });
});
