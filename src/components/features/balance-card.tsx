"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePrice } from "@/hooks/use-price";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { formatIdr, formatWealth } from "@/lib/utils";

export function BalanceCard() {
  const { walletAddress } = useAuth();
  const { balance } = useWealthBalance(walletAddress);
  const { data: priceData } = usePrice();

  const balanceIdr = priceData ? Number(balance) * priceData.priceIdr : null;

  return (
    <section className="from-primary to-primary-container text-on-primary rounded-[var(--radius-xl)] bg-gradient-to-br p-8">
      <p className="text-sm opacity-80">Saldo $WEALTH</p>
      <h2 className="font-display mt-2 text-4xl font-bold">
        {formatWealth(balance)}
      </h2>
      <p className="mt-1 text-sm opacity-80">$WEALTH</p>
      {balanceIdr !== null ? (
        <p className="mt-2 text-xs opacity-80">≈ {formatIdr(balanceIdr)}</p>
      ) : null}
    </section>
  );
}
