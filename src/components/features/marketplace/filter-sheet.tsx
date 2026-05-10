"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MerchantChecklist } from "@/components/features/marketplace/merchant-checklist";
import { PriceRangeSlider } from "@/components/features/marketplace/price-range-slider";
import type { Merchant } from "@/lib/schemas/merchant";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  priceMin: number;
  priceMax: number;
  priceValue: [number, number];
  priceIsDirty: boolean;
  onPriceChange: (next: [number, number]) => void;
  onPriceReset: () => void;

  merchants: Merchant[];
  selectedMerchantIds: string[];
  onToggleMerchant: (id: string) => void;
  onSelectAllMerchants: () => void;
  onResetMerchants: () => void;

  onResetAll: () => void;
  resultCount: number;
  isAnyFilterActive: boolean;
}

export function FilterSheet({
  open,
  onOpenChange,
  resultCount,
  onResetAll,
  isAnyFilterActive,
  ...rest
}: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[90vh] flex-col gap-0 rounded-t-[var(--radius-xl)] p-0 sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="border-border border-b px-5 py-4">
          <SheetTitle className="font-display text-on-surface text-lg font-bold">
            Filter
          </SheetTitle>
          <SheetDescription className="sr-only">
            Sesuaikan rentang harga dan merchant yang ingin ditampilkan.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <PriceRangeSlider
            min={rest.priceMin}
            max={rest.priceMax}
            value={rest.priceValue}
            isDirty={rest.priceIsDirty}
            onChange={rest.onPriceChange}
            onReset={rest.onPriceReset}
          />
          <div className="border-border border-t" />
          <MerchantChecklist
            merchants={rest.merchants}
            selectedIds={rest.selectedMerchantIds}
            onToggle={rest.onToggleMerchant}
            onSelectAll={rest.onSelectAllMerchants}
            onReset={rest.onResetMerchants}
          />
        </div>

        <div className="border-border flex items-center gap-2 border-t bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            onClick={onResetAll}
            disabled={!isAnyFilterActive}
            className="flex-1 rounded-full"
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-[2] rounded-full"
          >
            Lihat {resultCount} voucher
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
