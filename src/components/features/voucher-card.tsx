"use client";

import Link from "next/link";
import type { Voucher } from "@/lib/schemas/voucher";
import { formatWealth, isVoucherValid } from "@/lib/utils";

interface VoucherCardProps {
  voucher: Voucher;
}

export function VoucherCard({ voucher }: VoucherCardProps) {
  const valid = isVoucherValid(voucher);
  const isBogo = voucher.qrPerSlot > 1;

  return (
    <Link
      href={`/vouchers/${voucher.id}`}
      className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-4 flex flex-col justify-between gap-3 hover:bg-surface-container transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">
            {voucher.merchant?.name ?? "Voucher"}
          </p>
          <h4 className="font-display text-sm font-bold line-clamp-2">
            {voucher.title}
          </h4>
        </div>
        {isBogo ? (
          <span className="inline-flex items-center rounded-full bg-tertiary text-on-tertiary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0">
            BOGO
          </span>
        ) : null}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-base font-bold">
            {formatWealth(voucher.totalPrice)}{" "}
            <span className="text-xs text-on-surface-variant">$WEALTH</span>
          </p>
          {!valid ? (
            <p className="text-[10px] text-error">
              {voucher.remainingStock <= 0 ? "Stok habis" : "Tidak aktif"}
            </p>
          ) : null}
        </div>
        <span className="text-xs font-semibold text-primary">Lihat →</span>
      </div>
    </Link>
  );
}
