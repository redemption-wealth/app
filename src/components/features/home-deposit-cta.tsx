"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface HomeDepositCtaProps {
  onDeposit: () => void;
}

export function HomeDepositCta({ onDeposit }: HomeDepositCtaProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-display text-on-surface text-base font-bold">
            Deposit $WEALTH untuk mulai redeem
          </p>
          <p className="text-on-surface-variant text-sm">
            Saldo masih kosong. Top up dulu, lalu pilih voucher favoritmu.
          </p>
        </div>
        <Button
          type="button"
          onClick={onDeposit}
          className="rounded-full sm:flex-shrink-0"
        >
          Deposit
        </Button>
      </CardContent>
    </Card>
  );
}
