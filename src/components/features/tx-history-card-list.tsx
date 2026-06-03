"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TxDetailModal } from "@/components/features/tx-detail-modal";
import { TxStatusPill } from "@/components/features/tx-status-pill";
import type { HistoryEntry } from "@/lib/schemas/history-entry";
import { useTxHistory } from "@/hooks/use-tx-history";
import { formatDateTime, formatWealth } from "@/lib/utils";
import type { RedemptionStatus } from "@/lib/schemas/redemption";

type StatusFilter = "all" | RedemptionStatus;

const FILTER_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Berhasil" },
  { value: "failed", label: "Gagal" },
];

export function TxHistoryCardList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  const { entries, isLoading, isFetching, hasNextPage, fetchNextPage } =
    useTxHistory({
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    });

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (e.txHash && e.txHash.toLowerCase().includes(q)) return true;
      if (e.merchantName && e.merchantName.toLowerCase().includes(q))
        return true;
      return false;
    });
  }, [entries, search]);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="scrollbar-hide flex flex-1 gap-2 overflow-x-auto">
            {FILTER_CHIPS.map((chip) => (
              <Button
                key={chip.value}
                type="button"
                size="sm"
                variant={statusFilter === chip.value ? "default" : "outline"}
                onClick={() => setStatusFilter(chip.value)}
                className="rounded-full"
              >
                {chip.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={searchOpen ? "Tutup pencarian" : "Cari"}
            onClick={() => {
              setSearchOpen((prev) => {
                if (prev) setSearch("");
                return !prev;
              });
            }}
          >
            {searchOpen ? <X aria-hidden /> : <Search aria-hidden />}
          </Button>
        </div>

        {searchOpen ? (
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari txHash atau merchant"
            autoFocus
          />
        ) : null}

        {isLoading ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Memuat…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Belum ada riwayat.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSelected(entry)}
                  className="border-border hover:border-surface-container-highest w-full rounded-[var(--radius-lg)] border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-on-surface truncate text-sm font-semibold">
                        Redeem
                        {entry.merchantName ? ` — ${entry.merchantName}` : ""}
                      </p>
                      <p className="text-on-surface-variant mt-0.5 text-xs">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <TxStatusPill status={entry.status} />
                  </div>
                  <p className="font-display text-on-surface mt-2 text-sm font-bold">
                    {formatWealth(entry.amountWealth)}{" "}
                    <span className="text-on-surface-variant text-[10px] font-medium">
                      $WEALTH
                    </span>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasNextPage ? (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={fetchNextPage}
              disabled={isFetching}
              className="rounded-full"
            >
              {isFetching ? "Memuat…" : "Muat lebih banyak"}
            </Button>
          </div>
        ) : null}
      </div>

      <TxDetailModal
        entry={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
