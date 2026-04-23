"use client";

import Link from "next/link";
import { use } from "react";
import { useChainId } from "wagmi";
import { SigningStateUI } from "@/components/features/signing-state-ui";
import { usePrice } from "@/hooks/use-price";
import { useRedeemVoucher } from "@/hooks/use-redeem-voucher";
import { useVoucher } from "@/hooks/use-voucher";
import { TARGET_CHAIN_ID } from "@/lib/wagmi";
import {
  formatDate,
  formatIdr,
  formatWealth,
  isVoucherValid,
} from "@/lib/utils";
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
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="bg-surface-container h-8 w-1/2 animate-pulse rounded" />
        <div className="bg-surface-container-lowest space-y-4 rounded-[var(--radius-lg)] p-6">
          <div className="bg-surface-container h-48 animate-pulse rounded-[var(--radius-md)]" />
          <div className="bg-surface-container h-6 w-3/4 animate-pulse rounded" />
          <div className="bg-surface-container h-4 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || !data?.voucher) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="font-display text-2xl font-bold">
          Voucher tidak ditemukan
        </h1>
        <p className="text-on-surface-variant">
          {error instanceof Error
            ? error.message
            : "Voucher ini tidak tersedia."}
        </p>
        <Link href="/merchants" className="text-primary text-sm font-semibold">
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
      ? "Pindah ke jaringan Ethereum untuk melanjutkan"
      : isSigning
        ? "Memproses..."
        : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        {merchant ? (
          <Link
            href={`/merchants/${merchant.id}`}
            className="text-on-surface-variant hover:text-on-surface text-xs font-semibold tracking-wider uppercase"
          >
            ← {merchant.name}
          </Link>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl font-bold">{voucher.title}</h1>
          {isBogo ? (
            <span className="bg-tertiary text-on-tertiary inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              BOGO {voucher.qrPerSlot}x
            </span>
          ) : null}
        </div>
        {voucher.description ? (
          <p className="text-on-surface-variant text-sm">
            {voucher.description}
          </p>
        ) : null}
      </div>

      <section className="bg-surface-container-lowest space-y-4 rounded-[var(--radius-lg)] p-6">
        <div>
          <p className="text-on-surface-variant text-xs tracking-wide uppercase">
            Harga
          </p>
          <p className="font-display text-3xl font-bold">
            {formatWealth(voucher.totalPrice)}{" "}
            <span className="text-on-surface-variant text-base">$WEALTH</span>
          </p>
          {totalPriceIdr !== null ? (
            <p className="text-on-surface-variant text-sm">
              ≈ {formatIdr(totalPriceIdr)}
            </p>
          ) : null}
        </div>

        <div className="border-outline-variant space-y-2 border-t pt-4 text-sm">
          <FeeRow label="Harga dasar" value={voucher.basePrice} />
          <FeeRow label="Biaya layanan" value={appFeeAmount} />
          <FeeRow label="Biaya jaringan" value={voucher.gasFeeAmount} />
          <div className="border-outline-variant flex justify-between border-t pt-2 font-semibold">
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

        <div className="text-on-surface-variant space-y-1 text-xs">
          <p>Berlaku hingga {formatDate(voucher.expiryDate)}</p>
          <p>
            Sisa stok: {voucher.remainingStock} / {voucher.totalStock}
          </p>
        </div>
      </section>

      {onWrongChain ? (
        <div className="bg-error-container text-on-error-container flex items-start gap-2 rounded-[var(--radius-md)] p-3 text-sm">
          <span>⚠️</span>
          <div>
            <p className="font-semibold">Jaringan tidak sesuai</p>
            <p className="text-xs opacity-90">
              Pindah ke Ethereum Mainnet (chain ID {TARGET_CHAIN_ID}) di dompet
              Anda sebelum melakukan redemption.
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
        className="from-primary to-primary-container text-on-primary font-display w-full rounded-full bg-gradient-to-r py-4 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {redeemDisabledReason ?? "Redeem Voucher"}
      </button>

      <SigningStateUI />
    </div>
  );
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-on-surface-variant flex justify-between">
      <span>{label}</span>
      <span>{formatWealth(value)} $WEALTH</span>
    </div>
  );
}
