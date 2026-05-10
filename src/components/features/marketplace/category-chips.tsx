"use client";

import { cn } from "@/lib/utils";

export interface CategoryChip {
  id: string | null;
  label: string;
}

interface CategoryChipsProps {
  chips: CategoryChip[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryChips({
  chips,
  activeId,
  onSelect,
}: CategoryChipsProps) {
  return (
    <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <button
            key={chip.id ?? "all"}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={cn(
              "inline-flex flex-shrink-0 items-center rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
              active
                ? "border-primary bg-primary text-on-primary"
                : "border-border text-on-surface-variant hover:border-primary/40 hover:text-on-surface bg-white",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
