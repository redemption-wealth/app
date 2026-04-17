"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { QrDisplay } from "@/components/features/qr-display";
import { RedemptionStatusBanner } from "@/components/features/redemption-status-banner";
import { TransactionInfo } from "@/components/features/transaction-info";
import { useReconcileRedemption } from "@/hooks/use-reconcile-redemption";
import { useRedemption } from "@/hooks/use-redemption";
import { formatDate, formatWealth } from "@/lib/utils";

function pickPollingInterval(
  status: string | undefined,
  elapsedMs: number,
): number | false {
  if (!status) return 3000;
  if (status !== "pending") return false;
  if (elapsedMs < 30_000) return 3000;
  if (elapsedMs < 300_000) return 10_000;
  return false;
}

export default function QrDisplayPage({
  params,
}: {
  params: Promise<{ redemptionId: string }>;
}) {
  const { redemptionId } = use(params);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, error } = useRedemption(redemptionId, {
    refetchInterval: (query) => {
      const status = query.state.data?.redemption?.status;
      const createdAt = query.state.data?.redemption?.createdAt;
      const elapsed = createdAt ? Date.now() - Date.parse(createdAt) : 0;
      return pickPollingInterval(status, elapsed);
    },
  });
  const { reconcile, isReconciling, isCoolingDown, fallbackMessage } =
    useReconcileRedemption();

  const redemption = data?.redemption;
  const voucher = redemption?.voucher;
  const qrCodes = useMemo(() => redemption?.qrCodes ?? [], [redemption]);
  const elapsedMs = redemption ? now - Date.parse(redemption.createdAt) : 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="bg-surface-container h-8 w-1/2 animate-pulse rounded" />
        <div className="bg-surface-container mx-auto h-64 w-64 animate-pulse rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (error || !redemption) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="font-display text-2xl font-bold">
          Redemption tidak ditemukan
        </h1>
        <p className="text-on-surface-variant text-sm">
          {error instanceof Error
            ? error.message
            : "Redemption ini tidak tersedia."}
        </p>
        <Link href="/history" className="text-primary text-sm font-semibold">
          ← Lihat riwayat
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="space-y-1">
        {voucher ? (
          <p className="text-on-surface-variant text-xs tracking-wide uppercase">
            {voucher.merchant?.name ?? "Voucher"}
          </p>
        ) : null}
        <h1 className="font-display text-xl font-bold">
          {voucher?.title ?? "Redemption"}
        </h1>
        <p className="text-on-surface-variant text-sm">
          Dibuat {formatDate(redemption.createdAt)} ·{" "}
          {formatWealth(redemption.wealthAmount)} $WEALTH
        </p>
      </div>

      <RedemptionStatusBanner
        status={redemption.status}
        elapsedMs={elapsedMs}
        txHash={redemption.txHash}
        onReconcile={() => reconcile(redemption.id)}
        isReconciling={isReconciling}
        reconcileCooldown={isCoolingDown}
      />

      {fallbackMessage ? (
        <p className="text-on-surface-variant text-center text-xs">
          {fallbackMessage}
        </p>
      ) : null}

      {redemption.status === "confirmed" ? (
        <QrDisplay qrCodes={qrCodes} />
      ) : null}

      <TransactionInfo txHash={redemption.txHash} />

      {redemption.status === "pending" ? (
        <p className="text-on-surface-variant text-center text-xs">
          Aman untuk menutup halaman. Kami akan memperbarui status otomatis.
        </p>
      ) : null}

      <div className="flex justify-between pt-2 text-sm">
        <Link href="/history" className="text-on-surface-variant font-semibold">
          ← Riwayat
        </Link>
        <Link href="/merchants" className="text-primary font-semibold">
          Lihat merchant lain →
        </Link>
      </div>
    </div>
  );
}
