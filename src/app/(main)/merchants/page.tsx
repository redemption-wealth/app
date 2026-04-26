"use client";

import { useState } from "react";
import { MerchantCard } from "@/components/features/merchant-card";
import { useCategories } from "@/hooks/use-categories";
import { useMerchants } from "@/hooks/use-merchants";

export default function MerchantsPage() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const { data: categoryData } = useCategories();
  const {
    data: merchantData,
    isLoading,
    error,
    refetch,
  } = useMerchants(categoryId ? { categoryId, limit: 24 } : { limit: 24 });

  const categories = categoryData?.data ?? [];
  const merchants = merchantData?.merchants ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-7xl">
      <h1 className="font-display text-2xl font-bold text-[#171717]">
        Merchant
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
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

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-4"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-between rounded-[var(--radius-lg)] bg-[#fee2e2] p-4 text-sm text-[#b91c1c]">
          <span>Gagal memuat merchant.</span>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="font-semibold underline"
          >
            Coba lagi
          </button>
        </div>
      ) : merchants.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-8 text-center">
          <p className="text-sm text-[#525252]">
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
      className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-white"
          : "border border-[#ececec] bg-white text-[#525252] hover:border-[#dcdcdc] hover:bg-[#fafaf9]"
      }`}
    >
      {label}
    </button>
  );
}
