import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWealth(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(num);
}

export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

// Like formatDate but appends 24h time with seconds (WIB), e.g.
// "12 Agu 2026 15:45:30". Use for exact moments (timestamps); the time uses
// colons (en-GB) rather than id-ID's dots so it reads as 15:45:30.
export function formatDateTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const datePart = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(date);
  return `${datePart} ${timePart}`;
}

export function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isVoucherValid(voucher: {
  isActive: boolean;
  remainingStock: number;
  expiryDate: Date | string;
}): boolean {
  const now = new Date();
  const end =
    typeof voucher.expiryDate === "string"
      ? new Date(voucher.expiryDate)
      : voucher.expiryDate;
  // Voucher is valid through the entire expiry day in WIB (UTC+7)
  end.setUTCHours(16, 59, 59, 999); // 23:59:59 WIB = 16:59:59 UTC
  return voucher.isActive && voucher.remainingStock > 0 && end >= now;
}

// True once a voucher's validity window has fully passed. Valid through the
// entire expiry day in WIB (UTC+7), matching isVoucherValid / the backend.
export function isVoucherExpired(expiryDate: Date | string): boolean {
  const end =
    typeof expiryDate === "string"
      ? new Date(expiryDate)
      : new Date(expiryDate);
  end.setUTCHours(16, 59, 59, 999); // 23:59:59 WIB = 16:59:59 UTC
  return end < new Date();
}
