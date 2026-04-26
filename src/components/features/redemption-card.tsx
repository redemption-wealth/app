"use client";

import Link from "next/link";
import type { Redemption } from "@/lib/schemas/redemption";
import { formatDate, formatWealth } from "@/lib/utils";
import { CategoryTile } from "@/components/shared/category-tile";

interface RedemptionCardProps {
  redemption: Redemption;
}

const STATUS_STYLES: Record<Redemption["status"], string> = {
  pending: "bg-tertiary-container text-on-tertiary-container",
  confirmed: "bg-success-container text-on-success-container",
  failed: "bg-error-container text-error",
};

const STATUS_LABELS: Record<Redemption["status"], string> = {
  pending: "Menunggu",
  confirmed: "Berhasil",
  failed: "Gagal",
};

export function RedemptionCard({ redemption }: RedemptionCardProps) {
  const merchantName = redemption.voucher?.merchant?.name ?? "Merchant";

  return (
    <Link
      href={`/qr/${redemption.id}`}
      className="border-border hover:border-surface-container-highest block rounded-[var(--radius-lg)] border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <CategoryTile name={merchantName} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-on-surface-variant text-xs">{merchantName}</p>
              <h4 className="font-display text-on-surface mt-0.5 line-clamp-2 text-sm font-bold">
                {redemption.voucher?.title ?? "Voucher"}
              </h4>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[redemption.status]}`}
            >
              {STATUS_LABELS[redemption.status]}
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-outline text-xs">
              {formatDate(redemption.redeemedAt)}
            </p>
            <p className="font-display text-on-surface text-sm font-bold">
              {formatWealth(redemption.wealthAmount)}{" "}
              <span className="text-on-surface-variant text-xs">$WEALTH</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
