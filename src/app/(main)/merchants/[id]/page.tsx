"use client";

import { use } from "react";

export default function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="max-w-2xl mx-auto md:max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Detail Merchant</h1>
      <p className="text-on-surface-variant">Merchant ID: {id}</p>

      {/* Merchant detail and vouchers will be loaded from API */}
      <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-64 animate-pulse" />

      <h2 className="font-display text-xl font-bold">Voucher</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-32 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
