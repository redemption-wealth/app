"use client";

import { use } from "react";

export default function QrDisplayPage({
  params,
}: {
  params: Promise<{ redemptionId: string }>;
}) {
  const { redemptionId } = use(params);

  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <h1 className="font-display text-2xl font-bold">QR Code Voucher</h1>

      {/* QR code display — loaded from redemption API */}
      <div className="bg-surface-container-lowest rounded-[var(--radius-xl)] p-8 space-y-4">
        <div className="w-64 h-64 mx-auto bg-surface-container rounded-[var(--radius-lg)] animate-pulse" />
        <p className="text-on-surface-variant text-sm">
          Tunjukkan QR code ini ke merchant
        </p>
        <p className="text-xs text-on-surface-variant">
          Redemption ID: {redemptionId}
        </p>
      </div>
    </div>
  );
}
