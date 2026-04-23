"use client";

import Link from "next/link";
import { usePrice } from "@/hooks/use-price";
import type { Voucher } from "@/lib/schemas/voucher";
import { formatIdr, formatWealth, isVoucherValid } from "@/lib/utils";

interface VoucherCardProps {
  voucher: Voucher;
}

export function VoucherCard({ voucher }: VoucherCardProps) {
  const { data: priceData } = usePrice();
  const valid = isVoucherValid(voucher);
  const isBogo = voucher.qrPerSlot > 1;
  const totalPriceIdr = Number(voucher.totalPrice);
  const wealthAmount =
    priceData && priceData.priceIdr > 0
      ? totalPriceIdr / priceData.priceIdr
      : null;

  return (
    <Link
      href={`/vouchers/${voucher.id}`}
      className="bg-surface-container-lowest hover:bg-surface-container flex flex-col justify-between gap-3 rounded-[var(--radius-lg)] p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-on-surface-variant text-xs tracking-wide uppercase">
            {voucher.merchant?.name ?? "Voucher"}
          </p>
          <h4 className="font-display line-clamp-2 text-sm font-bold">
            {voucher.title}
          </h4>
        </div>
        {isBogo ? (
          <span className="bg-tertiary text-on-tertiary inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
            BOGO
          </span>
        ) : null}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-base font-bold">
            {wealthAmount !== null ? formatWealth(wealthAmount) : "—"}{" "}
            <span className="text-on-surface-variant text-xs">$WEALTH</span>
          </p>
          <p className="text-on-surface-variant text-[10px]">
            ≈ {formatIdr(totalPriceIdr)}
          </p>
          {!valid ? (
            <p className="text-error text-[10px]">
              {voucher.remainingStock <= 0 ? "Stok habis" : "Tidak aktif"}
            </p>
          ) : null}
        </div>
        <span className="text-primary text-xs font-semibold">Lihat →</span>
      </div>
    </Link>
  );
}
