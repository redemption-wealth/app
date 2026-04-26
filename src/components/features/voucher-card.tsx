"use client";

import Link from "next/link";
import { usePrice } from "@/hooks/use-price";
import type { Voucher } from "@/lib/schemas/voucher";
import { formatIdr, formatWealth, isVoucherValid } from "@/lib/utils";
import { CategoryTile } from "@/components/shared/category-tile";
import { StockProgressBar } from "@/components/shared/stock-progress-bar";

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

  const stockPct =
    voucher.totalStock > 0
      ? (voucher.remainingStock / voucher.totalStock) * 100
      : 0;
  const isLowStock = stockPct <= 20 && stockPct > 0;

  return (
    <Link
      href={`/vouchers/${voucher.id}`}
      className="border-border hover:border-surface-container-highest flex flex-col justify-between gap-3 rounded-[var(--radius-lg)] border bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {voucher.merchant?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voucher.merchant.logoUrl}
            alt={voucher.merchant.name}
            className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] object-cover"
          />
        ) : (
          <CategoryTile name={voucher.merchant?.name ?? "V"} size={48} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-on-surface-variant text-xs">
            {voucher.merchant?.name ?? "Voucher"}
          </p>
          <h4 className="font-display text-on-surface mt-0.5 line-clamp-2 text-sm font-bold">
            {voucher.title}
          </h4>
          {isBogo ? (
            <span className="bg-success-container text-on-success-container mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold">
              BOGO
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <StockProgressBar
          remaining={voucher.remainingStock}
          total={voucher.totalStock}
        />
        <div className="text-on-surface-variant flex items-center justify-between text-[10px]">
          <span>
            {isLowStock
              ? "Terbatas"
              : voucher.remainingStock <= 0
                ? "Stok habis"
                : `Tersisa ${voucher.remainingStock}`}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-on-surface text-base font-bold">
            {wealthAmount !== null ? formatWealth(wealthAmount) : "—"}{" "}
            <span className="text-on-surface-variant text-xs">$WEALTH</span>
          </p>
          <p className="text-outline text-[10px]">
            ≈ {formatIdr(totalPriceIdr)}
          </p>
        </div>
        {valid ? (
          <span className="bg-primary rounded-full px-3 py-1 text-[11px] font-bold text-white">
            Tukar
          </span>
        ) : (
          <span className="bg-surface-container-high text-outline-variant rounded-full px-3 py-1 text-[11px] font-bold">
            Habis
          </span>
        )}
      </div>
    </Link>
  );
}
