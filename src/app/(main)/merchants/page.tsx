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
  } = useMerchants({ categoryId, limit: 24 });

  const categories = categoryData?.data ?? [];
  const merchants = merchantData?.merchants ?? [];

  return (
    <div className="max-w-2xl mx-auto md:max-w-7xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Merchant</h1>

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-4 h-40 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container rounded-[var(--radius-md)] p-4 text-sm flex items-center justify-between">
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
        <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-8 text-center">
          <p className="text-sm text-on-surface-variant">
            Belum ada merchant pada kategori ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "bg-surface-container-lowest text-on-surface-variant hover:bg-tertiary-container hover:text-on-tertiary-container"
      }`}
    >
      {label}
    </button>
  );
}
