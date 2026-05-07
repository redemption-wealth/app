import { describe, expect, it } from "vitest";
import { isVoucherSitemapEligible } from "@/lib/sitemap-filter";

describe("isVoucherSitemapEligible", () => {
  const now = new Date("2026-05-08T03:00:00Z");

  it("excludes inactive vouchers", () => {
    expect(
      isVoucherSitemapEligible(
        {
          isActive: false,
          remainingStock: 10,
          expiryDate: "2026-12-31",
        },
        now,
      ),
    ).toBe(false);
  });

  it("excludes voucher with zero stock", () => {
    expect(
      isVoucherSitemapEligible(
        {
          isActive: true,
          remainingStock: 0,
          expiryDate: "2026-12-31",
        },
        now,
      ),
    ).toBe(false);
  });

  it("excludes voucher with past expiry (UTC date)", () => {
    expect(
      isVoucherSitemapEligible(
        {
          isActive: true,
          remainingStock: 10,
          expiryDate: "2026-05-06",
        },
        now,
      ),
    ).toBe(false);
  });

  it("includes voucher whose expiry day is today in WIB", () => {
    // 2026-05-08 16:59:59 UTC == 23:59:59 WIB → still valid at 03:00 UTC
    expect(
      isVoucherSitemapEligible(
        {
          isActive: true,
          remainingStock: 10,
          expiryDate: "2026-05-08",
        },
        now,
      ),
    ).toBe(true);
  });

  it("includes future-expiry valid voucher", () => {
    expect(
      isVoucherSitemapEligible(
        {
          isActive: true,
          remainingStock: 10,
          expiryDate: "2026-12-31",
        },
        now,
      ),
    ).toBe(true);
  });
});
