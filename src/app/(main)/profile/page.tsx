"use client";

import { useAuth } from "@/hooks/use-auth";
import { truncateAddress } from "@/lib/utils";

export default function ProfilePage() {
  const { email, walletAddress, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Profil</h1>

      <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Email
          </label>
          <p className="mt-1 text-on-surface">{email ?? "-"}</p>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Wallet Address
          </label>
          <p className="mt-1 text-on-surface font-mono">
            {walletAddress ? truncateAddress(walletAddress) : "-"}
          </p>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-4 rounded-full bg-surface-container-highest text-secondary font-display font-bold"
      >
        Logout
      </button>
    </div>
  );
}
