// Orchestrates "share / save the voucher card as an image". Kept free of React
// and DOM globals so the full decision tree (capture vs share vs download vs the
// user simply cancelling the share sheet) is unit-testable: every side-effecting
// step is injected. The component wires in the real implementations.
//
// The key correctness rule: cancelling the native share sheet is NORMAL and must
// NOT surface an error. Only a genuine capture failure (or an exhausted
// share+download fallback) is an error.

export interface ShareCardDeps {
  /** Best-effort prep before capture (e.g. inline cross-origin images). Returns
   *  a restore fn that is always called once capture finishes. Failure here is
   *  non-fatal — capture is still attempted. */
  prepare?: (node: HTMLElement) => Promise<() => void>;
  /** Render the node to a PNG blob. A null/undefined result means the capture
   *  produced nothing → treated as a capture failure. */
  capture: (node: HTMLElement) => Promise<Blob | null | undefined>;
  /** Web Share pre-check. Omit when the platform has no Web Share API. */
  canShare?: (data: { files: File[] }) => boolean;
  /** Web Share. Rejects with an AbortError when the user cancels the sheet. */
  share?: (data: { files: File[]; title?: string }) => Promise<void>;
  /** Download fallback (browsers without Web Share, or after a share failure). */
  download: (blob: Blob, fileName: string) => void;
  /** File constructor — injectable so tests need no DOM File global. */
  makeFile?: (blob: Blob, name: string, type: string) => File;
}

export type ShareCardStatus = "shared" | "downloaded" | "canceled" | "error";

export interface ShareCardResult {
  status: ShareCardStatus;
  /** Only set when status === "error". */
  reason?: "capture" | "share";
}

const defaultMakeFile = (blob: Blob, name: string, type: string): File =>
  new File([blob], name, { type });

/**
 * True when an error represents the user dismissing the native share sheet.
 * Browsers reject `navigator.share` with a DOMException named "AbortError";
 * some engines surface a plain Error with the same name. Either way: not a bug.
 */
export function isUserCancellation(err: unknown): boolean {
  if (err == null || typeof err !== "object") return false;
  return (err as { name?: unknown }).name === "AbortError";
}

/** Build a safe, lowercase PNG filename from a (possibly messy) voucher title. */
export function buildCardFileName(
  title: string | undefined,
  index = 0,
  total = 1,
): string {
  const base =
    (title ?? "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "wealth-voucher";
  return total > 1 ? `${base}-${index + 1}.png` : `${base}.png`;
}

/** Capture the node to a File, restoring any prep side-effects afterwards.
 *  Returns null on any capture failure (no blob, or an exception). */
async function captureCardFile(
  node: HTMLElement,
  fileName: string,
  deps: ShareCardDeps,
): Promise<File | null> {
  let restore: (() => void) | undefined;
  try {
    if (deps.prepare) {
      try {
        restore = await deps.prepare(node);
      } catch {
        /* prep is best-effort; capture can still work without it */
      }
    }
    const blob = await deps.capture(node);
    if (!blob) return null;
    const make = deps.makeFile ?? defaultMakeFile;
    return make(blob, fileName, "image/png");
  } catch {
    return null;
  } finally {
    // Always undo prep before we hand off to share/download so the on-screen
    // card is back to its live state while the native sheet is open.
    restore?.();
  }
}

/**
 * Capture the card and either share it (Web Share) or download it. Never throws.
 *
 * - capture fails           → { status: "error", reason: "capture" }
 * - user cancels the sheet  → { status: "canceled" }      (NOT an error)
 * - shared successfully     → { status: "shared" }
 * - no/failed share → saved → { status: "downloaded" }
 * - share AND download fail → { status: "error", reason: "share" }
 */
export async function shareCard(
  node: HTMLElement,
  opts: { title?: string; fileName: string },
  deps: ShareCardDeps,
): Promise<ShareCardResult> {
  const file = await captureCardFile(node, opts.fileName, deps);
  if (!file) return { status: "error", reason: "capture" };

  const canUseShare =
    !!deps.share && (deps.canShare ? deps.canShare({ files: [file] }) : true);

  if (canUseShare) {
    // Avoid passing `title: undefined` (incompatible with the DOM ShareData
    // type under exactOptionalPropertyTypes).
    const data: { files: File[]; title?: string } = { files: [file] };
    if (opts.title !== undefined) data.title = opts.title;
    try {
      await deps.share!(data);
      return { status: "shared" };
    } catch (err) {
      // Cancelling is expected — stop here, silently.
      if (isUserCancellation(err)) return { status: "canceled" };
      // Any other share failure falls through to the download fallback.
    }
  }

  try {
    deps.download(file, opts.fileName);
    return { status: "downloaded" };
  } catch {
    return { status: "error", reason: "share" };
  }
}
