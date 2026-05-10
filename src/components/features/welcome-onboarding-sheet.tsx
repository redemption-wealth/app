"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface WelcomeOnboardingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeposit: () => void;
}

export function WelcomeOnboardingSheet({
  open,
  onOpenChange,
  onDeposit,
}: WelcomeOnboardingSheetProps) {
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[var(--radius-xl)] sm:mx-auto sm:max-w-lg"
      >
        <div
          className="relative -mx-6 -mt-6 mb-2 overflow-hidden px-6 pt-8 pb-10 text-white"
          style={{
            background:
              "linear-gradient(140deg, var(--color-on-primary-container) 0%, var(--color-primary) 60%, var(--color-primary-container) 130%)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full opacity-15"
            style={{ background: "var(--color-primary-container)" }}
          />
          <p className="relative text-xs font-semibold tracking-wider uppercase opacity-80">
            Selamat datang 👋
          </p>
          <h2 className="font-display relative mt-2 text-2xl font-bold tracking-tight">
            Wallet kamu udah siap.
          </h2>
          <p className="relative mt-2 max-w-sm text-sm opacity-85">
            Deposit $WEALTH sekarang, lalu pilih voucher favoritmu — semua dalam
            satu tap.
          </p>
        </div>

        <SheetHeader className="sr-only">
          <SheetTitle>Selamat datang di Wealth Redemption</SheetTitle>
          <SheetDescription>
            Wallet kamu udah siap. Deposit $WEALTH dan mulai redeem voucher.
          </SheetDescription>
        </SheetHeader>

        <SheetFooter className="flex flex-col gap-2 sm:flex-col sm:gap-2">
          <Button
            type="button"
            className="w-full rounded-full py-6 text-base font-bold"
            onClick={() => {
              onDeposit();
              onOpenChange(false);
            }}
          >
            Deposit $WEALTH
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full py-6 text-base font-semibold"
            onClick={() => {
              onOpenChange(false);
              router.push("/merchants");
            }}
          >
            Jelajahi Voucher
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
