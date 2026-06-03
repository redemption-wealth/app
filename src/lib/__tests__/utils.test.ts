import { describe, it, expect } from "vitest";
import {
  formatIdr,
  formatWealth,
  truncateAddress,
  isVoucherValid,
  isVoucherExpired,
} from "@/lib/utils";

// Project convention (UAT prereq): WEALTH 4dp, IDR 0dp, id-ID locale.
describe("formatWealth — always 4 decimals", () => {
  it("integer keeps 4 fraction digits", () => {
    expect(formatWealth(5)).toMatch(/^5,0000$/);
  });
  it("string and number inputs are equivalent", () => {
    expect(formatWealth("1234.5")).toBe(formatWealth(1234.5));
  });
  it("rounds to 4 decimals", () => {
    expect(formatWealth(1.234567)).toMatch(/1,2346$/);
  });
  it("groups thousands with '.'", () => {
    expect(formatWealth(1234567.891)).toMatch(/^1\.234\.567,8910$/);
  });
  it("edge: zero and negative", () => {
    expect(formatWealth(0)).toBe("0,0000");
    expect(formatWealth(-2.5)).toMatch(/^-2,5000$/);
  });
});

describe("formatIdr — 0 decimals", () => {
  it("no decimal part, has Rp", () => {
    const o = formatIdr(25000);
    expect(o).toMatch(/Rp/);
    expect(o).not.toMatch(/,\d/);
  });
  it("rounds fractional to whole", () => {
    expect(formatIdr(25000.9)).not.toMatch(/,\d/);
  });
  it("edge: zero and large grouped", () => {
    expect(formatIdr(0)).toMatch(/Rp\s?0/);
    expect(formatIdr(1000000)).toMatch(/1\.000\.000/);
  });
});

describe("truncateAddress", () => {
  it("truncates a 0x40 address to 0x1234...abcd shape", () => {
    const a = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(a)).toBe("0x1234...5678");
  });
  it("edge: short string (<=10) returned unchanged", () => {
    expect(truncateAddress("0x12345678")).toBe("0x12345678");
    expect(truncateAddress("")).toBe("");
  });
});

// UAT A3/A8 — voucher gating: active + in stock + not past WIB expiry day
describe("isVoucherValid", () => {
  const future = "2999-12-31";
  const past = "2000-01-01";

  it("positive: active, in stock, far-future expiry → valid", () => {
    expect(
      isVoucherValid({ isActive: true, remainingStock: 5, expiryDate: future }),
    ).toBe(true);
  });

  it("negative: inactive → invalid even if stocked & not expired", () => {
    expect(
      isVoucherValid({
        isActive: false,
        remainingStock: 5,
        expiryDate: future,
      }),
    ).toBe(false);
  });

  it("negative: zero stock → invalid", () => {
    expect(
      isVoucherValid({ isActive: true, remainingStock: 0, expiryDate: future }),
    ).toBe(false);
  });

  it("negative: past expiry → invalid", () => {
    expect(
      isVoucherValid({ isActive: true, remainingStock: 5, expiryDate: past }),
    ).toBe(false);
  });

  it("edge: accepts Date object input", () => {
    expect(
      isVoucherValid({
        isActive: true,
        remainingStock: 1,
        expiryDate: new Date("2999-01-01T00:00:00Z"),
      }),
    ).toBe(true);
  });

  it("edge: expiry tomorrow is valid (WIB end-of-day extension)", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(
      isVoucherValid({
        isActive: true,
        remainingStock: 1,
        expiryDate: tomorrow,
      }),
    ).toBe(true);
  });

  it("edge: yesterday expiry is invalid", () => {
    const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000);
    expect(
      isVoucherValid({
        isActive: true,
        remainingStock: 1,
        expiryDate: yesterday,
      }),
    ).toBe(false);
  });

  it("negative: stock cannot be negative", () => {
    expect(
      isVoucherValid({
        isActive: true,
        remainingStock: -1,
        expiryDate: future,
      }),
    ).toBe(false);
  });
});

// Drives the "Kedaluwarsa" QR status — true only once the WIB expiry day passed.
describe("isVoucherExpired", () => {
  it("far-future expiry → not expired", () => {
    expect(isVoucherExpired("2999-12-31")).toBe(false);
  });

  it("far-past expiry → expired", () => {
    expect(isVoucherExpired("2000-01-01")).toBe(true);
  });

  it("expiry tomorrow is not expired (WIB end-of-day extension)", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(isVoucherExpired(tomorrow)).toBe(false);
  });

  it("yesterday expiry is expired", () => {
    const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000);
    expect(isVoucherExpired(yesterday)).toBe(true);
  });

  it("accepts Date object input", () => {
    expect(isVoucherExpired(new Date("2999-01-01T00:00:00Z"))).toBe(false);
  });
});
