"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
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
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden rounded-t-[var(--radius-xl)] p-0 sm:mx-auto sm:max-w-lg sm:rounded-[var(--radius-xl)]"
      >
        <div
          className="relative overflow-hidden px-6 pt-7 pb-9 text-white"
          style={{
            background:
              "linear-gradient(140deg, var(--color-on-primary-container) 0%, var(--color-primary) 60%, var(--color-primary-container) 130%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full opacity-20"
            style={{ background: "var(--color-primary-container)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 rounded-full opacity-15"
            style={{ background: "var(--color-primary-container)" }}
          />

          <SheetClose
            asChild
            aria-label="Tutup"
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <button type="button">
              <XIcon className="h-4 w-4" aria-hidden />
            </button>
          </SheetClose>

          <SheetHeader className="relative gap-2 p-0 text-left">
            <p className="text-xs font-semibold tracking-wider uppercase opacity-80">
              Selamat datang 👋
            </p>
            <SheetTitle className="font-display text-2xl font-bold tracking-tight text-white md:text-[1.75rem]">
              Wallet kamu udah siap.
            </SheetTitle>
            <SheetDescription className="max-w-sm text-sm leading-relaxed text-white/85">
              Deposit $WEALTH sekarang, lalu pilih voucher favoritmu — semua
              dalam satu tap.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex flex-col gap-2.5 px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
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
              router.push("/");
            }}
          >
            Jelajahi Voucher
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
