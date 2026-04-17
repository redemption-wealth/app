"use client";

import Link from "next/link";
import { useState } from "react";
import { RedemptionCard } from "@/components/features/redemption-card";
import { useRedemptions } from "@/hooks/use-redemptions";
import type { RedemptionStatus } from "@/lib/schemas/redemption";

type FilterValue = RedemptionStatus | "all";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "failed", label: "Failed" },
];

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useRedemptions(
    filter === "all" ? { limit: 20 } : { status: filter, limit: 20 },
  );

  const redemptions = data?.redemptions ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Riwayat Redemption</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface-variant hover:bg-tertiary-container hover:text-on-tertiary-container"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-4 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container rounded-[var(--radius-md)] p-4 text-sm flex items-center justify-between">
          <span>Gagal memuat riwayat.</span>
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
      ) : redemptions.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-8 text-center space-y-3">
          <p className="text-sm text-on-surface-variant">
            {filter === "all"
              ? "Belum ada riwayat redemption."
              : "Tidak ada riwayat untuk filter ini."}
          </p>
          {filter === "all" ? (
            <Link
              href="/merchants"
              className="inline-flex items-center rounded-full bg-primary text-on-primary px-4 py-2 text-sm font-semibold"
            >
              Jelajahi merchant
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {redemptions.map((r) => (
            <RedemptionCard key={r.id} redemption={r} />
          ))}
        </div>
      )}
    </div>
  );
}
