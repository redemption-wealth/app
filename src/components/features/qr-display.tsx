"use client";

import { useState } from "react";
import type { QrCode } from "@/lib/schemas/redemption";

interface QrDisplayProps {
  qrCodes: QrCode[];
}

async function downloadQr(imageUrl: string, filename: string) {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    window.open(imageUrl, "_blank");
  }
}

function StatusText({ status }: { status: QrCode["status"] }) {
  const className =
    status === "used"
      ? "text-outline-variant line-through"
      : status === "redeemed"
        ? "text-primary font-semibold"
        : "text-on-success-container font-semibold";

  const label =
    status === "used"
      ? "Sudah dipakai"
      : status === "redeemed"
        ? "Siap digunakan"
        : "Tersedia";

  return (
    <p className="text-outline text-xs">
      Status: <span className={className}>{label}</span>
    </p>
  );
}

function QrCard({ qr, label }: { qr: QrCode; label?: string }) {
  return (
    <div className="border-border flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border bg-white p-6">
      {label ? (
        <p className="text-on-surface-variant text-xs font-semibold">{label}</p>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qr.imageUrl}
        alt={`QR code ${qr.qrNumber}`}
        className="h-64 w-64 object-contain"
      />
      <StatusText status={qr.status} />
      <button
        type="button"
        onClick={() => downloadQr(qr.imageUrl, `qr-${qr.qrNumber}.png`)}
        className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Simpan QR
      </button>
    </div>
  );
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

  if (qrCodes.length === 1) {
    const qr = qrCodes[0]!;
    return (
      <div className="space-y-3">
        <QrCard qr={qr} />
      </div>
    );
  }

  // BOGO: multiple QR codes
  const active = qrCodes[Math.min(activeIndex, qrCodes.length - 1)];
  if (!active) return null;

  return (
    <div className="space-y-3">
      {/* Desktop: side-by-side grid */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4">
        {qrCodes.map((qr, i) => (
          <QrCard
            key={qr.id}
            qr={qr}
            label={`QR ${i + 1} dari ${qrCodes.length}`}
          />
        ))}
      </div>

      {/* Mobile: carousel */}
      <div className="md:hidden">
        <QrCard
          qr={active}
          label={`QR ${activeIndex + 1} dari ${qrCodes.length}`}
        />
      </div>

      {/* Mobile carousel controls */}
      <div className="flex items-center justify-center gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          disabled={activeIndex === 0}
          className="border-border text-on-surface-variant flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-30"
          aria-label="QR sebelumnya"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {qrCodes.map((_qr, i) => (
          <button
            key={_qr.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`h-2 w-8 rounded-full transition-colors ${
              i === activeIndex ? "bg-primary" : "bg-surface-container-high"
            }`}
            aria-label={`Tampilkan QR ${i + 1}`}
          />
        ))}

        <button
          type="button"
          onClick={() =>
            setActiveIndex((i) => Math.min(qrCodes.length - 1, i + 1))
          }
          disabled={activeIndex === qrCodes.length - 1}
          className="border-border text-on-surface-variant flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-30"
          aria-label="QR berikutnya"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
