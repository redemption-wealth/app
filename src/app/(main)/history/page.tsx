"use client";

export default function HistoryPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Riwayat Redemption</h1>

      {/* Filter */}
      <div className="flex gap-2">
        {["Semua", "Pending", "Confirmed", "Failed"].map((status) => (
          <button
            key={status}
            className="px-4 py-2 rounded-full text-sm font-medium bg-surface-container-lowest text-on-surface-variant hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors"
          >
            {status}
          </button>
        ))}
      </div>

      {/* Redemption List */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-4 h-24 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
