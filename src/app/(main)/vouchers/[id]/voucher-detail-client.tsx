"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useChainId } from "wagmi";
import { parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { DepositModal } from "@/components/features/deposit-modal";
import { SigningStateUI } from "@/components/features/signing-state-ui";
import { useAuth } from "@/hooks/use-auth";
import { usePrice } from "@/hooks/use-price";
import { useRedeemVoucher } from "@/hooks/use-redeem-voucher";
import { useVoucher } from "@/hooks/use-voucher";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { TARGET_CHAIN_ID, targetChain } from "@/lib/wagmi";
import {
  deriveRedeemState,
  type RedeemState,
} from "@/lib/voucher-redeem-state";
import {
  formatDate,
  formatIdr,
  formatWealth,
  isVoucherValid,
} from "@/lib/utils";
import { selectIsSigning, useRedemptionFlow } from "@/stores/redemption-flow";
import { useUserSync } from "@/stores/user-sync";

function subtractDecimalStrings(...values: string[]): string {
  const total = values.reduce((acc, v, i) => {
    const num = Number(v);
    return i === 0 ? num : acc - num;
  }, 0);
  return Number.isFinite(total) ? total.toFixed(2) : "0";
}

function toWealthAmountWei(amount: number | null): bigint | null {
  if (amount === null || !Number.isFinite(amount)) return null;
  // Round to 18-decimal precision to avoid floating point drift.
  return parseUnits(amount.toFixed(18), 18);
}

export function VoucherDetailInteractive({ id }: { id: string }) {
  const chainId = useChainId();
  const { authenticated, login, walletAddress } = useAuth();
  const userSynced = useUserSync((s) => s.isSynced);
  const { data, isLoading, error } = useVoucher(id);
  const { data: priceData } = usePrice();
  const { rawBalance } = useWealthBalance(walletAddress);
  const { start } = useRedeemVoucher();
  const isSigning = useRedemptionFlow(selectIsSigning);
  const [depositOpen, setDepositOpen] = useState(false);

  // Reset stale redemption flow when navigating to a different voucher
  useEffect(() => {
    const store = useRedemptionFlow.getState();
    if (store.state !== "idle" && store.voucherId !== id) {
      store.reset();
    }
  }, [id]);

  const onWrongChain = chainId !== TARGET_CHAIN_ID;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="bg-surface-container h-8 w-1/2 animate-pulse rounded" />
        <div className="border-border space-y-4 rounded-[var(--radius-lg)] border bg-white p-6">
          <div className="bg-surface-container-low h-48 animate-pulse rounded-[var(--radius-md)]" />
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
  const requiredAmountWei = toWealthAmountWei(wealthAmount);

  const redeemState: RedeemState = deriveRedeemState({
    authenticated,
    userSynced,
    onWrongChain,
    rawBalance,
    requiredAmount: requiredAmountWei,
  });

  const cta = (() => {
    if (!isValid) {
      return {
        label:
          voucher.remainingStock <= 0 ? "Stok habis" : "Voucher tidak aktif",
        disabled: true,
        onClick: undefined,
      } as const;
    }
    if (isSigning) {
      return {
        label: "Memproses…",
        disabled: true,
        onClick: undefined,
      } as const;
    }
    switch (redeemState) {
      case "unauth":
        return {
          label: "Login untuk Redeem",
          disabled: false,
          onClick: () => login(),
        } as const;
      case "wrong-chain":
        return {
          label: `Pindah ke ${targetChain.name}`,
          disabled: true,
          onClick: undefined,
        } as const;
      case "loading":
        return {
          label: "Memuat saldo…",
          disabled: true,
          onClick: undefined,
        } as const;
      case "insufficient":
        return {
          label: "Saldo Tidak Cukup, Deposit",
          disabled: false,
          onClick: () => setDepositOpen(true),
        } as const;
      case "redeem":
        return {
          label: "Redeem Voucher",
          disabled: false,
          onClick: () => {
            void start(voucher.id);
          },
        } as const;
    }
  })();

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
          <h1 className="font-display text-on-surface text-2xl font-bold">
            {voucher.title}
          </h1>
          {isBogo ? (
            <span className="bg-success-container text-on-success-container inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
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

      <section className="border-border space-y-4 rounded-[var(--radius-lg)] border bg-white p-6">
        <div>
          <p className="text-outline text-xs tracking-wide uppercase">Harga</p>
          <p className="font-display text-on-surface text-3xl font-bold">
            {wealthAmount !== null ? formatWealth(wealthAmount) : "—"}{" "}
            <span className="text-on-surface-variant text-base">$WEALTH</span>
          </p>
          <p className="text-on-surface-variant text-sm">
            ≈ {formatIdr(totalPriceIdr)}
          </p>
        </div>

        <div className="border-border space-y-2 border-t pt-4 text-sm">
          <FeeRow label="Harga dasar" valueIdr={basePriceIdr} />
          <FeeRow label="Biaya layanan" valueIdr={appFeeIdr} />
          <FeeRow label="Biaya jaringan" valueIdr={gasFeeIdr} />
          <div className="border-border text-on-surface flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>{formatIdr(totalPriceIdr)}</span>
          </div>
        </div>

        {isBogo ? (
          <div className="bg-success-container text-on-success-container rounded-[var(--radius-md)] p-3 text-xs">
            Voucher BOGO: satu pembelian memberi{" "}
            <span className="font-semibold">{voucher.qrPerSlot} QR codes</span>{" "}
            yang bisa digunakan bergantian sampai habis.
          </div>
        ) : null}

        <div className="text-outline space-y-1 text-xs">
          <p>Berlaku hingga {formatDate(voucher.expiryDate)}</p>
          <p>
            Sisa stok: {voucher.remainingStock} / {voucher.totalStock}
          </p>
        </div>
      </section>

      {redeemState === "wrong-chain" ? (
        <div className="bg-error-container text-error flex items-start gap-2 rounded-[var(--radius-lg)] p-3 text-sm">
          <span>⚠️</span>
          <div>
            <p className="font-semibold">Jaringan tidak sesuai</p>
            <p className="text-xs opacity-90">
              Pindah ke {targetChain.name} (chain ID {TARGET_CHAIN_ID}) di
              dompet kamu sebelum melakukan redemption.
            </p>
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        size="lg"
        disabled={cta.disabled}
        onClick={cta.onClick}
        className="font-display from-primary to-primary-container w-full rounded-full bg-gradient-to-r py-6 text-lg font-bold text-white"
      >
        {cta.label}
      </Button>

      <SigningStateUI />
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </div>
  );
}

function FeeRow({ label, valueIdr }: { label: string; valueIdr: number }) {
  return (
    <div className="text-on-surface-variant flex justify-between">
      <span>{label}</span>
      <span>{formatIdr(valueIdr)}</span>
    </div>
  );
}
