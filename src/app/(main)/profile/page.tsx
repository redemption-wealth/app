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
      <h1 className="font-display text-2xl font-bold text-[#171717]">Profil</h1>

      <section className="space-y-5 rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6">
        <div>
          <label className="text-[10px] font-bold tracking-widest text-[#737373] uppercase">
            Email
          </label>
          <p className="mt-1 break-all text-[#171717]">{email ?? "-"}</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest text-[#737373] uppercase">
            Wallet Address
          </label>
          {walletAddress ? (
            <CopyableAddress value={walletAddress} truncate={false} />
          ) : (
            <p className="text-sm text-[#525252]">Dompet belum siap.</p>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          void handleLogout();
        }}
        disabled={loggingOut}
        className="font-display w-full rounded-full border border-[#ececec] bg-white py-4 font-bold text-[#b91c1c] transition-colors hover:bg-[#fee2e2] disabled:opacity-60"
      >
        {loggingOut ? "Keluar..." : "Logout"}
      </button>
    </div>
  );
}
