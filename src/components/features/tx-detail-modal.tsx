"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransactionInfo } from "@/components/features/transaction-info";
import { TxStatusPill } from "@/components/features/tx-status-pill";
import type { HistoryEntry } from "@/lib/schemas/history-entry";
import { formatDateTime, formatWealth } from "@/lib/utils";

interface TxDetailModalProps {
  entry: HistoryEntry | null;
  onOpenChange: (open: boolean) => void;
}

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
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        {/* Custom close button — desktop only */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2 hidden md:flex"
            aria-label="Tutup"
          >
            <XIcon />
          </Button>
        </DialogClose>

        <DialogHeader className="border-border space-y-1 border-b px-5 py-4 pr-12 sm:px-6 sm:py-5">
          <DialogTitle className="font-display text-on-surface text-lg font-bold md:text-xl">
            {entry.kind === "redeem" ? "Redeem" : entry.kind}
            {entry.merchantName ? ` — ${entry.merchantName}` : ""}
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant text-sm">
            {formatDateTime(entry.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">Jumlah</span>
              <span className="font-semibold">
                {formatWealth(entry.amountWealth)} $WEALTH
              </span>
            </div>
            {entry.voucherTitle ? (
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Voucher</span>
                <span className="text-on-surface text-right">
                  {entry.voucherTitle}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">Status</span>
              <TxStatusPill status={entry.status} />
            </div>
          </div>

          {entry.txHash ? <TransactionInfo txHash={entry.txHash} /> : null}
        </div>

        {showQrButton ? (
          <div className="border-border border-t bg-white px-5 py-4 sm:px-6 sm:py-5">
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                router.push(`/qr/${entry.redemptionId}`);
              }}
              className="w-full rounded-full"
            >
              Lihat QR
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
