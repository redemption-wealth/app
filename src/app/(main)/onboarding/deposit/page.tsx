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
    <div className="mx-auto max-w-xl space-y-8">
      <header className="space-y-2">
        <span className="text-primary inline-block text-xs font-semibold tracking-wider uppercase">
          Langkah Awal
        </span>
        <h1 className="font-display text-3xl font-bold text-[#171717]">
          Mari isi saldo $WEALTH Anda
        </h1>
        <p className="text-sm text-[#525252]">
          Kirim $WEALTH ke alamat embedded wallet di bawah dari bursa atau
          dompet lain. Saldo akan muncul otomatis setelah transaksi
          terkonfirmasi di jaringan Ethereum.
        </p>
      </header>

      <section className="space-y-1 rounded-[var(--radius-xl)] bg-gradient-to-br from-[#003a26] to-[#006c48] p-6 text-white">
        <p className="text-xs tracking-wide uppercase opacity-80">
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
          className="text-sm font-semibold text-[#525252] hover:text-[#171717]"
        >
          Lewati untuk sekarang
        </Link>
        <Link
          href="/merchants"
          onClick={dismissOnboarding}
          className="text-primary text-sm font-semibold"
        >
          Lihat merchant →
        </Link>
      </div>
    </div>
  );
}
