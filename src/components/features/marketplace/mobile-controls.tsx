"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MobileControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onOpenFilter: () => void;
  activeFilterCount: number;
}

export function MobileControls({
  searchValue,
  onSearchChange,
  onOpenFilter,
  activeFilterCount,
}: MobileControlsProps) {
  return (
    <div className="flex items-center gap-2 md:hidden">
      <div className="relative flex-1">
        <Search
          className="text-on-surface-variant pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Cari voucher"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-surface-container-low h-10 rounded-full border-transparent pl-9 focus-visible:bg-white"
        />
      </div>
      <button
        type="button"
        onClick={onOpenFilter}
        aria-label="Buka filter"
        className="border-border hover:border-primary/40 relative inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border bg-white"
      >
        <SlidersHorizontal className="text-on-surface h-4 w-4" aria-hidden />
        {activeFilterCount > 0 ? (
          <span className="bg-primary absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
