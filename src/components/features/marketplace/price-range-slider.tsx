"use client";

import { Slider } from "@/components/ui/slider";
import { formatWealth } from "@/lib/utils";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  onReset: () => void;
  isDirty: boolean;
}

const STEP_DIVISOR = 200;

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  onReset,
  isDirty,
}: PriceRangeSliderProps) {
  const [low, high] = value;
  const span = max - min;
  const hasRange = span > 0;
  const step = hasRange ? Math.max(span / STEP_DIVISOR, 0.0001) : 0.0001;
  const avg = hasRange ? (max + min) / 2 : max;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-on-surface text-base font-bold">
            Rentang Harga
          </p>
          <p className="text-on-surface-variant mt-0.5 text-xs">
            {hasRange
              ? `Rata-rata ${formatWealth(avg)} $WEALTH`
              : `Semua voucher ${formatWealth(avg)} $WEALTH`}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!isDirty}
          className="text-primary flex-shrink-0 text-xs font-semibold disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {hasRange ? (
        <>
          <div className="px-1">
            <Slider
              min={min}
              max={max}
              step={step}
              value={[low, high]}
              onValueChange={(next) => {
                if (
                  next.length >= 2 &&
                  next[0] !== undefined &&
                  next[1] !== undefined
                ) {
                  onChange([next[0], next[1]]);
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="bg-on-surface inline-flex flex-1 items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold text-white tabular-nums">
              {formatWealth(low)}
            </span>
            <span className="text-on-surface-variant flex-shrink-0 text-[10px] font-semibold tracking-widest uppercase">
              $WEALTH
            </span>
            <span className="bg-on-surface inline-flex flex-1 items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold text-white tabular-nums">
              {formatWealth(high)}
            </span>
          </div>
        </>
      ) : (
        <p className="bg-surface-container-low text-on-surface-variant rounded-[var(--radius-md)] px-3 py-3 text-center text-xs">
          Belum ada variasi harga untuk difilter.
        </p>
      )}
    </div>
  );
}
