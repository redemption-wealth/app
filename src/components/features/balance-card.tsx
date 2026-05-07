"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DepositModal } from "@/components/features/deposit-modal";
import { WithdrawModal } from "@/components/features/withdraw-modal";
import { useAuth } from "@/hooks/use-auth";
import { usePrice } from "@/hooks/use-price";
import { useWealthBalance } from "@/hooks/use-wealth-balance";
import { formatIdr, formatWealth } from "@/lib/utils";

export function BalanceCard() {
  const { walletAddress } = useAuth();
  const { balance } = useWealthBalance(walletAddress);
  const { data: priceData } = usePrice();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const balanceIdr = priceData ? Number(balance) * priceData.priceIdr : null;

  return (
    <>
      <section
        className="shadow-ambient relative overflow-hidden rounded-[var(--radius-lg)] p-6 text-white"
        style={{
          background:
            "linear-gradient(140deg, var(--color-on-primary-container) 0%, var(--color-primary) 60%, var(--color-primary-container) 130%)",
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
          <h2 className="font-display text-4xl font-bold tracking-tight">
            {formatWealth(balance)}
          </h2>
          <span className="text-base font-semibold opacity-80">$WEALTH</span>
        </div>
        {balanceIdr !== null ? (
          <p className="relative mt-1 text-xs opacity-80">
            ≈ {formatIdr(balanceIdr)}
          </p>
        ) : null}

        <div className="relative mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="text-primary rounded-full bg-white hover:bg-white/90"
            onClick={() => setDepositOpen(true)}
          >
            Deposit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => setWithdrawOpen(true)}
          >
            Withdraw
          </Button>
        </div>
      </section>

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  );
}
