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
  const {
    data: voucherList,
    isLoading: vouchersLoading,
    error: vouchersError,
    refetch,
  } = useVouchers({ limit: 6 });

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
    <div className="mx-auto max-w-2xl space-y-8 md:max-w-7xl">
      <BalanceCard />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-[#171717]">
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
            <div className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6" />
            <div className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6" />
            <div className="h-40 animate-pulse rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6" />
          </div>
        ) : vouchersError ? (
          <div className="flex items-center justify-between rounded-[var(--radius-lg)] bg-[#fee2e2] p-4 text-sm text-[#b91c1c]">
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
          <div className="space-y-3 rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-8 text-center">
            <p className="text-sm text-[#525252]">
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
    </div>
  );
}
