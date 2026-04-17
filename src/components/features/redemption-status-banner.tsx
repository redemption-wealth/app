"use client";

import type { RedemptionStatus } from "@/lib/schemas/redemption";

interface RedemptionStatusBannerProps {
  status: RedemptionStatus;
  elapsedMs: number;
  txHash: string | null;
  onReconcile?: () => void;
  isReconciling?: boolean;
  reconcileCooldown?: boolean;
}

interface BannerConfig {
  tone: "info" | "warning" | "error" | "success";
  title: string;
  subtitle?: string;
  action?: "reconcile" | "contact-support";
}

function pickConfig(
  status: RedemptionStatus,
  elapsedMs: number,
  txHash: string | null,
): BannerConfig {
  if (status === "confirmed") {
    return { tone: "success", title: "Redemption berhasil!" };
  }
  if (status === "failed") {
    return {
      tone: "error",
      title: "Redemption gagal",
      subtitle:
        "Jika $WEALTH sudah terkirim, hubungi support untuk proses refund.",
      action: "contact-support",
    };
  }

  const elapsedSec = elapsedMs / 1000;

  if (elapsedSec > 900) {
    return {
      tone: "error",
      title: "Transaksi belum terkonfirmasi >15 menit",
      subtitle: "Hubungi support dan sertakan hash transaksi di bawah.",
      action: "contact-support",
    };
  }

  if (elapsedSec > 300) {
    return {
      tone: "warning",
      title: "Sedikit lebih lama dari biasanya",
      subtitle: "Coba refresh status untuk memeriksa ulang di blockchain.",
      action: "reconcile",
    };
  }

  if (txHash && elapsedSec > 60) {
    return {
      tone: "info",
      title: "Menunggu konfirmasi blockchain",
      subtitle:
        "Biasanya memakan 30-60 detik. Aman untuk meninggalkan halaman.",
    };
  }

  return {
    tone: "info",
    title: txHash ? "Menunggu konfirmasi blockchain" : "Menyiapkan redemption",
    subtitle: txHash
      ? "Transaksi sedang dikonfirmasi di jaringan Base."
      : "Mohon tunggu sebentar...",
  };
}

const TONE_CLASSES: Record<BannerConfig["tone"], string> = {
  info: "bg-surface-container text-on-surface",
  warning: "bg-tertiary-container text-on-tertiary-container",
  error: "bg-error-container text-on-error-container",
  success: "bg-primary-container text-on-primary-container",
};

export function RedemptionStatusBanner({
  status,
  elapsedMs,
  txHash,
  onReconcile,
  isReconciling,
  reconcileCooldown,
}: RedemptionStatusBannerProps) {
  const config = pickConfig(status, elapsedMs, txHash);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${TONE_CLASSES[config.tone]} space-y-2 rounded-[var(--radius-md)] p-4`}
    >
      <p className="font-semibold">{config.title}</p>
      {config.subtitle ? (
        <p className="text-sm opacity-90">{config.subtitle}</p>
      ) : null}

      {config.action === "reconcile" && onReconcile ? (
        <button
          type="button"
          onClick={onReconcile}
          disabled={isReconciling || reconcileCooldown}
          className="bg-primary text-on-primary mt-1 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isReconciling
            ? "Memeriksa..."
            : reconcileCooldown
              ? "Tunggu sebentar..."
              : "Refresh status"}
        </button>
      ) : null}

      {config.action === "contact-support" ? (
        <a
          href="mailto:support@wealthcrypto.fund"
          className="mt-1 inline-flex items-center text-sm font-semibold underline"
        >
          Hubungi support
        </a>
      ) : null}
    </div>
  );
}
