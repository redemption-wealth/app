"use client";

import Link from "next/link";
import { use } from "react";
import { useChainId } from "wagmi";
import { SigningStateUI } from "@/components/features/signing-state-ui";
import { usePrice } from "@/hooks/use-price";
import { useRedeemVoucher } from "@/hooks/use-redeem-voucher";
import { useVoucher } from "@/hooks/use-voucher";
import { TARGET_CHAIN_ID, targetChain } from "@/lib/wagmi";
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
        <div className="h-8 w-1/2 animate-pulse rounded bg-[#ececec]" />
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6">
          <div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[#f5f5f4]" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-[#ececec]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[#ececec]" />
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
        <p className="text-[#525252]">
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
  const totalPriceIdr = Number(voucher.totalPrice);
  const basePriceIdr = Number(voucher.basePrice);
  const gasFeeIdr = Number(voucher.gasFeeAmount);
  const appFeeIdr = Number(
    subtractDecimalStrings(
      voucher.totalPrice,
      voucher.basePrice,
      voucher.gasFeeAmount,
    ),
  );
  const wealthAmount =
    priceData && priceData.priceIdr > 0
      ? totalPriceIdr / priceData.priceIdr
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
            className="text-xs font-semibold tracking-wider text-[#525252] uppercase hover:text-[#171717]"
          >
            ← {merchant.name}
          </Link>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-[#171717]">
            {voucher.title}
          </h1>
          {isBogo ? (
            <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold tracking-wide text-[#15803d] uppercase">
              BOGO {voucher.qrPerSlot}x
            </span>
          ) : null}
        </div>
        {voucher.description ? (
          <p className="text-sm text-[#525252]">{voucher.description}</p>
        ) : null}
      </div>

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6">
        <div>
          <p className="text-xs tracking-wide text-[#737373] uppercase">
            Harga
          </p>
          <p className="font-display text-3xl font-bold text-[#171717]">
            {wealthAmount !== null ? formatWealth(wealthAmount) : "—"}{" "}
            <span className="text-base text-[#525252]">$WEALTH</span>
          </p>
          <p className="text-sm text-[#525252]">≈ {formatIdr(totalPriceIdr)}</p>
        </div>

        <div className="space-y-2 border-t border-[#ececec] pt-4 text-sm">
          <FeeRow label="Harga dasar" valueIdr={basePriceIdr} />
          <FeeRow label="Biaya layanan" valueIdr={appFeeIdr} />
          <FeeRow label="Biaya jaringan" valueIdr={gasFeeIdr} />
          <div className="flex justify-between border-t border-[#ececec] pt-2 font-semibold text-[#171717]">
            <span>Total</span>
            <span>{formatIdr(totalPriceIdr)}</span>
          </div>
        </div>

        {isBogo ? (
          <div className="rounded-[var(--radius-md)] bg-[#dcfce7] p-3 text-xs text-[#15803d]">
            Voucher BOGO: satu pembelian memberi{" "}
            <span className="font-semibold">{voucher.qrPerSlot} QR codes</span>{" "}
            yang bisa digunakan bergantian sampai habis.
          </div>
        ) : null}

        <div className="space-y-1 text-xs text-[#737373]">
          <p>Berlaku hingga {formatDate(voucher.expiryDate)}</p>
          <p>
            Sisa stok: {voucher.remainingStock} / {voucher.totalStock}
          </p>
        </div>
      </section>

      {onWrongChain ? (
        <div className="flex items-start gap-2 rounded-[var(--radius-lg)] bg-[#fee2e2] p-3 text-sm text-[#b91c1c]">
          <span>⚠️</span>
          <div>
            <p className="font-semibold">Jaringan tidak sesuai</p>
            <p className="text-xs opacity-90">
              Pindah ke {targetChain.name} (chain ID {TARGET_CHAIN_ID}) di
              dompet Anda sebelum melakukan redemption.
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
        className="font-display w-full rounded-full bg-gradient-to-r from-[#006c48] to-[#2de19d] py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {redeemDisabledReason ?? "Redeem Voucher"}
      </button>

      <SigningStateUI />
    </div>
  );
}

function FeeRow({ label, valueIdr }: { label: string; valueIdr: number }) {
  return (
    <div className="flex justify-between text-[#525252]">
      <span>{label}</span>
      <span>{formatIdr(valueIdr)}</span>
    </div>
  );
}
