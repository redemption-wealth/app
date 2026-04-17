"use client";

import Link from "next/link";
import { use } from "react";
import { useChainId } from "wagmi";
import { SigningStateUI } from "@/components/features/signing-state-ui";
import { usePrice } from "@/hooks/use-price";
import { useRedeemVoucher } from "@/hooks/use-redeem-voucher";
import { useVoucher } from "@/hooks/use-voucher";
import { TARGET_CHAIN_ID } from "@/lib/wagmi";
import { formatDate, formatIdr, formatWealth, isVoucherValid } from "@/lib/utils";
import { selectIsSigning, useRedemptionFlow } from "@/stores/redemption-flow";

function subtractDecimalStrings(...values: string[]): string {
  const total = values.reduce((acc, v, i) => {
    const num = Number(v);
    return i === 0 ? num : acc - num;
  }, 0);
  return Number.isFinite(total) ? total.toFixed(2) : "0";
}

export default function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const chainId = useChainId();
  const { data, isLoading, error } = useVoucher(id);
  const { data: priceData } = usePrice();
  const { start } = useRedeemVoucher();
  const isSigning = useRedemptionFlow(selectIsSigning);

  const onWrongChain = chainId !== TARGET_CHAIN_ID;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 bg-surface-container rounded w-1/2 animate-pulse" />
        <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 space-y-4">
          <div className="h-48 bg-surface-container rounded-[var(--radius-md)] animate-pulse" />
          <div className="h-6 bg-surface-container rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-surface-container rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data?.voucher) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="font-display text-2xl font-bold">Voucher tidak ditemukan</h1>
        <p className="text-on-surface-variant">
          {error instanceof Error ? error.message : "Voucher ini tidak tersedia."}
        </p>
        <Link href="/merchants" className="text-sm font-semibold text-primary">
          ← Kembali ke merchant
        </Link>
      </div>
    );
  }

  const voucher = data.voucher;
  const merchant = voucher.merchant;
  const isBogo = voucher.qrPerSlot > 1;
  const isValid = isVoucherValid(voucher);
  const appFeeAmount = subtractDecimalStrings(
    voucher.totalPrice,
    voucher.basePrice,
    voucher.gasFeeAmount,
  );
  const totalPriceIdr = priceData
    ? Number(voucher.totalPrice) * priceData.priceIdr
    : null;

  const canRedeem = isValid && !onWrongChain && !isSigning;
  const redeemDisabledReason = !isValid
    ? voucher.remainingStock <= 0
      ? "Stok habis"
      : "Voucher tidak aktif"
    : onWrongChain
      ? "Pindah ke jaringan Base untuk melanjutkan"
      : isSigning
        ? "Memproses..."
        : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        {merchant ? (
          <Link
            href={`/merchants/${merchant.id}`}
            className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
          >
            ← {merchant.name}
          </Link>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl font-bold">{voucher.title}</h1>
          {isBogo ? (
            <span className="inline-flex items-center rounded-full bg-tertiary text-on-tertiary px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              BOGO {voucher.qrPerSlot}x
            </span>
          ) : null}
        </div>
        {voucher.description ? (
          <p className="text-sm text-on-surface-variant">{voucher.description}</p>
        ) : null}
      </div>

      <section className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-on-surface-variant">
            Harga
          </p>
          <p className="font-display text-3xl font-bold">
            {formatWealth(voucher.totalPrice)}{" "}
            <span className="text-base text-on-surface-variant">$WEALTH</span>
          </p>
          {totalPriceIdr !== null ? (
            <p className="text-sm text-on-surface-variant">
              ≈ {formatIdr(totalPriceIdr)}
            </p>
          ) : null}
        </div>

        <div className="border-t border-outline-variant pt-4 space-y-2 text-sm">
          <FeeRow label="Harga dasar" value={voucher.basePrice} />
          <FeeRow label="Biaya layanan" value={appFeeAmount} />
          <FeeRow label="Biaya jaringan" value={voucher.gasFeeAmount} />
          <div className="border-t border-outline-variant pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatWealth(voucher.totalPrice)} $WEALTH</span>
          </div>
        </div>

        {isBogo ? (
          <div className="bg-tertiary-container text-on-tertiary-container rounded-[var(--radius-md)] p-3 text-xs">
            Voucher BOGO: satu pembelian memberi{" "}
            <span className="font-semibold">{voucher.qrPerSlot} QR codes</span>{" "}
            yang bisa digunakan bergantian sampai habis.
          </div>
        ) : null}

        <div className="text-xs text-on-surface-variant space-y-1">
          <p>Berlaku hingga {formatDate(voucher.expiryDate)}</p>
          <p>Sisa stok: {voucher.remainingStock} / {voucher.totalStock}</p>
        </div>
      </section>

      {onWrongChain ? (
        <div className="bg-error-container text-on-error-container rounded-[var(--radius-md)] p-3 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <div>
            <p className="font-semibold">Jaringan tidak sesuai</p>
            <p className="text-xs opacity-90">
              Pindah ke Base Mainnet (chain ID {TARGET_CHAIN_ID}) di dompet Anda
              sebelum melakukan redemption.
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canRedeem}
        onClick={() => {
          void start(voucher.id);
        }}
        className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-display font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {redeemDisabledReason ?? "Redeem Voucher"}
      </button>

      <SigningStateUI />
    </div>
  );
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-on-surface-variant">
      <span>{label}</span>
      <span>{formatWealth(value)} $WEALTH</span>
    </div>
  );
}
