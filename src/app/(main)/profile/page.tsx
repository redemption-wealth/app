"use client";

import { useState } from "react";
import { CopyableAddress } from "@/components/shared/copyable-address";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { email, walletAddress, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

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
      <h1 className="font-display text-2xl font-bold">Profil</h1>

      <section className="bg-surface-container-lowest space-y-5 rounded-[var(--radius-lg)] p-6">
        <div>
          <label className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">
            Email
          </label>
          <p className="text-on-surface mt-1 break-all">{email ?? "-"}</p>
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

      <button
        type="button"
        onClick={() => {
          void handleLogout();
        }}
        disabled={loggingOut}
        className="bg-surface-container-highest text-secondary font-display w-full rounded-full py-4 font-bold disabled:opacity-60"
      >
        {loggingOut ? "Keluar..." : "Logout"}
      </button>
    </div>
  );
}
