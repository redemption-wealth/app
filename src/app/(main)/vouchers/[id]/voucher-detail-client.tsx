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
import type { Voucher } from "@/lib/schemas/voucher";
import { selectIsSigning, useRedemptionFlow } from "@/stores/redemption-flow";

const FALLBACK_TILE_COLORS = [
  "#8ee6c8",
  "#fdcfd9",
  "#a7f3d0",
  "#f9ffc4",
  "#c4b5fd",
  "#fde68a",
  "#bae6fd",
  "#fecaca",
];

function fallbackColor(name: string): string {
  const idx =
    name.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) %
    FALLBACK_TILE_COLORS.length;
  return FALLBACK_TILE_COLORS[idx]!;
}

function toWealthAmountWei(amount: number | null): bigint | null {
  if (amount === null || !Number.isFinite(amount)) return null;
  return parseUnits(amount.toFixed(18), 18);
}

interface CtaSpec {
  label: string;
  disabled: boolean;
  onClick: (() => void) | undefined;
}

export function VoucherDetailInteractive({ id }: { id: string }) {
  const chainId = useChainId();
  const { authenticated, login, walletAddress } = useAuth();
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

  if (isLoading) return <DetailSkeleton />;

  if (error || !data?.voucher) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 md:px-8">
        <h1 className="font-display text-2xl font-bold">
          Voucher tidak ditemukan
        </h1>
        <p className="text-on-surface-variant">
          {error instanceof Error
            ? error.message
            : "Voucher ini tidak tersedia."}
        </p>
        <Link href="/" className="text-primary text-sm font-semibold">
          ← Kembali ke marketplace
        </Link>
      </div>
    );
  }

  const voucher = data.voucher;
  const merchant = voucher.merchant;
  const isValid = isVoucherValid(voucher);
  const totalPriceIdr = Number(voucher.totalPrice);
  const wealthAmount =
    priceData && priceData.priceIdr > 0
      ? totalPriceIdr / priceData.priceIdr
      : null;
  const requiredAmountWei = toWealthAmountWei(wealthAmount);

  const redeemState: RedeemState = deriveRedeemState({
    authenticated,
    onWrongChain,
    rawBalance,
    requiredAmount: requiredAmountWei,
  });

  const cta = computeCta({
    isValid,
    isSigning,
    voucher,
    redeemState,
    targetChainName: targetChain.name,
    onLogin: () => login(),
    onDeposit: () => setDepositOpen(true),
    onRedeem: () => {
      void start(voucher.id);
    },
  });

  const showWrongChainBanner = redeemState === "wrong-chain";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-32 md:px-8 md:pt-8 md:pb-12">
      <div className="grid gap-6 md:grid-cols-12 md:gap-10">
        <HeroImage voucher={voucher} />

        <div className="md:col-span-8 md:space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MerchantAvatar voucher={voucher} className="md:hidden" />
              {merchant ? (
                <p className="text-on-surface-variant text-sm font-semibold">
                  {merchant.name}
                </p>
              ) : null}
            </div>
            <h1 className="font-display text-on-surface text-3xl leading-tight font-bold tracking-tight md:text-4xl">
              {voucher.title}
            </h1>
            {voucher.description ? (
              <p className="text-on-surface-variant text-sm leading-relaxed md:text-base">
                {voucher.description}
              </p>
            ) : null}
          </div>

          {showWrongChainBanner ? (
            <div className="bg-error-container text-on-error-container mt-6 flex items-start gap-2 rounded-[var(--radius-lg)] p-3 text-sm md:mt-0">
              <span aria-hidden>⚠️</span>
              <div>
                <p className="font-semibold">Jaringan tidak sesuai</p>
                <p className="text-xs opacity-90">
                  Pindah ke {targetChain.name} (chain ID {TARGET_CHAIN_ID}) di
                  dompet kamu sebelum melakukan redemption.
                </p>
              </div>
            </div>
          ) : null}

          <PriceCard
            wealthAmount={wealthAmount}
            totalPriceIdr={totalPriceIdr}
            voucher={voucher}
            cta={cta}
            inlineCtaOnMobile={false}
          />
        </div>
      </div>

      <StickyMobileCta cta={cta} />

      <SigningStateUI />
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </div>
  );
}

function HeroImage({ voucher }: { voucher: Voucher }) {
  const merchantName = voucher.merchant?.name ?? "Voucher";
  return (
    <div className="hidden md:col-span-4 md:block">
      <div className="md:sticky md:top-20">
        <div className="border-border relative aspect-square overflow-hidden rounded-[var(--radius-xl)] border bg-white">
          {voucher.merchant?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voucher.merchant.logoUrl}
              alt={merchantName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: fallbackColor(merchantName) }}
            >
              <span className="font-display text-tile-text text-9xl font-extrabold tracking-tight">
                {merchantName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MerchantAvatar({
  voucher,
  className,
}: {
  voucher: Voucher;
  className?: string;
}) {
  const merchantName = voucher.merchant?.name ?? "Voucher";
  return (
    <div
      className={`relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ${className ?? ""}`}
    >
      {voucher.merchant?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={voucher.merchant.logoUrl}
          alt={merchantName}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundColor: fallbackColor(merchantName) }}
        >
          <span className="font-display text-tile-text text-base font-extrabold">
            {merchantName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

interface PriceCardProps {
  wealthAmount: number | null;
  totalPriceIdr: number;
  voucher: Voucher;
  cta: CtaSpec;
  inlineCtaOnMobile: boolean;
}

function PriceCard({
  wealthAmount,
  totalPriceIdr,
  voucher,
  cta,
  inlineCtaOnMobile,
}: PriceCardProps) {
  return (
    <section className="border-border mt-6 space-y-4 rounded-[var(--radius-lg)] border bg-white p-5 md:mt-0 md:p-6">
      <div>
        <p className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">
          Harga
        </p>
        <p className="font-display text-primary mt-1 text-3xl leading-none font-extrabold tracking-tight tabular-nums md:text-4xl">
          {wealthAmount !== null ? formatWealth(wealthAmount) : "—"}
          <span className="text-on-surface-variant ml-2 align-baseline text-xs font-semibold md:text-sm">
            $WEALTH
          </span>
        </p>
        <p className="text-on-surface-variant mt-1 text-sm">
          ≈ {formatIdr(totalPriceIdr)}
        </p>
      </div>

      <div className="border-border text-on-surface-variant grid grid-cols-2 gap-3 border-t pt-4 text-xs md:text-sm">
        <div>
          <p className="text-[10px] font-semibold tracking-wider uppercase">
            Stok tersisa
          </p>
          <p className="text-on-surface mt-1 font-bold">
            {voucher.remainingStock} / {voucher.totalStock}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-wider uppercase">
            Berlaku hingga
          </p>
          <p className="text-on-surface mt-1 font-bold">
            {formatDate(voucher.expiryDate)}
          </p>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        disabled={cta.disabled}
        onClick={cta.onClick}
        className={
          inlineCtaOnMobile
            ? "font-display from-primary to-primary-container w-full rounded-full bg-gradient-to-r py-6 text-base font-bold text-white"
            : "font-display from-primary to-primary-container hidden w-full rounded-full bg-gradient-to-r py-6 text-base font-bold text-white md:flex"
        }
      >
        {cta.label}
      </Button>
    </section>
  );
}

function StickyMobileCta({ cta }: { cta: CtaSpec }) {
  return (
    <div className="border-border fixed inset-x-0 bottom-0 z-40 border-t bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Button
        type="button"
        size="lg"
        disabled={cta.disabled}
        onClick={cta.onClick}
        className="font-display from-primary to-primary-container w-full rounded-full bg-gradient-to-r py-6 text-base font-bold text-white"
      >
        {cta.label}
      </Button>
    </div>
  );
}

interface ComputeCtaArgs {
  isValid: boolean;
  isSigning: boolean;
  voucher: Voucher;
  redeemState: RedeemState;
  targetChainName: string;
  onLogin: () => void;
  onDeposit: () => void;
  onRedeem: () => void;
}

function computeCta({
  isValid,
  isSigning,
  voucher,
  redeemState,
  targetChainName,
  onLogin,
  onDeposit,
  onRedeem,
}: ComputeCtaArgs): CtaSpec {
  if (!isValid) {
    return {
      label: voucher.remainingStock <= 0 ? "Stok habis" : "Voucher tidak aktif",
      disabled: true,
      onClick: undefined,
    };
  }
  if (isSigning) {
    return { label: "Memproses…", disabled: true, onClick: undefined };
  }
  switch (redeemState) {
    case "unauth":
      return { label: "Login untuk Redeem", disabled: false, onClick: onLogin };
    case "wrong-chain":
      return {
        label: `Pindah ke ${targetChainName}`,
        disabled: true,
        onClick: undefined,
      };
    case "loading":
      return { label: "Memuat saldo…", disabled: true, onClick: undefined };
    case "insufficient":
      return {
        label: "Saldo Tidak Cukup, Deposit",
        disabled: false,
        onClick: onDeposit,
      };
    case "redeem":
      return { label: "Redeem Voucher", disabled: false, onClick: onRedeem };
  }
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-32 md:px-8 md:pt-8 md:pb-12">
      <div className="grid gap-6 md:grid-cols-12 md:gap-10">
        <div className="hidden md:col-span-4 md:block">
          <div className="bg-surface-container-low aspect-square animate-pulse rounded-[var(--radius-xl)]" />
        </div>
        <div className="space-y-4 md:col-span-8">
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-low h-10 w-10 animate-pulse rounded-full md:hidden" />
            <div className="bg-surface-container h-4 w-32 animate-pulse rounded" />
          </div>
          <div className="bg-surface-container h-9 w-3/4 animate-pulse rounded" />
          <div className="bg-surface-container-low h-20 animate-pulse rounded" />
          <div className="bg-surface-container-low h-44 animate-pulse rounded-[var(--radius-lg)]" />
        </div>
      </div>
    </div>
  );
}
