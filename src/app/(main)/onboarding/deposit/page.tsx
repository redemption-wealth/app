"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { env } from "@/lib/env";
import { formatWealth } from "@/lib/utils";
import { CopyableAddress } from "@/components/shared/copyable-address";

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

      <ol className="space-y-6">
        <li className="space-y-3">
          <Step index={1} title="Alamat embedded wallet Anda" />
          {walletAddress ? (
            <CopyableAddress value={walletAddress} truncate={false} />
          ) : (
            <p className="text-sm text-on-surface-variant">
              Dompet belum siap. Silakan refresh halaman jika tidak muncul
              dalam beberapa detik.
            </p>
          )}
        </li>

        <li className="space-y-3">
          <Step index={2} title="Pastikan pakai jaringan Base" />
          <div className="bg-surface-container rounded-[var(--radius-md)] px-3 py-2 text-sm flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="font-semibold">Base Mainnet</span>
            <span className="text-on-surface-variant">· Chain ID 8453</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Transfer dari jaringan lain (mis. Ethereum Mainnet) tidak akan
            terdeteksi dan bisa menyebabkan dana hilang.
          </p>
        </li>

        <li className="space-y-3">
          <Step index={3} title="Kirim token $WEALTH ke alamat di atas" />
          <CopyableAddress
            label="Kontrak $WEALTH (Base)"
            value={env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS}
            truncate={false}
          />
          <p className="text-xs text-on-surface-variant">
            Saat menambah custom token di dompet sumber, gunakan alamat kontrak
            di atas agar token dikenali sebagai $WEALTH.
          </p>
        </li>
      </ol>

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

function Step({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-semibold">
        {index}
      </span>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
    </div>
  );
}
