"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/features/balance-card";
import { TxHistoryCardList } from "@/components/features/tx-history-card-list";
import { TxHistoryTable } from "@/components/features/tx-history-table";
import { CopyableAddress } from "@/components/shared/copyable-address";
import { useAuth } from "@/hooks/use-auth";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function ProfileInteractive() {
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
      <div className="mx-auto max-w-md space-y-4 px-4 py-12 text-center md:px-8">
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
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-6">
        <h1 className="font-display text-on-surface text-2xl font-bold md:text-3xl">
          Profil
        </h1>

        <BalanceCard />

        <section className="border-border space-y-4 rounded-[var(--radius-lg)] border bg-white p-5 md:p-6">
          <h2 className="font-display text-on-surface text-lg font-bold">
            Riwayat Transaksi
          </h2>
          <div className="md:hidden">
            <TxHistoryCardList />
          </div>
          <div className="hidden md:block">
            <TxHistoryTable />
          </div>
        </section>

        <section className="border-border space-y-5 rounded-[var(--radius-lg)] border bg-white p-5 md:p-6">
          <div>
            <label className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">
              Email
            </label>
            <p className="text-on-surface mt-1 text-sm break-all">
              {email ?? "-"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">
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
          className="font-display border-border text-error hover:bg-error-container w-full rounded-full bg-white py-6 font-bold"
        >
          {loggingOut ? "Keluar..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
