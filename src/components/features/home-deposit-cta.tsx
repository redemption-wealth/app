"use client";

import { Button } from "@/components/ui/button";

interface HomeDepositCtaProps {
  onDeposit: () => void;
}

export function HomeDepositCta({ onDeposit }: HomeDepositCtaProps) {
  return (
    <section
      className="border-primary/15 relative overflow-hidden rounded-[var(--radius-lg)] border p-5 sm:p-6"
      style={{
        background:
          "linear-gradient(120deg, var(--color-surface-active) 0%, var(--color-surface-container-lowest) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-30"
        style={{ background: "var(--color-primary-container)" }}
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="bg-primary mt-1 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full"
            aria-hidden
          />
          <div className="space-y-1">
            <p className="font-display text-on-surface text-base font-bold">
              Saldo masih kosong
            </p>
            <p className="text-on-surface-variant text-sm">
              Deposit $WEALTH dulu, lalu pilih voucher favoritmu.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onDeposit}
          className="rounded-full sm:flex-shrink-0"
        >
          Deposit
        </Button>
      </div>
    </section>
  );
}
