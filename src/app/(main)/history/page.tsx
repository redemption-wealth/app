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
  const { data, isLoading, error, refetch } = useRedemptions(
    filter === "all" ? { limit: 20 } : { status: filter, limit: 20 },
  );

  const redemptions = data?.redemptions ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-on-surface text-2xl font-bold">
        Riwayat Redemption
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-primary text-white"
                : "border-border text-on-surface-variant hover:border-surface-container-highest hover:bg-surface border bg-white"
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
              className="border-border h-24 animate-pulse rounded-[var(--radius-lg)] border bg-white p-4"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-error-container text-error flex items-center justify-between rounded-[var(--radius-lg)] p-4 text-sm">
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
        <div className="border-border space-y-3 rounded-[var(--radius-lg)] border bg-white p-8 text-center">
          <p className="text-on-surface-variant text-sm">
            {filter === "all"
              ? "Belum ada riwayat redemption."
              : "Tidak ada riwayat untuk filter ini."}
          </p>
          {filter === "all" ? (
            <Link
              href="/merchants"
              className="bg-primary inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white"
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
