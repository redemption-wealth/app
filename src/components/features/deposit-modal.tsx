"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WalletDepositPanel } from "@/components/features/wallet-deposit-panel";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-border space-y-1 border-b px-5 py-4 pr-12 sm:px-6 sm:py-5">
          <DialogTitle className="font-display text-on-surface text-lg font-bold md:text-xl">
            Deposit $WEALTH
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant text-sm">
            Kirim $WEALTH ke embedded wallet kamu untuk mulai redeem voucher.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <WalletDepositPanel variant="inline" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
