"use client";

import { use } from "react";

export default function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Detail Voucher</h1>
      <p className="text-on-surface-variant">Voucher ID: {id}</p>

      {/* Voucher detail + redeem button will be connected to API */}
      <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 space-y-4">
        <div className="h-48 bg-surface-container rounded-[var(--radius-md)] animate-pulse" />
        <div className="h-6 bg-surface-container rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-surface-container rounded w-1/2 animate-pulse" />

        <button className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-display font-bold text-lg">
          Redeem Voucher
        </button>
      </div>
    </div>
  );
}
