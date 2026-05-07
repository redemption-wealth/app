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
      <SheetContent side="bottom" className="rounded-t-[var(--radius-xl)]">
        <SheetHeader>
          <SheetTitle>Selamat datang di Wealth Redemption!</SheetTitle>
          <SheetDescription>
            Wallet kamu udah siap. Sekarang tinggal deposit $WEALTH dan mulai
            redeem voucher favorit kamu.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="flex flex-col gap-2 sm:flex-col sm:gap-2">
          <Button
            type="button"
            className="w-full rounded-full"
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
            className="w-full rounded-full"
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
