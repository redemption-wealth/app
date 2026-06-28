"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { QrDisplay } from "@/components/features/qr-display";
import type { QrCode } from "@/lib/schemas/redemption";
import type { Voucher } from "@/lib/schemas/voucher";
import { buildCardFileName, shareCard } from "@/lib/share-card";
import { formatDate, isVoucherExpired } from "@/lib/utils";

/** A short, friendly caption shared alongside the card image (chat apps append
 *  the URL after this). */
function buildShareText(title: string | undefined, merchant: string): string {
  const t = title ?? "voucher";
  return `🎉 Aku baru klaim voucher "${t}" di ${merchant} pakai Wealth!\nTukar $WEALTH kamu jadi voucher juga, yuk 👇`;
}

/** Save a blob to the user's device by clicking a transient object-URL link. */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Replace every image src with an inlined data URL BEFORE capture so
 * html-to-image never has to fetch/decode an image while rasterising — which is
 * where mobile Safari intermittently drops images (blank logos). Cross-origin
 * images (R2 signed URLs / the CDN, which send no CORS headers) are fetched
 * through our same-origin proxy; same-origin images (the Wealth logo) are
 * fetched directly. Returns a restore fn; on-screen display is untouched.
 */
async function inlineImagesForCapture(root: HTMLElement): Promise<() => void> {
  const restores: Array<() => void> = [];
  const toFetchUrl = (src: string) =>
    /^https?:\/\//i.test(src) && !src.startsWith(window.location.origin)
      ? `/api/asset-image?u=${encodeURIComponent(src)}`
      : src;

  await Promise.all(
    Array.from(root.querySelectorAll("img")).map(async (img) => {
      const src = img.getAttribute("src") ?? "";
      if (!src || src.startsWith("data:")) return;
      try {
        const res = await fetch(toFetchUrl(src));
        if (!res.ok) return;
        const dataUrl = await blobToDataUrl(await res.blob());
        const original = img.getAttribute("src")!;
        restores.push(() => img.setAttribute("src", original));
        img.setAttribute("src", dataUrl);
        await img.decode().catch(() => {});
      } catch {
        /* leave as-is */
      }
    }),
  );
  return () => restores.forEach((r) => r());
}

/**
 * Prep the card for a clean exported image: inline cross-origin images AND make
 * the card full-bleed (square corners, no border/shadow) so the capture has no
 * rounded white corners — those look wrong on a coloured chat background. All
 * changes are reverted via the returned restore fn after capture.
 */
async function prepareForCapture(node: HTMLElement): Promise<() => void> {
  const prev = {
    borderRadius: node.style.borderRadius,
    border: node.style.border,
    boxShadow: node.style.boxShadow,
  };
  node.style.borderRadius = "0px";
  node.style.border = "none";
  node.style.boxShadow = "none";
  const restoreImages = await inlineImagesForCapture(node);
  return () => {
    restoreImages();
    node.style.borderRadius = prev.borderRadius;
    node.style.border = prev.border;
    node.style.boxShadow = prev.boxShadow;
  };
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
    const node = cardRef.current;
    if (!node) return;
    setSharing(true);
    setShareError(null);
    try {
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      const canShareFn = nav?.canShare?.bind(nav);
      const shareFn = nav?.share?.bind(nav);
      // Link to the app home for engagement + so the share sheet's "Copy"
      // works (a file-only share leaves nothing to copy on iOS). Home is always
      // valid — a per-voucher link 404s for expired/inactive/test vouchers.
      const shareUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const result = await shareCard(
        node,
        {
          title: voucher?.title ?? "Voucher Wealth",
          fileName: buildCardFileName(voucher?.title, index, total),
          text: buildShareText(voucher?.title, merchantName),
          ...(shareUrl ? { url: shareUrl } : {}),
        },
        {
          // Inline cross-origin (R2) images via our same-origin proxy so the
          // canvas isn't tainted, and make the card full-bleed; both reverted
          // right after the capture.
          prepare: prepareForCapture,
          capture: async (el) => {
            const opts = {
              pixelRatio: 2,
              skipFonts: true,
              filter: (n: HTMLElement) => !(n instanceof HTMLButtonElement),
            };
            // First pass warms html-to-image's image cache; some engines
            // (mobile Safari) drop images on the very first rasterisation.
            await toBlob(el, opts).catch(() => null);
            return toBlob(el, opts);
          },
          download: downloadBlob,
          ...(canShareFn ? { canShare: canShareFn } : {}),
          ...(shareFn ? { share: shareFn } : {}),
        },
      );
      // A cancelled share sheet is normal — only flag genuine failures.
      if (result.status === "error") {
        setShareError("Gagal membuat gambar kartu. Coba lagi.");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-2.5">
      {/* Ticket-stub frame: a green Wealth × Merchant header, an info strip, a
          perforated tear-line (dashed + side notches) and the asset "stub". */}
      <div
        ref={cardRef}
        className="border-border relative overflow-hidden rounded-[var(--radius-lg)] border bg-white shadow-[var(--shadow-ambient)]"
      >
        {/* Wealth × Merchant collab header — balanced lockup: Wealth leads, a
            divider, then the merchant; topped with a small collab label. */}
        <div className="bg-primary px-5 py-3.5">
          <p className="mb-2 text-center text-[9px] font-semibold tracking-[0.22em] text-white/55 uppercase">
            Kolaborasi Eksklusif
          </p>
          <div className="flex items-center justify-center gap-4">
            {/* white Wealth logo (filter inverts the gold wordmark) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/image/logo.png"
              alt="WEALTH"
              className="h-7 w-auto brightness-0 invert"
            />
            <span className="h-7 w-px bg-white/30" />
            {merchantLogo ? (
              // Show the merchant logo as-is (natural shape, no circle/clip):
              // a plain <img> rasterises reliably everywhere, including
              // WebKit/Safari where border-radius/overflow clipping leaks corners.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={merchantLogo}
                alt={merchantName}
                className="h-9 w-auto max-w-[7.5rem] shrink-0 object-contain"
              />
            ) : (
              <span className="max-w-[9rem] truncate text-sm font-bold tracking-wide text-white uppercase">
                {merchantName}
              </span>
            )}
          </div>
        </div>

        {/* Info strip */}
        <div className="px-5 pt-4 pb-1">
          <div className="flex items-start justify-between gap-2">
            {/* flex-1 + min-w-0 gives the title the full available width (not a
                shrink-to-fit box), and truncate keeps it to one line — so the
                rasterised capture can't reflow it into the date below. */}
            <div className="min-w-0 flex-1">
              <p className="text-on-surface-variant truncate text-[10px] font-bold tracking-wider uppercase">
                {merchantName}
              </p>
              <h2 className="font-display text-on-surface truncate text-base leading-tight font-bold">
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
              className={`mt-0.5 text-[11px] ${
                expired ? "text-error font-semibold" : "text-on-surface-variant"
              }`}
            >
              {expired
                ? `Kedaluwarsa ${formatDate(voucher.expiryDate)}`
                : `Berlaku sampai ${formatDate(voucher.expiryDate)}`}
            </p>
          ) : null}
        </div>

        {/* Perforated tear-line: notches bite the card edges (filled with the
            page background so they read as holes), dashed line between them. */}
        <div className="relative py-3">
          <span className="bg-surface absolute top-1/2 left-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          <span className="bg-surface absolute top-1/2 right-0 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full" />
          <div className="border-outline-variant absolute inset-x-4 top-1/2 -translate-y-1/2 border-t border-dashed" />
        </div>

        {/* The asset "stub" — focal point, scannable, no overlay */}
        <div className="px-5 pt-1 pb-5">
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
