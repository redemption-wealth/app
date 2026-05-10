"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  WithdrawForm,
  type WithdrawFormSubmit,
} from "@/components/features/withdraw-form";
import { TransactionInfo } from "@/components/features/transaction-info";
import { useAuth } from "@/hooks/use-auth";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { useWithdraw } from "@/hooks/use-withdraw";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const { walletAddress } = useAuth();
  const { rawBalance, balance } = useWealthBalance(walletAddress);
  const { state, start, reset } = useWithdraw();
  const [pending, setPending] = useState<WithdrawFormSubmit | null>(null);

  const handleClose = (next: boolean) => {
    if (state.kind === "signing") return;
    if (!next) {
      reset();
      setPending(null);
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!pending) return;
    await start(pending);
    setPending(null);
  };

  const isSigning = state.kind === "signing";
  const isSuccess = state.kind === "success";
  const isError = state.kind === "error";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-border space-y-1 border-b px-5 py-4 pr-12 sm:px-6 sm:py-5">
          <DialogTitle className="font-display text-on-surface text-lg font-bold md:text-xl">
            Tarik $WEALTH
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant text-sm">
            Kirim $WEALTH ke alamat lain. Pastikan alamat benar — transaksi
            tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {isSuccess ? (
            <div className="space-y-4">
              <p className="text-on-surface text-sm">
                Transaksi berhasil dikirim. Catat hash di bawah sebelum menutup
                — ini bukti transaksi kamu.
              </p>
              <TransactionInfo txHash={state.txHash} />
              <Button
                type="button"
                onClick={() => handleClose(false)}
                className="w-full rounded-full"
              >
                Tutup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isError ? (
                <div className="bg-error-container text-on-error-container rounded-[var(--radius-md)] p-3 text-sm">
                  {state.message}
                </div>
              ) : null}
              <WithdrawForm
                rawBalance={rawBalance}
                formattedBalance={balance}
                isSubmitting={isSigning}
                onSubmit={(values) => setPending(values)}
              />
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(next) => {
          if (!next) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi penarikan</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan alamat tujuan benar. Transaksi blockchain tidak bisa
              di-revert setelah dikirim.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSigning}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleConfirm();
              }}
              disabled={isSigning}
            >
              {isSigning ? "Menandatangani…" : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
