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
      className="flex flex-col justify-between gap-3 rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-[#dcdcdc] hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <CategoryTile name={voucher.merchant?.name ?? "V"} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#525252]">
            {voucher.merchant?.name ?? "Voucher"}
          </p>
          <h4 className="font-display mt-0.5 line-clamp-2 text-sm font-bold text-[#171717]">
            {voucher.title}
          </h4>
          {isBogo ? (
            <span className="mt-1 inline-flex items-center rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-bold text-[#15803d]">
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
        <div className="flex items-center justify-between text-[10px] text-[#525252]">
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
          <p className="font-display text-base font-bold text-[#171717]">
            {wealthAmount !== null ? formatWealth(wealthAmount) : "—"}{" "}
            <span className="text-xs text-[#525252]">$WEALTH</span>
          </p>
          <p className="text-[10px] text-[#737373]">
            ≈ {formatIdr(totalPriceIdr)}
          </p>
        </div>
        {valid ? (
          <span className="bg-primary rounded-full px-3 py-1 text-[11px] font-bold text-white">
            Tukar
          </span>
        ) : (
          <span className="rounded-full bg-[#e5e5e5] px-3 py-1 text-[11px] font-bold text-[#a3a3a3]">
            Habis
          </span>
        )}
      </div>
    </Link>
  );
}
