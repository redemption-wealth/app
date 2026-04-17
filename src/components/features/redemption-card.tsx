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
      className="block bg-surface-container-lowest rounded-[var(--radius-lg)] p-4 hover:bg-surface-container transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">
            {redemption.voucher?.merchant?.name ?? "Merchant"}
          </p>
          <h4 className="font-display text-sm font-bold line-clamp-2 mt-0.5">
            {redemption.voucher?.title ?? "Voucher"}
          </h4>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${STATUS_STYLES[redemption.status]}`}
        >
          {STATUS_LABELS[redemption.status]}
        </span>
      </div>
      <div className="flex items-end justify-between mt-3">
        <p className="text-xs text-on-surface-variant">
          {formatDate(redemption.redeemedAt)}
        </p>
        <p className="font-display text-sm font-bold">
          {formatWealth(redemption.wealthAmount)}{" "}
          <span className="text-xs text-on-surface-variant">$WEALTH</span>
        </p>
      </div>
    </Link>
  );
}
