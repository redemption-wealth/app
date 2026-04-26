interface StockProgressBarProps {
  remaining: number;
  total: number;
}

export function StockProgressBar({ remaining, total }: StockProgressBarProps) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const isLow = pct <= 20;

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ececec]">
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          isLow ? "bg-[#b91c1c]" : "bg-[#15803d]"
        }`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}
