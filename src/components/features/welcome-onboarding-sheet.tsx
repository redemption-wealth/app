"use client";

import { ArrowRight, Sparkles, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
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

          <DialogClose
            asChild
            aria-label="Tutup"
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <button type="button">
              <XIcon className="h-4 w-4" aria-hidden />
            </button>
          </DialogClose>

          <DialogHeader className="relative gap-2 p-0 text-left">
            <p className="text-xs font-semibold tracking-wider uppercase opacity-80">
              Selamat datang 👋
            </p>
            <DialogTitle className="font-display text-2xl font-bold tracking-tight text-white md:text-[1.75rem]">
              Wallet kamu udah siap.
            </DialogTitle>
            <DialogDescription className="max-w-sm text-sm leading-relaxed text-white/85">
              Deposit $WEALTH sekarang, lalu pilih voucher favoritmu — semua
              dalam satu tap.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-3 px-5 pt-6 pb-5 sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={() => {
              onDeposit();
              onOpenChange(false);
            }}
            className="group/primary font-display from-primary via-primary to-primary-container relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(0,108,72,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-8px_rgba(0,108,72,0.65)] active:translate-y-0"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
            <Sparkles className="relative h-4 w-4" aria-hidden />
            <span className="relative">Deposit $WEALTH</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              router.push("/");
            }}
            className="group/secondary border-primary/25 text-primary font-display hover:border-primary/50 hover:bg-primary/5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 bg-white text-base font-semibold transition-colors"
          >
            <span>Jelajahi Voucher</span>
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover/secondary:translate-x-0.5"
              aria-hidden
            />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
