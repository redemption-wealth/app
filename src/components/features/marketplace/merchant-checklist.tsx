"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { Merchant } from "@/lib/schemas/merchant";

interface MerchantChecklistProps {
  merchants: Merchant[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onReset: () => void;
}

type SelectAllState = "none" | "some" | "all";

function deriveSelectAllState(total: number, selected: number): SelectAllState {
  if (total === 0 || selected === 0) return "none";
  if (selected >= total) return "all";
  return "some";
}

export function MerchantChecklist({
  merchants,
  selectedIds,
  onToggle,
  onSelectAll,
  onReset,
}: MerchantChecklistProps) {
  const state = deriveSelectAllState(merchants.length, selectedIds.length);
  const selectAllChecked: boolean | "indeterminate" =
    state === "all" ? true : state === "some" ? "indeterminate" : false;

  const handleSelectAllChange = () => {
    if (state === "all") onReset();
    else onSelectAll();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-on-surface text-base font-bold">
          Merchant
        </p>
        <label className="text-on-surface-variant flex cursor-pointer items-center gap-2 text-xs font-semibold">
          <Checkbox
            checked={selectAllChecked}
            onCheckedChange={handleSelectAllChange}
            disabled={merchants.length === 0}
            aria-label="Pilih semua merchant"
          />
          Pilih semua
        </label>
      </div>

      {merchants.length === 0 ? (
        <p className="text-on-surface-variant text-xs">
          Tidak ada merchant pada kategori ini.
        </p>
      ) : (
        <ul className="scrollbar-hide max-h-72 space-y-1 overflow-y-auto pr-1">
          {merchants.map((merchant) => {
            const checked = selectedIds.includes(merchant.id);
            const id = `merchant-${merchant.id}`;
            return (
              <li key={merchant.id}>
                <label
                  htmlFor={id}
                  className="hover:bg-surface-hover flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 transition-colors"
                >
                  {merchant.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={merchant.logoUrl}
                      alt=""
                      className="bg-surface-container-low h-7 w-7 flex-shrink-0 rounded-md object-contain"
                    />
                  ) : (
                    <span className="bg-surface-container-low text-on-surface-variant flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold">
                      {merchant.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-on-surface flex-1 truncate text-sm font-medium">
                    {merchant.name}
                  </span>
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={() => onToggle(merchant.id)}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
