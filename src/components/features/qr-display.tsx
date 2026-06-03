"use client";

import { useState } from "react";
import type { QrCode } from "@/lib/schemas/redemption";

interface QrDisplayProps {
  qrCodes: QrCode[];
  /** True when the voucher's validity window has passed — drives the
   *  "Kedaluwarsa" state for QRs that were never used in time. */
  expired?: boolean;
  onReload?: () => void;
  isReloading?: boolean;
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

function isUsedStatus(status: QrCode["status"]): boolean {
  return status === "used" || status === "fully_used";
}

function StatusText({
  status,
  expired = false,
}: {
  status: QrCode["status"];
  expired?: boolean;
}) {
  const used = isUsedStatus(status);
  // Expiry only matters for a QR that was never used in time.
  const isExpired = !used && !!expired;

  let className: string;
  let label: string;
  if (used) {
    className = "text-error font-semibold";
    label = "Sudah dipakai";
  } else if (isExpired) {
    className = "text-error font-semibold";
    label = "Kedaluwarsa";
  } else if (status === "redeemed") {
    className = "text-primary font-semibold";
    label = "Siap digunakan";
  } else {
    className = "text-on-success-container font-semibold";
    label = "Tersedia";
  }

  return (
    <p className="text-outline text-xs">
      Status: <span className={className}>{label}</span>
    </p>
  );
}

function QrCard({
  qr,
  label,
  expired = false,
}: {
  qr: QrCode;
  label?: string;
  expired?: boolean;
}) {
  const used = isUsedStatus(qr.status);
  const isExpired = !used && !!expired;
  // Both states disable the QR visually and hide the download action.
  const disabled = used || isExpired;
  const overlayLabel = used ? "Sudah Dipakai" : "Kedaluwarsa";
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border bg-white p-6 ${
        disabled ? "border-error/40" : "border-border"
      }`}
    >
      {label ? (
        <p className="text-on-surface-variant text-xs font-semibold">{label}</p>
      ) : null}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr.imageUrl}
          alt={`QR code ${qr.qrNumber}`}
          className={`h-64 w-64 object-contain transition ${
            disabled ? "opacity-20 grayscale" : ""
          }`}
        />
        {disabled ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-error border-error flex -rotate-12 items-center gap-1.5 rounded-xl border-2 bg-white/85 px-4 py-2 shadow-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-base font-extrabold tracking-wide uppercase">
                {overlayLabel}
              </span>
            </div>
          </div>
        ) : null}
      </div>
      <StatusText status={qr.status} expired={expired} />
      {disabled ? (
        <p className="text-on-surface-variant text-center text-xs">
          {used
            ? "Voucher ini telah diredem di merchant."
            : "Voucher ini sudah melewati masa berlaku."}
        </p>
      ) : (
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
      )}
    </div>
  );
}

export function QrDisplay({
  qrCodes,
  expired = false,
  onReload,
  isReloading,
}: QrDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (qrCodes.length === 0) {
    return (
      <div className="border-border rounded-[var(--radius-lg)] border bg-white p-6 text-center">
        <div className="border-primary mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-on-surface-variant text-sm">
          Menyiapkan QR code kamu… Halaman ini akan memperbarui otomatis.
        </p>
        {onReload ? (
          <button
            type="button"
            onClick={onReload}
            disabled={isReloading}
            className="text-primary mt-3 inline-flex items-center text-xs font-semibold disabled:opacity-50"
          >
            {isReloading ? "Memuat…" : "Muat ulang QR"}
          </button>
        ) : null}
      </div>
    );
  }

  if (qrCodes.length === 1) {
    const qr = qrCodes[0]!;
    return (
      <div className="space-y-3">
        <QrCard qr={qr} expired={expired} />
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
            expired={expired}
            label={`QR ${i + 1} dari ${qrCodes.length}`}
          />
        ))}
      </div>

      {/* Mobile: carousel */}
      <div className="md:hidden">
        <QrCard
          qr={active}
          expired={expired}
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
