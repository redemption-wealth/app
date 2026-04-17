"use client";

import Link from "next/link";
import { WalletDepositPanel } from "@/components/features/wallet-deposit-panel";
import { useAuth } from "@/hooks/use-auth";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { formatWealth } from "@/lib/utils";

const ONBOARDING_DISMISSED_KEY = "onboarding-deposit-dismissed";

function dismissOnboarding() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
}

export default function OnboardingDepositPage() {
  const { walletAddress } = useAuth();
  const { balance } = useWealthBalance(walletAddress);

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <header className="space-y-2">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary">
          Langkah Awal
        </span>
        <h1 className="font-display text-3xl font-bold">
          Mari isi saldo $WEALTH Anda
        </h1>
        <p className="text-sm text-on-surface-variant">
          Kirim $WEALTH ke alamat embedded wallet di bawah dari bursa atau dompet
          lain. Saldo akan muncul otomatis setelah transaksi terkonfirmasi di
          jaringan Base.
        </p>
      </header>

      <section className="bg-gradient-to-br from-primary to-primary-container rounded-[var(--radius-xl)] p-6 text-on-primary space-y-1">
        <p className="text-xs opacity-80 uppercase tracking-wide">
          Saldo Saat Ini
        </p>
        <p className="font-display text-3xl font-bold">
          {formatWealth(balance)} <span className="text-base">$WEALTH</span>
        </p>
        <p className="text-xs opacity-80">
          Diperbarui otomatis setiap 30 detik.
        </p>
      </section>

      <WalletDepositPanel variant="inline" />

      <div className="flex items-center justify-between pt-4">
        <Link
          href="/"
          onClick={dismissOnboarding}
          className="text-sm font-semibold text-on-surface-variant hover:text-on-surface"
        >
          Lewati untuk sekarang
        </Link>
        <Link
          href="/merchants"
          onClick={dismissOnboarding}
          className="text-sm font-semibold text-primary"
        >
          Lihat merchant →
        </Link>
      </div>
    </div>
  );
}
