"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { QrDisplay } from "@/components/features/qr-display";
import type { QrCode } from "@/lib/schemas/redemption";
import type { Voucher } from "@/lib/schemas/voucher";
import { formatDate, isVoucherExpired } from "@/lib/utils";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Cross-origin images (R2 signed URLs) can't be read by html-to-image because R2
 * doesn't send CORS headers. Temporarily swap them for same-origin-proxied data
 * URLs so the capture works, and return a restore fn. Display is untouched.
 */
async function inlineCrossOriginImages(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const restores: Array<() => void> = [];
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") ?? "";
      if (!/^https?:\/\//i.test(src)) return; // relative/same-origin → fine
      if (src.startsWith(window.location.origin)) return;
      try {
        const res = await fetch(
          `/api/asset-image?u=${encodeURIComponent(src)}`,
        );
        if (!res.ok) return;
        const dataUrl = await blobToDataUrl(await res.blob());
        const original = img.getAttribute("src")!;
        restores.push(() => img.setAttribute("src", original));
        img.setAttribute("src", dataUrl);
        await img.decode().catch(() => {});
      } catch {
        /* leave as-is; capture may still partially work */
      }
    }),
  );
  return () => restores.forEach((r) => r());
}

interface RedeemTicketProps {
  voucher?: Voucher | undefined;
  /** A single asset — BOGO renders one card per asset so each can be shared
   *  or saved on its own. */
  qr: QrCode;
  index?: number | undefined; // 0-based
  total?: number | undefined;
  onReload?: (() => void) | undefined;
  isReloading?: boolean | undefined;
}

/**
 * Wealth-forward "e-voucher" card for ONE asset: a green Wealth × Merchant
 * collab header, compact body, the asset (kept scannable, never overlaid), and a
 * footer. The whole card can be saved/shared as a single image.
 */
export function RedeemTicket({
  voucher,
  qr,
  index = 0,
  total = 1,
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
    let restore: (() => void) | null = null;
    try {
      // Inline cross-origin (R2) images via our same-origin proxy so the canvas
      // isn't tainted; restored right after the capture.
      restore = await inlineCrossOriginImages(cardRef.current);
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true,
        filter: (node) => !(node instanceof HTMLButtonElement),
      });
      if (!blob) throw new Error("Capture returned no image");
      const base = (voucher?.title ?? "wealth-voucher")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase();
      const name = total > 1 ? `${base}-${index + 1}.png` : `${base}.png`;
      const file = new File([blob], name, { type: "image/png" });

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
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setShareError("Gagal membuat gambar kartu. Coba lagi.");
    } finally {
      restore?.();
      setSharing(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <div
        ref={cardRef}
        className="border-border overflow-hidden rounded-[var(--radius-lg)] border bg-white shadow-[var(--shadow-ambient)]"
      >
        {/* Wealth × Merchant collab header — Wealth is the dominant brand */}
        <div className="bg-primary flex items-center justify-between gap-3 px-4 py-3">
          {/* white Wealth logo (filter inverts the gold wordmark) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/logo.png"
            alt="WEALTH"
            className="h-7 w-auto brightness-0 invert"
          />
          <div className="flex items-center gap-2">
            <span className="text-lg font-light text-white/60">×</span>
            {merchantLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={merchantLogo}
                alt={merchantName}
                className="h-9 w-9 rounded-full bg-white object-cover p-0.5 ring-1 ring-white/40"
              />
            ) : (
              <span className="text-sm font-bold tracking-wide text-white uppercase">
                {merchantName}
              </span>
            )}
          </div>
        </div>

        {/* Title (compact) */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-on-surface-variant truncate text-[10px] font-bold tracking-wider uppercase">
                {merchantName}
              </p>
              <h2 className="font-display text-on-surface text-base leading-tight font-bold">
                {voucher?.title ?? "Voucher"}
              </h2>
            </div>
            {total > 1 ? (
              <span className="bg-primary-container text-on-primary-container flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                {index + 1}/{total}
              </span>
            ) : null}
          </div>
          {voucher?.expiryDate ? (
            <p
              className={`text-[11px] ${
                expired ? "text-error font-semibold" : "text-on-surface-variant"
              }`}
            >
              {expired
                ? `Kedaluwarsa ${formatDate(voucher.expiryDate)}`
                : `Berlaku sampai ${formatDate(voucher.expiryDate)}`}
            </p>
          ) : null}
        </div>

        {/* The asset — focal point, scannable, no overlay */}
        <div className="px-5 py-5">
          <QrDisplay
            qrCodes={[qr]}
            format={format}
            expired={expired}
            onReload={onReload}
            isReloading={isReloading}
            embedded
          />
        </div>

        {/* Footer */}
        <div className="border-border bg-primary/5 border-t px-4 py-2 text-center">
          <p className="text-on-surface-variant text-[10px]">
            Powered by <span className="text-primary font-bold">Wealth</span>
          </p>
        </div>
      </div>

      {/* Save / share this card as an image */}
      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="border-border text-on-surface hover:bg-surface-container-low flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border bg-white py-2.5 text-sm font-semibold transition disabled:opacity-50"
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
