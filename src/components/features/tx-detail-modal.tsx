"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransactionInfo } from "@/components/features/transaction-info";
import type { HistoryEntry } from "@/lib/schemas/history-entry";
import { formatDate, formatWealth } from "@/lib/utils";

interface TxDetailModalProps {
  entry: HistoryEntry | null;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABEL: Record<HistoryEntry["status"], string> = {
  pending: "Pending",
  confirmed: "Selesai",
  failed: "Gagal",
};

const STATUS_VARIANT: Record<
  HistoryEntry["status"],
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  confirmed: "default",
  failed: "destructive",
};

export function TxDetailModal({ entry, onOpenChange }: TxDetailModalProps) {
  const router = useRouter();

  if (!entry) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }

  const showQrButton =
    entry.kind === "redeem" &&
    entry.redemptionId !== undefined &&
    (entry.status === "pending" || entry.status === "confirmed");

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {entry.kind === "redeem" ? "Redeem" : entry.kind}
            {entry.merchantName ? ` — ${entry.merchantName}` : ""}
          </DialogTitle>
          <DialogDescription>{formatDate(entry.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Jumlah</span>
            <span className="font-semibold">
              {formatWealth(entry.amountWealth)} $WEALTH
            </span>
          </div>
          {entry.voucherTitle ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Voucher</span>
              <span className="text-on-surface">{entry.voucherTitle}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={STATUS_VARIANT[entry.status]}>
              {STATUS_LABEL[entry.status]}
            </Badge>
          </div>

          {entry.txHash ? <TransactionInfo txHash={entry.txHash} /> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {showQrButton ? (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                router.push(`/qr/${entry.redemptionId}`);
              }}
              className="rounded-full"
            >
              Lihat QR
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
