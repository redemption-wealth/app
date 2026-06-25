"use client";

import { useState } from "react";
import type { QrCode } from "@/lib/schemas/redemption";

type AssetFormat = "QR" | "CODE" | "BARCODE";

interface QrDisplayProps {
  qrCodes: QrCode[];
  /** Asset format of the voucher — QR/BARCODE render an image, CODE renders
   *  the plain value as text. Defaults to QR. */
  format?: AssetFormat;
  /** True when the voucher's validity window has passed — drives the
   *  "Kedaluwarsa" state for QRs that were never used in time. */
  expired?: boolean;
  onReload?: () => void;
  isReloading?: boolean;
}

const ASSET_NOUN: Record<AssetFormat, string> = {
  QR: "QR",
  CODE: "Kode",
  BARCODE: "Barcode",
};

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
  format = "QR",
  expired = false,
}: {
  qr: QrCode;
  label?: string;
  format?: AssetFormat;
  expired?: boolean;
}) {
  const used = isUsedStatus(qr.status);
  const isExpired = !used && !!expired;
  // Both states disable the asset visually and hide the action.
  const disabled = used || isExpired;
  const overlayLabel = used ? "Sudah Dipakai" : "Kedaluwarsa";
  const noun = ASSET_NOUN[format];
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
        {format === "CODE" ? (
          <div
            className={`bg-surface-container-low flex h-64 w-64 items-center justify-center rounded-lg p-4 transition ${
              disabled ? "opacity-20 grayscale" : ""
            }`}
          >
            <span className="text-on-surface text-center font-mono text-2xl font-bold tracking-wider break-all select-all">
              {qr.value ?? "-"}
            </span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qr.imageUrl ?? ""}
            alt={`${noun} ${qr.qrNumber}`}
            className={`h-64 w-64 object-contain transition ${
              disabled ? "opacity-20 grayscale" : ""
            }`}
          />
        )}
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
      ) : format === "CODE" ? (
        <button
          type="button"
          onClick={() => {
            if (qr.value) void navigator.clipboard?.writeText(qr.value);
          }}
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
              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
            />
          </svg>
          Salin Kode
        </button>
      ) : (
        <button
          type="button"
          onClick={() =>
            downloadQr(
              qr.imageUrl ?? "",
              `${format.toLowerCase()}-${qr.qrNumber}.png`,
            )
          }
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
          Simpan {noun}
        </button>
      )}
    </div>
  );
}

export function QrDisplay({
  qrCodes,
  format = "QR",
  expired = false,
  onReload,
  isReloading,
}: QrDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const noun = ASSET_NOUN[format];

  if (qrCodes.length === 0) {
    return (
      <div className="border-border rounded-[var(--radius-lg)] border bg-white p-6 text-center">
        <div className="border-primary mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-on-surface-variant text-sm">
          Menyiapkan {noun} kamu… Halaman ini akan memperbarui otomatis.
        </p>
        {onReload ? (
          <button
            type="button"
            onClick={onReload}
            disabled={isReloading}
            className="text-primary mt-3 inline-flex items-center text-xs font-semibold disabled:opacity-50"
          >
            {isReloading ? "Memuat…" : `Muat ulang ${noun}`}
          </button>
        ) : null}
      </div>
    );
  }

  if (qrCodes.length === 1) {
    const qr = qrCodes[0]!;
    return (
      <div className="space-y-3">
        <QrCard qr={qr} format={format} expired={expired} />
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
            format={format}
            expired={expired}
            label={`${noun} ${i + 1} dari ${qrCodes.length}`}
          />
        ))}
      </div>

      {/* Mobile: carousel */}
      <div className="md:hidden">
        <QrCard
          qr={active}
          format={format}
          expired={expired}
          label={`${noun} ${activeIndex + 1} dari ${qrCodes.length}`}
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
