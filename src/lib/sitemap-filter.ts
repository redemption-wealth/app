interface VoucherSnapshot {
  isActive: boolean;
  remainingStock: number;
  expiryDate: string | Date;
}

/**
 * Voucher is sitemap-eligible only when it's active AND in stock AND
 * still within the WIB end-of-day expiry window. Mirrors isVoucherValid
 * so we don't index soft-404 voucher pages that have expired.
 */
export function isVoucherSitemapEligible(
  voucher: VoucherSnapshot,
  now: Date = new Date(),
): boolean {
  if (!voucher.isActive) return false;
  if (voucher.remainingStock <= 0) return false;
  const end =
    typeof voucher.expiryDate === "string"
      ? new Date(voucher.expiryDate)
      : new Date(voucher.expiryDate.getTime());
  end.setUTCHours(16, 59, 59, 999); // 23:59:59 WIB = 16:59:59 UTC
  return end >= now;
}
