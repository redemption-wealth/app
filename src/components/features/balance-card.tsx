"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePrice } from "@/hooks/use-price";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { formatIdr, formatWealth } from "@/lib/utils";

export function BalanceCard() {
  const { walletAddress } = useAuth();
  const { balance } = useWealthBalance(walletAddress);
  const { data: priceData } = usePrice();

  const balanceIdr = priceData
    ? Number(balance) * priceData.priceIdr
    : null;

  return (
    <section className="bg-gradient-to-br from-primary to-primary-container rounded-[var(--radius-xl)] p-8 text-on-primary">
      <p className="text-sm opacity-80">Saldo $WEALTH</p>
      <h2 className="font-display text-4xl font-bold mt-2">
        {formatWealth(balance)}
      </h2>
      <p className="text-sm opacity-80 mt-1">$WEALTH</p>
      {balanceIdr !== null ? (
        <p className="text-xs opacity-80 mt-2">≈ {formatIdr(balanceIdr)}</p>
      ) : null}
    </section>
  );
}
