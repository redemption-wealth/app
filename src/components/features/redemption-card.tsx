"use client";

import Link from "next/link";
import type { Redemption } from "@/lib/schemas/redemption";
import { formatDate, formatWealth } from "@/lib/utils";

interface RedemptionCardProps {
  redemption: Redemption;
}

const STATUS_STYLES: Record<Redemption["status"], string> = {
  pending: "bg-tertiary-container text-on-tertiary-container",
  confirmed: "bg-primary-container text-on-primary-container",
  failed: "bg-error-container text-on-error-container",
};

const STATUS_LABELS: Record<Redemption["status"], string> = {
  pending: "Menunggu",
  confirmed: "Berhasil",
  failed: "Gagal",
};

export function RedemptionCard({ redemption }: RedemptionCardProps) {
  return (
    <Link
      href={`/qr/${redemption.id}`}
      className="bg-surface-container-lowest hover:bg-surface-container block rounded-[var(--radius-lg)] p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-on-surface-variant text-xs tracking-wide uppercase">
            {redemption.voucher?.merchant?.name ?? "Merchant"}
          </p>
          <h4 className="font-display mt-0.5 line-clamp-2 text-sm font-bold">
            {redemption.voucher?.title ?? "Voucher"}
          </h4>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${STATUS_STYLES[redemption.status]}`}
        >
          {STATUS_LABELS[redemption.status]}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-on-surface-variant text-xs">
          {formatDate(redemption.redeemedAt)}
        </p>
        <p className="font-display text-sm font-bold">
          {formatWealth(redemption.wealthAmount)}{" "}
          <span className="text-on-surface-variant text-xs">$WEALTH</span>
        </p>
      </div>
    </Link>
  );
}
