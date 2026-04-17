"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { formatWealth } from "@/lib/utils";

const ONBOARDING_DISMISSED_KEY = "onboarding-deposit-dismissed";

export default function HomePage() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const { balance, rawBalance, isLoading: balanceLoading } =
    useWealthBalance(walletAddress);
  const { data: redemptions, isLoading: redemptionsLoading } = useRedemptions({
    limit: 1,
  });

  useEffect(() => {
    if (balanceLoading || redemptionsLoading) return;

    const dismissed =
      typeof window !== "undefined" &&
      window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
    if (dismissed) return;

    const hasBalance = typeof rawBalance === "bigint" && rawBalance > 0n;
    const hasHistory = (redemptions?.data?.length ?? 0) > 0;

    if (!hasBalance && !hasHistory) {
      router.replace("/onboarding/deposit");
    }
  }, [balanceLoading, redemptionsLoading, rawBalance, redemptions, router]);

  return (
    <div className="max-w-2xl mx-auto md:max-w-7xl space-y-8">
      {/* Hero Balance Card */}
      <section className="bg-gradient-to-br from-primary to-primary-container rounded-[var(--radius-xl)] p-8 text-on-primary">
        <p className="text-sm opacity-80">Saldo $WEALTH</p>
        <h2 className="font-display text-4xl font-bold mt-2">
          {formatWealth(balance)}
        </h2>
        <p className="text-sm opacity-80 mt-1">$WEALTH</p>
      </section>

      {/* Featured Vouchers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold">Voucher Populer</h3>
          <Link
            href="/merchants"
            className="text-sm text-primary font-semibold"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Voucher cards will be loaded from API */}
          <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-48 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-48 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-48 animate-pulse" />
        </div>
      </section>

      {/* Merchant Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold">Merchant</h3>
          <Link
            href="/merchants"
            className="text-sm text-primary font-semibold"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-4 h-32 animate-pulse"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
