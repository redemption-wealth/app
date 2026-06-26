"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { QrDisplay } from "@/components/features/qr-display";
import type { QrCode } from "@/lib/schemas/redemption";
import type { Voucher } from "@/lib/schemas/voucher";
import { formatDate, isVoucherExpired } from "@/lib/utils";

interface RedeemTicketProps {
  voucher?: Voucher | undefined;
  qrCodes: QrCode[];
  onReload?: (() => void) | undefined;
  isReloading?: boolean | undefined;
}

/**
 * Branded "e-voucher" card wrapping the redeemed asset: Wealth header + merchant
 * co-branding + the asset (kept on white, scannable) + footer. The card can be
 * saved/shared as a single image. The asset itself is never overlaid.
 */
export function RedeemTicket({
  voucher,
  qrCodes,
  onReload,
  isReloading,
}: RedeemTicketProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const merchantName = voucher?.merchant?.name ?? "Voucher";
  const merchantLogo = voucher?.merchant?.logoUrl ?? null;
  const format = voucher?.format ?? "QR";
  const expired = voucher ? isVoucherExpired(voucher.expiryDate) : false;

  async function handleShare() {
    if (!cardRef.current) return;
    setSharing(true);
    setShareError(null);
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        // Don't fetch/embed webfonts (cross-origin → "Failed to fetch"); the
        // rendered text is captured as-is.
        skipFonts: true,
        // Keep the captured image clean: drop interactive buttons (download/copy,
        // carousel controls, reload).
        filter: (node) => !(node instanceof HTMLButtonElement),
      });
      if (!blob) throw new Error("Capture returned no image");
      const safeName = (voucher?.title ?? "wealth-voucher")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase();
      const file = new File([blob], `${safeName}.png`, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: voucher?.title ?? "Voucher Wealth",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setShareError("Gagal membuat gambar kartu. Coba lagi.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className="border-border overflow-hidden rounded-[var(--radius-lg)] border bg-white shadow-[var(--shadow-ambient)]"
      >
        {/* Brand accent */}
        <div className="bg-primary h-1.5 w-full" />

        {/* Header: Wealth + e-voucher label. Plain <img> (not next/image) so the
            share-to-image capture can inline it cleanly. */}
        <div className="flex items-center justify-between px-5 pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/logo.png" alt="WEALTH" className="h-6 w-auto" />
          <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase">
            E-Voucher
          </span>
        </div>

        {/* Merchant co-branding + title */}
        <div className="flex items-center gap-3 px-5 pt-4">
          {merchantLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchantLogo}
              alt={merchantName}
              className="border-border h-10 w-10 flex-shrink-0 rounded-full border object-cover"
            />
          ) : (
            <div className="bg-primary-container text-on-primary-container flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-bold">
              {merchantName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-on-surface-variant truncate text-[11px] font-semibold tracking-wider uppercase">
              {merchantName}
            </p>
            <h2 className="font-display text-on-surface truncate text-lg leading-tight font-bold">
              {voucher?.title ?? "Voucher"}
            </h2>
          </div>
        </div>

        {voucher?.expiryDate ? (
          <p
            className={`px-5 pt-1 text-xs ${
              expired ? "text-error font-semibold" : "text-on-surface-variant"
            }`}
          >
            {expired
              ? `Kedaluwarsa ${formatDate(voucher.expiryDate)}`
              : `Berlaku sampai ${formatDate(voucher.expiryDate)}`}
          </p>
        ) : null}

        {/* The asset — on white, scannable, no overlay */}
        <div className="px-5 py-5">
          <QrDisplay
            qrCodes={qrCodes}
            format={format}
            expired={expired}
            onReload={onReload}
            isReloading={isReloading}
            embedded
          />
        </div>

        {/* Footer */}
        <div className="border-border bg-surface-container-low border-t border-dashed px-5 py-3 text-center">
          <p className="text-on-surface-variant text-[11px]">
            Tunjukkan kode ini di {merchantName} · Powered by{" "}
            <span className="text-primary font-semibold">Wealth</span>
          </p>
        </div>
      </div>

      {/* Share / save the whole card as an image */}
      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="border-border text-on-surface hover:bg-surface-container-low flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border bg-white py-3 text-sm font-semibold transition disabled:opacity-50"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.7}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
        {sharing ? "Menyiapkan kartu…" : "Bagikan / Simpan Kartu"}
      </button>
      {shareError ? (
        <p className="text-error text-center text-xs">{shareError}</p>
      ) : null}
    </div>
  );
}
