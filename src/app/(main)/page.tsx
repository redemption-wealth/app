"use client";

import { useAuth } from "@/hooks/use-auth";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { formatWealth } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const { walletAddress } = useAuth();
  const { balance } = useWealthBalance(walletAddress);

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
