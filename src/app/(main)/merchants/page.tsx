"use client";

import { useState } from "react";
import { MerchantCard } from "@/components/features/merchant-card";
import { VoucherCard } from "@/components/features/voucher-card";
import { useCategories } from "@/hooks/use-categories";
import { useMerchants } from "@/hooks/use-merchants";
import { useVouchers } from "@/hooks/use-vouchers";

export default function MerchantsPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const { data: categoryData } = useCategories();
  const {
    data: merchantData,
    isLoading: merchantsLoading,
    error: merchantsError,
    refetch: refetchMerchants,
  } = useMerchants(categoryId ? { categoryId, limit: 24 } : { limit: 24 });
  const { data: voucherData, isLoading: vouchersLoading } = useVouchers({
    limit: 100,
  });

  const categories = categoryData?.data ?? [];
  const merchants = merchantData?.merchants ?? [];
  const allVouchers = voucherData?.vouchers ?? [];

  // Filter vouchers by displayed merchants when a category is selected
  const merchantIds = new Set(merchants.map((m) => m.id));
  const vouchers = categoryId
    ? allVouchers.filter((v) => merchantIds.has(v.merchantId))
    : allVouchers;

  const summaryParts: string[] = [];
  if (!merchantsLoading) summaryParts.push(`${merchants.length} merchant`);
  if (!vouchersLoading)
    summaryParts.push(`${vouchers.length} voucher tersedia`);

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-7xl">
      <div>
        <h1 className="font-display text-on-surface text-2xl font-bold">
          Merchant
        </h1>
        {summaryParts.length > 0 ? (
          <p className="text-on-surface-variant mt-1 text-sm">
            {summaryParts.join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
        <CategoryChip
          label="Semua"
          active={categoryId === undefined}
          onClick={() => setCategoryId(undefined)}
        />
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.name}
            active={categoryId === cat.id}
            onClick={() => setCategoryId(cat.id)}
          />
        ))}
      </div>

      {/* Merchant Section */}
      <section>
        <h3 className="font-display text-on-surface mb-4 text-lg font-bold">
          Pilih Merchant
        </h3>
        {merchantsLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border-border h-40 animate-pulse rounded-[var(--radius-lg)] border bg-white p-4"
              />
            ))}
          </div>
        ) : merchantsError ? (
          <div className="bg-error-container text-error flex items-center justify-between rounded-[var(--radius-lg)] p-4 text-sm">
            <span>Gagal memuat merchant.</span>
            <button
              type="button"
              onClick={() => {
                void refetchMerchants();
              }}
              className="font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        ) : merchants.length === 0 ? (
          <div className="border-border rounded-[var(--radius-lg)] border bg-white p-8 text-center">
            <p className="text-on-surface-variant text-sm">
              Belum ada merchant pada kategori ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {merchants.map((m) => (
              <MerchantCard key={m.id} merchant={m} />
            ))}
          </div>
        )}
      </section>

      {/* Voucher Section */}
      <section>
        <h3 className="font-display text-on-surface mb-4 text-lg font-bold">
          Voucher Tersedia
        </h3>
        {vouchersLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border-border h-40 animate-pulse rounded-[var(--radius-lg)] border bg-white p-6"
              />
            ))}
          </div>
        ) : vouchers.length === 0 ? (
          <div className="border-border rounded-[var(--radius-lg)] border bg-white p-8 text-center">
            <p className="text-on-surface-variant text-sm">
              Belum ada voucher tersedia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {vouchers.map((v) => (
              <VoucherCard key={v.id} voucher={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap capitalize transition-colors ${
        active
          ? "bg-primary text-white"
          : "border-border text-on-surface-variant hover:border-surface-container-highest hover:bg-surface border bg-white"
      }`}
    >
      {label}
    </button>
  );
}
