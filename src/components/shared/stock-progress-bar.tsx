interface StockProgressBarProps {
  remaining: number;
  total: number;
}

export function StockProgressBar({ remaining, total }: StockProgressBarProps) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const isLow = pct <= 20;

  return (
    <div className="bg-surface-container h-1.5 w-full overflow-hidden rounded-full">
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          isLow ? "bg-error" : "bg-on-success-container"
        }`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}
