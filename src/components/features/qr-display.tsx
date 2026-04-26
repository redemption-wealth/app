"use client";

import { useState } from "react";
import type { QrCode } from "@/lib/schemas/redemption";

interface QrDisplayProps {
  qrCodes: QrCode[];
}

export function QrDisplay({ qrCodes }: QrDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (qrCodes.length === 0) {
    return (
      <div className="border-border text-on-surface-variant rounded-[var(--radius-lg)] border bg-white p-6 text-center text-sm">
        QR code belum siap. Mohon tunggu sebentar.
      </div>
    );
  }

  const isBogo = qrCodes.length > 1;
  const active = qrCodes[Math.min(activeIndex, qrCodes.length - 1)];
  if (!active) return null;

  return (
    <div className="space-y-3">
      <div className="border-border flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.imageUrl}
          alt={`QR code ${active.qrNumber}`}
          className="h-64 w-64 object-contain"
        />
        {isBogo ? (
          <p className="text-on-surface-variant text-xs font-semibold">
            QR {activeIndex + 1} dari {qrCodes.length}
          </p>
        ) : null}
        <p className="text-outline text-xs">
          Status:{" "}
          <span
            className={
              active.status === "used"
                ? "text-outline-variant line-through"
                : active.status === "redeemed"
                  ? "text-primary font-semibold"
                  : "text-on-success-container font-semibold"
            }
          >
            {active.status === "used"
              ? "Sudah dipakai"
              : active.status === "redeemed"
                ? "Siap digunakan"
                : "Tersedia"}
          </span>
        </p>
      </div>

      {isBogo ? (
        <div className="flex items-center justify-center gap-2">
          {qrCodes.map((qr, i) => (
            <button
              key={qr.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-2 w-8 rounded-full transition-colors ${
                i === activeIndex ? "bg-primary" : "bg-surface-container-high"
              }`}
              aria-label={`Tampilkan QR ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
