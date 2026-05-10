import type { Redemption, RedemptionStatus } from "@/lib/schemas/redemption";

export type HistoryEntryKind = "redeem" | "deposit" | "withdrawal";

export interface HistoryEntry {
  id: string;
  kind: HistoryEntryKind;
  amountWealth: string;
  status: RedemptionStatus;
  txHash: string | null;
  createdAt: string;
  merchantName?: string;
  voucherTitle?: string;
  redemptionId?: string;
}

export function redemptionToHistoryEntry(r: Redemption): HistoryEntry {
  const entry: HistoryEntry = {
    id: r.id,
    kind: "redeem",
    amountWealth: r.wealthAmount,
    status: r.status,
    txHash: r.txHash ?? null,
    createdAt: r.createdAt,
    redemptionId: r.id,
  };
  const merchantName = r.voucher?.merchant?.name;
  if (merchantName) entry.merchantName = merchantName;
  const voucherTitle = r.voucher?.title;
  if (voucherTitle) entry.voucherTitle = voucherTitle;
  return entry;
}
