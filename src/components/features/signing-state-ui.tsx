"use client";

import { Modal } from "@/components/shared/modal";
import {
  selectCanCancel,
  selectIsSigning,
  useRedemptionFlow,
  type SigningState,
} from "@/stores/redemption-flow";

interface StateCopy {
  title: string;
  subtitle: string;
}

const STATE_COPY: Record<Exclude<SigningState, "idle" | "done">, StateCopy> = {
  "price-quote": {
    title: "Mengambil harga $WEALTH",
    subtitle: "Mengunci nilai tukar IDR supaya biaya tidak bergeser.",
  },
  initiating: {
    title: "Menyiapkan redemption",
    subtitle: "Server menyiapkan detail transfer $WEALTH.",
  },
  "opening-wallet": {
    title: "Membuka dompet",
    subtitle: "Dompet embedded Anda sedang dihubungkan.",
  },
  "awaiting-signature": {
    title: "Konfirmasi di dompet",
    subtitle: "Setujui transfer $WEALTH di popup dompet.",
  },
  broadcasting: {
    title: "Menyiarkan transaksi",
    subtitle: "Transaksi sedang dikirim ke jaringan Ethereum.",
  },
  "submitting-hash": {
    title: "Menyimpan bukti transaksi",
    subtitle: "Server mencatat hash transaksi Anda.",
  },
  "polling-confirmation": {
    title: "Menunggu konfirmasi",
    subtitle: "Mengarahkan ke halaman QR...",
  },
  "wallet-recovering": {
    title: "Memulihkan dompet",
    subtitle: "Dompet sempat tidak aktif — mencoba menyambungkan ulang.",
  },
  error: {
    title: "Terjadi kesalahan",
    subtitle: "Silakan coba lagi.",
  },
};

export function SigningStateUI() {
  const state = useRedemptionFlow((s) => s.state);
  const error = useRedemptionFlow((s) => s.error);
  const reset = useRedemptionFlow((s) => s.reset);
  const isSigning = useRedemptionFlow(selectIsSigning);
  const canCancel = useRedemptionFlow(selectCanCancel);

  if (!isSigning) return null;

  const copy = STATE_COPY[state as Exclude<SigningState, "idle" | "done">];
  if (!copy) return null;

  return (
    <Modal open ariaLabel="Status redemption">
      <div
        aria-live="polite"
        role="status"
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="border-primary h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold">{copy.title}</h2>
          <p className="text-on-surface-variant text-sm">{copy.subtitle}</p>
          {error ? <p className="text-error mt-2 text-xs">{error}</p> : null}
        </div>

        {canCancel ? (
          <button
            type="button"
            onClick={reset}
            className="text-on-surface-variant hover:text-on-surface text-sm font-semibold"
          >
            Batal
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
