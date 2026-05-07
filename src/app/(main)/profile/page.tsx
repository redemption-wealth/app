"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/features/balance-card";
import { CopyableAddress } from "@/components/shared/copyable-address";
import { useAuth } from "@/hooks/use-auth";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function ProfilePage() {
  const authStatus = useRequireAuth();
  const { email, walletAddress, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  if (authStatus === "timeout") {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p className="text-on-surface text-sm">
          Gagal memuat autentikasi. Coba refresh halaman.
        </p>
        <Button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full"
        >
          Reload
        </Button>
      </div>
    );
  }

  if (authStatus === "redirecting") return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-on-surface text-2xl font-bold">
        Profil
      </h1>

      <BalanceCard />

      <section className="border-border space-y-3 rounded-[var(--radius-lg)] border bg-white p-6">
        <h2 className="font-display text-on-surface text-lg font-bold">
          Riwayat Transaksi
        </h2>
        <p className="text-on-surface-variant text-sm">
          Memuat riwayat redemption…
        </p>
      </section>

      <section className="border-border space-y-5 rounded-[var(--radius-lg)] border bg-white p-6">
        <div>
          <label className="text-outline text-[10px] font-bold tracking-widest uppercase">
            Email
          </label>
          <p className="text-on-surface mt-1 break-all">{email ?? "-"}</p>
        </div>

        <div className="space-y-2">
          <label className="text-outline text-[10px] font-bold tracking-widest uppercase">
            Wallet Address
          </label>
          {walletAddress ? (
            <CopyableAddress value={walletAddress} truncate={false} />
          ) : (
            <p className="text-on-surface-variant text-sm">
              Dompet belum siap.
            </p>
          )}
        </div>
      </section>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void handleLogout();
        }}
        disabled={loggingOut}
        className="font-display border-border text-error hover:bg-error-container w-full rounded-full border bg-white py-6 font-bold"
      >
        {loggingOut ? "Keluar..." : "Logout"}
      </Button>
    </div>
  );
}
