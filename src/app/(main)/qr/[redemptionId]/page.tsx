"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { QrDisplay } from "@/components/features/qr-display";
import { RedeemTicket } from "@/components/features/redeem-ticket";
import { RedemptionStatusBanner } from "@/components/features/redemption-status-banner";
import { TransactionInfo } from "@/components/features/transaction-info";
import { VoucherCard } from "@/components/features/voucher-card";
import { useReconcileRedemption } from "@/hooks/use-reconcile-redemption";
import { useRedemption } from "@/hooks/use-redemption";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useVouchers } from "@/hooks/use-vouchers";
import {
  formatDate,
  formatDateTime,
  formatWealth,
  isVoucherExpired,
} from "@/lib/utils";
import { useRedemptionFlow } from "@/stores/redemption-flow";

const RELATED_LIMIT = 4;

// Drive polling off what we're actually waiting for, in two phases:
//  1. QR not generated yet → poll fast (each fetch also lazy-heals on the
//     backend, so the QR self-heals without a manual refresh).
//  2. QR in hand but not yet redeemed at the counter → keep a calm poll so the
//     screen flips to "Sudah Dipakai" on its own the moment the merchant scans.
// Stop once every QR is used, or the redemption terminally failed.
function pickPollingInterval(
  redemption:
    | {
        status?: string | undefined;
        qrCodes?: { status?: string }[] | undefined;
      }
    | undefined,
  elapsedMs: number,
): number | false {
  if (!redemption) return 3000;
  if (redemption.status === "failed" || redemption.status === "expired")
    return false;

  const qrCodes = redemption.qrCodes ?? [];
  const qrReady = qrCodes.length > 0;
  if (!qrReady) {
    // Phase 1: waiting for confirmation + QR generation.
    if (elapsedMs < 30_000) return 3000;
    if (elapsedMs < 180_000) return 8_000;
    return 20_000;
  }

  // Phase 2: QR is ready — watch until it's scanned/used.
  const allUsed = qrCodes.every(
    (q) => q.status === "used" || q.status === "fully_used",
  );
  if (allUsed) return false;
  return 15_000;
}

export default function QrDisplayPage({
  params,
}: {
  params: Promise<{ redemptionId: string }>;
}) {
  const { redemptionId } = use(params);
  const authStatus = useRequireAuth();
  const [now, setNow] = useState(() => Date.now());

  // Reset redemption flow store — user has landed on QR page, flow is complete
  useEffect(() => {
    useRedemptionFlow.getState().reset();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, error, refetch, isFetching } = useRedemption(
    redemptionId,
    {
      refetchInterval: (query) => {
        const redemption = query.state.data?.redemption;
        const createdAt = redemption?.createdAt;
        const elapsed = createdAt ? Date.now() - Date.parse(createdAt) : 0;
        return pickPollingInterval(redemption, elapsed);
      },
    },
  );
  const { reconcile, isReconciling, isCoolingDown, fallbackMessage } =
    useReconcileRedemption();

  const redemption = data?.redemption;
  const voucher = redemption?.voucher;
  const merchantId = voucher?.merchantId;
  const currentVoucherId = voucher?.id;
  const qrCodes = useMemo(() => redemption?.qrCodes ?? [], [redemption]);
  const elapsedMs = redemption ? now - Date.parse(redemption.createdAt) : 0;

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (authStatus === "timeout") {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-12 text-center md:px-8">
        <p className="text-on-surface text-sm">
          Gagal memuat autentikasi. Coba refresh halaman.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-primary inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          Reload
        </button>
      </div>
    );
  }

  if (authStatus === "redirecting") return null;

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-5">
          <div className="bg-surface-container h-8 w-1/2 animate-pulse rounded" />
          <div className="bg-surface-container-low h-64 animate-pulse rounded-[var(--radius-lg)]" />
        </div>
      </div>
    );
  }

  if (error || !redemption) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-12 text-center md:px-8">
        <h1 className="font-display text-2xl font-bold">
          Redemption tidak ditemukan
        </h1>
        <p className="text-on-surface-variant text-sm">
          {error instanceof Error
            ? error.message
            : "Redemption ini tidak tersedia."}
        </p>
        <Link href="/profile" className="text-primary text-sm font-semibold">
          ← Lihat profil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-6">
        {/* Page header — the confirmed state shows the branded RedeemTicket
            (which carries its own title/merchant/validity), so we hide this to
            avoid duplication. */}
        {redemption.status !== "confirmed" ? (
          <div className="space-y-1">
            {voucher ? (
              <p className="text-on-surface-variant text-[11px] font-semibold tracking-wider uppercase">
                {voucher.merchant?.name ?? "Voucher"}
              </p>
            ) : null}
            <h1 className="font-display text-on-surface text-2xl font-bold md:text-3xl">
              {voucher?.title ?? "Redemption"}
            </h1>
            <p className="text-on-surface-variant text-sm">
              Dibuat {formatDateTime(redemption.createdAt)} ·{" "}
              {formatWealth(redemption.wealthAmount)} $WEALTH
            </p>
            {voucher?.expiryDate ? (
              <p
                className={`text-sm ${
                  isVoucherExpired(voucher.expiryDate)
                    ? "text-error font-semibold"
                    : "text-on-surface-variant"
                }`}
              >
                {isVoucherExpired(voucher.expiryDate)
                  ? `Kedaluwarsa ${formatDate(voucher.expiryDate)}`
                  : `Berlaku sampai ${formatDate(voucher.expiryDate)}`}
              </p>
            ) : null}
          </div>
        ) : null}

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
          qrCodes.length > 0 ? (
            <div className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0">
              {qrCodes.map((qr, i) => (
                <RedeemTicket
                  key={qr.id}
                  voucher={voucher}
                  qr={qr}
                  index={i}
                  total={qrCodes.length}
                  onReload={() => refetch()}
                  isReloading={isFetching}
                />
              ))}
            </div>
          ) : (
            <QrDisplay
              qrCodes={[]}
              onReload={() => refetch()}
              isReloading={isFetching}
            />
          )
        ) : null}

        <TransactionInfo txHash={redemption.txHash} />

        {redemption.status === "pending" ? (
          <p className="text-on-surface-variant text-center text-xs">
            Aman untuk menutup halaman. Kami akan memperbarui status otomatis.
          </p>
        ) : null}

        <RelatedVouchersSection
          merchantId={merchantId}
          excludeVoucherId={currentVoucherId}
        />
      </div>
    </div>
  );
}

interface RelatedVouchersSectionProps {
  merchantId: string | undefined;
  excludeVoucherId: string | undefined;
}

function RelatedVouchersSection({
  merchantId,
  excludeVoucherId,
}: RelatedVouchersSectionProps) {
  // First try vouchers from the same merchant. If empty (or merchant unknown),
  // fall back to a generic shortlist so the section is never blank.
  const sameMerchant = useVouchers(
    merchantId ? { merchantId, limit: RELATED_LIMIT + 1 } : { limit: 1 },
  );
  const fallback = useVouchers({ limit: RELATED_LIMIT + 1 });

  const fromMerchant = (sameMerchant.data?.vouchers ?? []).filter(
    (v) => v.id !== excludeVoucherId,
  );
  const fromFallback = (fallback.data?.vouchers ?? []).filter(
    (v) => v.id !== excludeVoucherId,
  );

  const list = (fromMerchant.length > 0 ? fromMerchant : fromFallback).slice(
    0,
    RELATED_LIMIT,
  );

  const sectionTitle = "Voucher lain";

  if (list.length === 0) return null;

  return (
    <section className="space-y-4 pt-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-on-surface text-lg font-bold">
          {sectionTitle}
        </h2>
        <Link
          href="/"
          className="text-primary text-sm font-semibold whitespace-nowrap"
        >
          Lihat semua →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {list.map((v) => (
          <VoucherCard key={v.id} voucher={v} />
        ))}
      </div>
    </section>
  );
}
