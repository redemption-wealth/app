"use client";

import { Button } from "@/components/ui/button";
import { VoucherCard } from "@/components/features/voucher-card";
import { VoucherListItem } from "@/components/features/voucher-list-item";
import type { Voucher } from "@/lib/schemas/voucher";

interface VoucherGridProps {
  vouchers: Voucher[];
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  onFetchNextPage: () => void;
  isFiltered: boolean;
  onResetFilters: () => void;
}

const SKELETON_COUNT = 6;

export function VoucherGrid({
  vouchers,
  isLoading,
  isFetching,
  hasNextPage,
  onFetchNextPage,
  isFiltered,
  onResetFilters,
}: VoucherGridProps) {
  if (isLoading) {
    return (
      <>
        <div className="flex flex-col gap-3 md:hidden">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-surface-container-low h-24 animate-pulse rounded-[var(--radius-lg)] border"
            />
          ))}
        </div>
        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-surface-container-low h-72 animate-pulse rounded-[var(--radius-lg)] border"
            />
          ))}
        </div>
      </>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="border-border space-y-3 rounded-[var(--radius-lg)] border bg-white p-10 text-center">
        <p className="font-display text-on-surface text-base font-bold">
          Tidak ada voucher cocok
        </p>
        <p className="text-on-surface-variant text-sm">
          {isFiltered
            ? "Coba longgarkan filter atau reset untuk melihat semua voucher."
            : "Belum ada voucher tersedia saat ini."}
        </p>
        {isFiltered ? (
          <Button
            type="button"
            variant="outline"
            onClick={onResetFilters}
            className="rounded-full"
          >
            Reset filter
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:hidden">
        {vouchers.map((voucher) => (
          <VoucherListItem key={voucher.id} voucher={voucher} />
        ))}
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {vouchers.map((voucher) => (
          <VoucherCard key={voucher.id} voucher={voucher} />
        ))}
      </div>

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onFetchNextPage}
            disabled={isFetching}
            className="rounded-full"
          >
            {isFetching ? "Memuat…" : "Muat lebih banyak"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
