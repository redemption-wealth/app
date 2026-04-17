"use client";

import { useAuth } from "@/hooks/use-auth";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { formatWealth, truncateAddress } from "@/lib/utils";

export default function WalletPage() {
  const { walletAddress } = useAuth();
  const { balance } = useWealthBalance(walletAddress);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary to-primary-container rounded-[var(--radius-xl)] p-8 text-on-primary">
        <p className="text-sm opacity-80">Saldo $WEALTH</p>
        <h2 className="font-display text-4xl font-bold mt-2">
          {formatWealth(balance)}
        </h2>
        {walletAddress && (
          <p className="text-sm opacity-80 mt-4 font-mono">
            {truncateAddress(walletAddress)}
          </p>
        )}
      </div>

      {/* Transaction History */}
      <section>
        <h3 className="font-display text-lg font-bold mb-4">Transaksi Terakhir</h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-[var(--radius-md)] p-4 h-16 animate-pulse"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
