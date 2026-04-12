// ─── Merchant ────────────────────────────────────────────────────────────────

export type MerchantCategory =
  | "kuliner"
  | "hiburan"
  | "event"
  | "kesehatan"
  | "lifestyle"
  | "travel";

export interface Merchant {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  category: MerchantCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Voucher ─────────────────────────────────────────────────────────────────

export interface Voucher {
  id: string;
  merchantId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  totalStock: number;
  remainingStock: number;
  priceIdr: number;
  isActive: boolean;
  merchant?: Merchant;
  createdAt: string;
  updatedAt: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  privyUserId: string;
  walletAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Redemption ──────────────────────────────────────────────────────────────

export type RedemptionStatus = "pending" | "confirmed" | "failed";

export interface Redemption {
  id: string;
  userId: string;
  voucherId: string;
  qrCodeId: string;
  wealthAmount: string;
  priceIdrAtRedeem: number;
  wealthPriceIdrAtRedeem: string;
  devCutAmount: string;
  txHash: string | null;
  idempotencyKey: string;
  status: RedemptionStatus;
  redeemedAt: string;
  confirmedAt: string | null;
  voucher?: Voucher;
  qrCode?: { imageUrl: string };
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionType = "deposit" | "withdrawal" | "redeem";
export type TransactionStatus = "pending" | "confirmed" | "failed";

export interface Transaction {
  id: string;
  userId: string;
  redemptionId: string | null;
  type: TransactionType;
  amountWealth: string;
  txHash: string | null;
  status: TransactionStatus;
  createdAt: string;
  confirmedAt: string | null;
}
