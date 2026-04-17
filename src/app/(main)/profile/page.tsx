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
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Profil</h1>

      <section className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 space-y-5">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Email
          </label>
          <p className="mt-1 text-on-surface break-all">{email ?? "-"}</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Wallet Address
          </label>
          {walletAddress ? (
            <CopyableAddress value={walletAddress} truncate={false} />
          ) : (
            <p className="text-sm text-on-surface-variant">
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
        className="w-full py-4 rounded-full bg-surface-container-highest text-secondary font-display font-bold disabled:opacity-60"
      >
        {loggingOut ? "Keluar..." : "Logout"}
      </button>
    </div>
  );
}
