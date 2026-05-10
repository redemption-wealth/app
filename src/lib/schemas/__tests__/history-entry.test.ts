import { describe, expect, it } from "vitest";
import { redemptionToHistoryEntry } from "@/lib/schemas/history-entry";
import type { Redemption } from "@/lib/schemas/redemption";

const baseRedemption: Redemption = {
  id: "red-1",
  userId: "user-1",
  voucherId: "vou-1",
  wealthAmount: "12.345",
  priceIdrAtRedeem: 100_000,
  wealthPriceIdrAtRedeem: "1000",
  appFeeAmount: "0",
  gasFeeAmount: "0",
  txHash: "0xdeadbeef",
  idempotencyKey: "idem-1",
  status: "confirmed",
  redeemedAt: "2026-01-01T00:00:00.000Z",
  confirmedAt: "2026-01-01T00:01:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("redemptionToHistoryEntry", () => {
  it("normalizes a redemption with full nested voucher + merchant", () => {
    const entry = redemptionToHistoryEntry({
      ...baseRedemption,
      voucher: {
        id: "vou-1",
        merchantId: "mer-1",
        title: "Es Krim Gratis",
        description: null,
        startDate: "2026-01-01",
        expiryDate: "2026-12-31",
        totalStock: 100,
        remainingStock: 50,
        basePrice: "10",
        appFeeRate: "0.05",
        gasFeeAmount: "1",
        totalPrice: "11.5",
        qrPerSlot: 1,
        isActive: true,
        deletedAt: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        merchant: {
          id: "mer-1",
          name: "Toko Es Krim",
        } as Redemption["voucher"] extends infer V
          ? V extends { merchant?: infer M }
            ? NonNullable<M>
            : never
          : never,
      },
    });
    expect(entry).toMatchObject({
      id: "red-1",
      kind: "redeem",
      amountWealth: "12.345",
      status: "confirmed",
      txHash: "0xdeadbeef",
      merchantName: "Toko Es Krim",
      voucherTitle: "Es Krim Gratis",
      redemptionId: "red-1",
    });
  });

  it("handles null txHash", () => {
    const entry = redemptionToHistoryEntry({ ...baseRedemption, txHash: null });
    expect(entry.txHash).toBeNull();
  });

  it("omits merchantName/voucherTitle when voucher is missing", () => {
    const entry = redemptionToHistoryEntry({ ...baseRedemption });
    expect(entry.merchantName).toBeUndefined();
    expect(entry.voucherTitle).toBeUndefined();
    expect(entry.redemptionId).toBe("red-1");
  });

  it("maps status identity for all known statuses", () => {
    for (const status of ["pending", "confirmed", "failed"] as const) {
      const entry = redemptionToHistoryEntry({ ...baseRedemption, status });
      expect(entry.status).toBe(status);
    }
  });
});
