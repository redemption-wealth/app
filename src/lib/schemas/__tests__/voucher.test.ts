import { describe, expect, it } from "vitest";
import {
  voucherDetailResponseSchema,
  voucherListResponseSchema,
  voucherSchema,
} from "../voucher";

const baseVoucher = {
  id: "v1",
  merchantId: "m1",
  title: "Coffee Voucher",
  description: "Discount",
  startDate: "2026-01-01T00:00:00Z",
  expiryDate: "2026-12-31T00:00:00Z",
  totalStock: 100,
  remainingStock: 50,
  basePrice: "1000",
  appFeeRate: "0.02",
  gasFeeAmount: "0.5",
  totalPrice: "1020.5",
  qrPerSlot: 1,
  isActive: true,
  createdBy: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("voucherSchema", () => {
  it("parses a valid voucher fixture", () => {
    expect(() => voucherSchema.parse(baseVoucher)).not.toThrow();
  });

  it("accepts numeric decimal strings from backend", () => {
    const parsed = voucherSchema.parse({ ...baseVoucher, basePrice: 1000 });
    expect(parsed.basePrice).toBe("1000");
  });

  it("rejects voucher missing required field", () => {
    const invalid: Record<string, unknown> = { ...baseVoucher };
    delete invalid.title;
    expect(() => voucherSchema.parse(invalid)).toThrow();
  });
});

describe("voucherListResponseSchema", () => {
  it("parses a list response fixture", () => {
    const response = {
      vouchers: [baseVoucher],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    expect(() => voucherListResponseSchema.parse(response)).not.toThrow();
  });

  it("rejects pagination with negative total", () => {
    const response = {
      vouchers: [baseVoucher],
      pagination: { page: 1, limit: 10, total: -1, totalPages: 1 },
    };
    expect(() => voucherListResponseSchema.parse(response)).toThrow();
  });
});

describe("voucherDetailResponseSchema", () => {
  it("parses a detail response fixture", () => {
    expect(() =>
      voucherDetailResponseSchema.parse({ voucher: baseVoucher }),
    ).not.toThrow();
  });
});
