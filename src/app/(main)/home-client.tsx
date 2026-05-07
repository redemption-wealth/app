"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DepositModal } from "@/components/features/deposit-modal";
import { HomeDepositCta } from "@/components/features/home-deposit-cta";
import { VoucherCard } from "@/components/features/voucher-card";
import { WelcomeOnboardingSheet } from "@/components/features/welcome-onboarding-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useVouchers } from "@/hooks/use-vouchers";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { shouldShowWelcomeSheet, welcomeFlagKey } from "@/lib/welcome-trigger";

export function HomeInteractive() {
  const { authenticated, ready, email, user, walletAddress } = useAuth();
  const displayName = authenticated && email ? email.split("@")[0] : null;
  const userId = user?.id ?? null;

  const balance = useWealthBalance(walletAddress);
  const redemptions = useRedemptions({
    limit: 1,
    enabled: authenticated,
  });
  const {
    data: voucherList,
    isLoading: vouchersLoading,
    error: vouchersError,
    refetch,
  } = useVouchers({ limit: 6 });

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [welcomeFlagPresent, setWelcomeFlagPresent] = useState(true);

  useEffect(() => {
    if (!authenticated || !userId || typeof window === "undefined") {
      setWelcomeFlagPresent(true);
      return;
    }
    const stored =
      window.localStorage.getItem(welcomeFlagKey(userId)) === "true";
    setWelcomeFlagPresent(stored);
  }, [authenticated, userId]);

  const triggerWelcome = shouldShowWelcomeSheet({
    ready,
    authenticated,
    balanceIsSuccess: balance.isSuccess,
    rawBalance: balance.rawBalance,
    redemptionsIsSuccess: redemptions.isSuccess,
    redemptionTotal: redemptions.data?.pagination.total,
    flagSet: welcomeFlagPresent,
  });

  useEffect(() => {
    if (triggerWelcome) setWelcomeOpen(true);
  }, [triggerWelcome]);

  const handleWelcomeClose = (next: boolean) => {
    setWelcomeOpen(next);
    if (!next && userId && typeof window !== "undefined") {
      window.localStorage.setItem(welcomeFlagKey(userId), "true");
      setWelcomeFlagPresent(true);
    }
  };

  const showHomeDepositCta =
    authenticated &&
    welcomeFlagPresent &&
    balance.isSuccess &&
    balance.rawBalance !== undefined &&
    balance.rawBalance === 0n;

  const vouchers = voucherList?.vouchers ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-7xl">
      <div>
        {displayName ? (
          <p className="text-on-surface-variant text-sm font-medium">
            Halo, {displayName} 👋
          </p>
        ) : null}
        <h2 className="font-display text-on-surface mt-1 text-xl font-bold">
          Mau tukar apa hari ini?
        </h2>
      </div>

      {showHomeDepositCta ? (
        <HomeDepositCta onDeposit={() => setDepositOpen(true)} />
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-on-surface text-xl font-bold">
            Voucher Populer
          </h3>
          <Link
            href="/merchants"
            className="text-primary text-sm font-semibold"
          >
            Lihat Semua
          </Link>
        </div>

        {vouchersLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border-border h-40 animate-pulse rounded-[var(--radius-lg)] border bg-white p-6" />
            <div className="border-border h-40 animate-pulse rounded-[var(--radius-lg)] border bg-white p-6" />
            <div className="border-border h-40 animate-pulse rounded-[var(--radius-lg)] border bg-white p-6" />
          </div>
        ) : vouchersError ? (
          <div className="bg-error-container text-error flex items-center justify-between rounded-[var(--radius-lg)] p-4 text-sm">
            <span>Gagal memuat voucher.</span>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="border-border space-y-3 rounded-[var(--radius-lg)] border bg-white p-8 text-center">
            <p className="text-on-surface-variant text-sm">
              Belum ada voucher tersedia.
            </p>
            <Link
              href="/merchants"
              className="bg-primary inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white"
            >
              Jelajahi merchant
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {vouchers.map((v) => (
              <VoucherCard key={v.id} voucher={v} />
            ))}
          </div>
        )}
      </section>

      <WelcomeOnboardingSheet
        open={welcomeOpen}
        onOpenChange={handleWelcomeClose}
        onDeposit={() => setDepositOpen(true)}
      />
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </div>
  );
}
