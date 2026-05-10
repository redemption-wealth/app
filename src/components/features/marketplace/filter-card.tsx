"use client";

import { MerchantChecklist } from "@/components/features/marketplace/merchant-checklist";
import { PriceRangeSlider } from "@/components/features/marketplace/price-range-slider";
import type { Merchant } from "@/lib/schemas/merchant";

interface FilterCardProps {
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
}

export function FilterCard(props: FilterCardProps) {
  return (
    <aside className="border-border space-y-6 rounded-[var(--radius-lg)] border bg-white p-5">
      <PriceRangeSlider
        min={props.priceMin}
        max={props.priceMax}
        value={props.priceValue}
        isDirty={props.priceIsDirty}
        onChange={props.onPriceChange}
        onReset={props.onPriceReset}
      />
      <div className="border-border border-t" />
      <MerchantChecklist
        merchants={props.merchants}
        selectedIds={props.selectedMerchantIds}
        onToggle={props.onToggleMerchant}
        onSelectAll={props.onSelectAllMerchants}
        onReset={props.onResetMerchants}
      />
    </aside>
  );
}
