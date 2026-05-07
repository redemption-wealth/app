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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Deposit $WEALTH</DialogTitle>
          <DialogDescription>
            Kirim $WEALTH ke embedded wallet kamu untuk mulai redeem voucher.
          </DialogDescription>
        </DialogHeader>
        <WalletDepositPanel variant="inline" />
      </DialogContent>
    </Dialog>
  );
}
