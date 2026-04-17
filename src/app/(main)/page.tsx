"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BalanceCard } from "@/components/features/balance-card";
import { VoucherCard } from "@/components/features/voucher-card";
import { useAuth } from "@/hooks/use-auth";
import { useRedemptions } from "@/hooks/use-redemptions";
import { useVouchers } from "@/hooks/use-vouchers";
import { useWealthBalance } from "@/hooks/use-wealth-balance";

const ONBOARDING_DISMISSED_KEY = "onboarding-deposit-dismissed";

export default function HomePage() {
  const router = useRouter();
  const { walletAddress } = useAuth();
  const { rawBalance, isLoading: balanceLoading } =
    useWealthBalance(walletAddress);
  const { data: redemptions, isLoading: redemptionsLoading } = useRedemptions({
    limit: 1,
  });
  const { data: voucherList, isLoading: vouchersLoading, error: vouchersError, refetch } =
    useVouchers({ limit: 6 });

  useEffect(() => {
    if (balanceLoading || redemptionsLoading) return;

    const dismissed =
      typeof window !== "undefined" &&
      window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
    if (dismissed) return;

    const hasBalance = typeof rawBalance === "bigint" && rawBalance > BigInt(0);
    const hasHistory = (redemptions?.redemptions?.length ?? 0) > 0;

    if (!hasBalance && !hasHistory) {
      router.replace("/onboarding/deposit");
    }
  }, [balanceLoading, redemptionsLoading, rawBalance, redemptions, router]);

  const vouchers = voucherList?.vouchers ?? [];

  return (
    <div className="max-w-2xl mx-auto md:max-w-7xl space-y-8">
      <BalanceCard />

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

        {vouchersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-40 animate-pulse" />
            <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-40 animate-pulse" />
            <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-40 animate-pulse" />
          </div>
        ) : vouchersError ? (
          <div className="bg-error-container text-on-error-container rounded-[var(--radius-md)] p-4 text-sm flex items-center justify-between">
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
          <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-8 text-center space-y-3">
            <p className="text-sm text-on-surface-variant">
              Belum ada voucher tersedia.
            </p>
            <Link
              href="/merchants"
              className="inline-flex items-center rounded-full bg-primary text-on-primary px-4 py-2 text-sm font-semibold"
            >
              Jelajahi merchant
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vouchers.map((v) => (
              <VoucherCard key={v.id} voucher={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
