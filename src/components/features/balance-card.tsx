"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePrice } from "@/hooks/use-price";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { formatIdr, formatWealth } from "@/lib/utils";

interface BalanceCardProps {
  variant?: "full" | "compact";
}

export function BalanceCard({ variant = "full" }: BalanceCardProps) {
  const { walletAddress } = useAuth();
  const { balance } = useWealthBalance(walletAddress);
  const { data: priceData } = usePrice();

  const balanceIdr = priceData ? Number(balance) * priceData.priceIdr : null;
  const isCompact = variant === "compact";

  return (
    <section
      className="shadow-ambient relative overflow-hidden rounded-[var(--radius-lg)] text-white"
      style={{
        background:
          "linear-gradient(140deg, var(--color-on-primary-container) 0%, var(--color-primary) 60%, var(--color-primary-container) 130%)",
        padding: isCompact ? "18px" : "24px",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-10"
        style={{ background: "var(--color-primary-container)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
        style={{ background: "var(--color-primary-container)" }}
      />

      <p className="relative text-xs font-semibold tracking-wider uppercase opacity-80">
        Saldo $WEALTH
      </p>
      <div className="relative mt-2 flex items-baseline gap-2">
        <h2
          className="font-display font-bold tracking-tight"
          style={{
            fontSize: isCompact ? "28px" : "40px",
            letterSpacing: "-0.02em",
          }}
        >
          {formatWealth(balance)}
        </h2>
        <span className="text-base font-semibold opacity-80">$WEALTH</span>
      </div>
      {balanceIdr !== null ? (
        <p className="relative mt-1 text-xs opacity-80">
          ≈ {formatIdr(balanceIdr)}
        </p>
      ) : null}
    </section>
  );
}
