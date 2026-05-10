"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import { useState } from "react";
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
        className="shadow-ambient relative overflow-hidden rounded-[var(--radius-lg)] p-6 text-white sm:p-8"
        style={{
          background:
            "linear-gradient(140deg, var(--color-on-primary-container) 0%, var(--color-primary) 60%, var(--color-primary-container) 130%)",
        }}
      >
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
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {formatWealth(balance)}
          </h2>
          <span className="text-base font-semibold opacity-80 sm:text-lg">
            $WEALTH
          </span>
        </div>
        {balanceIdr !== null ? (
          <p className="relative mt-1.5 text-sm opacity-80">
            ≈ {formatIdr(balanceIdr)}
          </p>
        ) : null}

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:max-w-md">
          <GlassButton
            label="Deposit"
            icon={<Plus className="h-4 w-4" aria-hidden />}
            onClick={() => setDepositOpen(true)}
          />
          <GlassButton
            label="Withdraw"
            icon={<ArrowUpRight className="h-4 w-4" aria-hidden />}
            onClick={() => setWithdrawOpen(true)}
          />
        </div>
      </section>

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  );
}

interface GlassButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function GlassButton({ label, icon, onClick }: GlassButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/glass text-on-primary-container relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-bold tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.78) 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.06), 0 4px 14px -4px rgba(0,0,0,0.18)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
      <span className="relative inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}
