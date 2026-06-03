"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TxDetailModal } from "@/components/features/tx-detail-modal";
import { TxStatusPill } from "@/components/features/tx-status-pill";
import type { HistoryEntry } from "@/lib/schemas/history-entry";
import { useTxHistory } from "@/hooks/use-tx-history";
import { formatDateTime, formatWealth, truncateAddress } from "@/lib/utils";
import type { RedemptionStatus } from "@/lib/schemas/redemption";

type StatusFilter = "all" | RedemptionStatus;

export function TxHistoryTable() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Selesai</SelectItem>
              <SelectItem value="failed">Gagal</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari txHash atau merchant"
            className="max-w-xs"
          />
        </div>

        {hasNextPage && search.trim() ? (
          <p className="text-muted-foreground text-xs">
            Memuat lebih banyak mungkin mengungkap hasil lainnya.
          </p>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipe</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tx Hash</TableHead>
              <TableHead>Merchant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  Memuat…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  Belum ada riwayat.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(entry)}
                >
                  <TableCell className="font-medium">Redeem</TableCell>
                  <TableCell>{formatWealth(entry.amountWealth)}</TableCell>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>
                    <TxStatusPill status={entry.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entry.txHash ? truncateAddress(entry.txHash) : "—"}
                  </TableCell>
                  <TableCell>{entry.merchantName ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {hasNextPage ? (
          <div className="flex justify-center">
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
