"use client";

import Link from "next/link";
import { usePrice } from "@/hooks/use-price";
import type { Voucher } from "@/lib/schemas/voucher";
import { formatWealth, isVoucherValid } from "@/lib/utils";

const TOP_ITEM_MIN_STOCK = 50;
const TOP_ITEM_MAX_REMAINING = 10;

const FALLBACK_TILE_COLORS = [
  "#8ee6c8",
  "#fdcfd9",
  "#a7f3d0",
  "#f9ffc4",
  "#c4b5fd",
  "#fde68a",
  "#bae6fd",
  "#fecaca",
];

function fallbackColor(name: string): string {
  const idx =
    name.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) %
    FALLBACK_TILE_COLORS.length;
  return FALLBACK_TILE_COLORS[idx]!;
}

export function isTopItem(voucher: Voucher): boolean {
  return (
    voucher.totalStock >= TOP_ITEM_MIN_STOCK &&
    voucher.remainingStock > 0 &&
    voucher.remainingStock <= TOP_ITEM_MAX_REMAINING
  );
}

interface VoucherCardProps {
  voucher: Voucher;
}

export function VoucherCard({ voucher }: VoucherCardProps) {
  const { data: priceData } = usePrice();
  const totalPriceIdr = Number(voucher.totalPrice);
  const wealthAmount =
    priceData && priceData.priceIdr > 0
      ? totalPriceIdr / priceData.priceIdr
      : null;
  const merchantName = voucher.merchant?.name ?? "Voucher";
  const valid = isVoucherValid(voucher);
  const showTopItem = valid && isTopItem(voucher);

  return (
    <Link
      href={`/vouchers/${voucher.id}`}
      aria-label={`${voucher.title} dari ${merchantName}`}
      className="group/voucher-card border-border hover:border-primary/30 flex flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-16px_rgba(0,108,72,0.35)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {showTopItem ? (
          <span className="bg-tertiary-container text-on-tertiary-container absolute top-3 left-3 z-10 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm">
            Top item
          </span>
        ) : null}
        {voucher.merchant?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voucher.merchant.logoUrl}
            alt={merchantName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover/voucher-card:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center transition-transform duration-300 group-hover/voucher-card:scale-105"
            style={{ backgroundColor: fallbackColor(merchantName) }}
          >
            <span className="font-display text-tile-text text-6xl font-extrabold tracking-tight">
              {merchantName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-on-surface-variant truncate text-xs font-semibold">
          {merchantName}
        </p>
        <h4 className="font-display text-on-surface line-clamp-2 min-h-[2.6em] text-sm leading-snug font-bold">
          {voucher.title}
        </h4>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="font-display text-primary text-xl leading-none font-extrabold tracking-tight tabular-nums">
            {wealthAmount !== null ? formatWealth(wealthAmount) : "—"}
            <span className="text-on-surface-variant ml-1.5 align-baseline text-[10px] font-semibold">
              $WEALTH
            </span>
          </p>
          {!valid ? (
            <span className="bg-surface-container-high text-outline-variant rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase">
              Habis
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
