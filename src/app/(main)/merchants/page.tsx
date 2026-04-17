"use client";

export default function MerchantsPage() {
  return (
    <div className="max-w-2xl mx-auto md:max-w-7xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Merchant</h1>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["Semua", "Kuliner", "Hiburan", "Event", "Kesehatan", "Lifestyle", "Travel"].map(
          (cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-surface-container-lowest text-on-surface-variant hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors"
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Merchant Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-4 h-40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
