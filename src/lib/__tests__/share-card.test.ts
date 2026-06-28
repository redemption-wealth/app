import { describe, expect, it, vi } from "vitest";
import {
  buildCardFileName,
  isUserCancellation,
  shareCard,
  type ShareCardDeps,
} from "@/lib/share-card";

// ── Fixtures ────────────────────────────────────────────────────────────────

const NODE = {} as unknown as HTMLElement;
const BLOB = { size: 42, type: "image/png" } as unknown as Blob;
const fakeFile = (name: string) =>
  ({ name, type: "image/png", __file: true }) as unknown as File;

/** AbortError as the various shapes browsers actually throw on cancel. */
const abortShapes = {
  domException: () =>
    typeof DOMException !== "undefined"
      ? new DOMException("Canceled", "AbortError")
      : Object.assign(new Error("Canceled"), { name: "AbortError" }),
  errorSubclass: () =>
    Object.assign(new Error("Canceled"), { name: "AbortError" }),
  plainObject: () => ({ name: "AbortError", message: "Canceled" }),
};
const notAllowed = () =>
  Object.assign(new Error("blocked"), { name: "NotAllowedError" });
const genericError = () => new Error("boom");

interface Harness {
  deps: ShareCardDeps;
  capture: ReturnType<typeof vi.fn>;
  download: ReturnType<typeof vi.fn>;
  makeFile: ReturnType<typeof vi.fn>;
  log: string[];
}

function setup(overrides: Partial<ShareCardDeps> = {}): Harness {
  const log: string[] = [];
  const capture = vi.fn(async () => {
    log.push("capture");
    return BLOB;
  });
  const download = vi.fn(() => log.push("download"));
  const makeFile = vi.fn((_b: Blob, name: string) => fakeFile(name));
  const deps: ShareCardDeps = { capture, download, makeFile, ...overrides };
  return { deps, capture, download, makeFile, log };
}

const run = (deps: ShareCardDeps, title?: string) => {
  const opts: { title?: string; fileName: string } = { fileName: "card.png" };
  if (title !== undefined) opts.title = title;
  return shareCard(NODE, opts, deps);
};

/** A share spy whose argument is typed so tests can inspect the passed data. */
const shareSpy = () =>
  vi.fn(async (data: { files: File[]; title?: string }) => {
    void data;
  });

// ── buildCardFileName ────────────────────────────────────────────────────────

describe("buildCardFileName", () => {
  it("slugifies a normal title", () => {
    expect(buildCardFileName("KFC – QR")).toBe("kfc-qr.png");
  });

  it("appends a 1-based index only when there is more than one asset", () => {
    expect(buildCardFileName("Promo", 0, 1)).toBe("promo.png");
    expect(buildCardFileName("Promo", 0, 2)).toBe("promo-1.png");
    expect(buildCardFileName("Promo", 2, 3)).toBe("promo-3.png");
  });

  it("falls back when the title is missing or empty", () => {
    expect(buildCardFileName(undefined)).toBe("wealth-voucher.png");
    expect(buildCardFileName("")).toBe("wealth-voucher.png");
  });

  it("falls back when the title has no alphanumeric characters", () => {
    expect(buildCardFileName("★★★")).toBe("wealth-voucher.png");
    expect(buildCardFileName("—  -- —")).toBe("wealth-voucher.png");
  });

  it("trims leading/trailing separators and collapses runs", () => {
    expect(buildCardFileName("  --Hello--  ")).toBe("hello.png");
    expect(buildCardFileName("A B  C")).toBe("a-b-c.png");
  });

  it("drops emoji/unicode but keeps alphanumerics", () => {
    expect(buildCardFileName("Voucher 🎉 Spesial")).toBe("voucher-spesial.png");
    expect(buildCardFileName("Diskon 50%!")).toBe("diskon-50.png");
    expect(buildCardFileName("EAN13 2024")).toBe("ean13-2024.png");
  });

  it("always ends in .png, even for adversarial input", () => {
    const inputs = [
      "",
      "...",
      "\n\t",
      "🙂",
      "a".repeat(500),
      "../../etc/passwd",
    ];
    for (const t of inputs)
      expect(buildCardFileName(t).endsWith(".png")).toBe(true);
    // No path separators survive sanitisation.
    expect(buildCardFileName("../../etc/passwd")).not.toContain("/");
  });
});

// ── isUserCancellation ───────────────────────────────────────────────────────

describe("isUserCancellation", () => {
  it("is true for every AbortError shape", () => {
    expect(isUserCancellation(abortShapes.domException())).toBe(true);
    expect(isUserCancellation(abortShapes.errorSubclass())).toBe(true);
    expect(isUserCancellation(abortShapes.plainObject())).toBe(true);
  });

  it("is false for other errors and non-errors", () => {
    const notCancellations: unknown[] = [
      notAllowed(),
      genericError(),
      { name: "TypeError" },
      null,
      undefined,
      "AbortError", // a string is not an error object
      42,
      {},
      [],
      { name: 123 },
    ];
    for (const v of notCancellations) expect(isUserCancellation(v)).toBe(false);
  });
});

// ── shareCard: positive paths ────────────────────────────────────────────────

describe("shareCard — sharing", () => {
  it("shares when Web Share is available and canShare passes", async () => {
    const share = shareSpy();
    const canShare = vi.fn(() => true);
    const h = setup({ share, canShare });

    const result = await run(h.deps, "KFC");

    expect(result).toEqual({ status: "shared" });
    expect(canShare).toHaveBeenCalledWith({ files: [fakeFile("card.png")] });
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0]![0]).toEqual({
      files: [fakeFile("card.png")],
      title: "KFC",
    });
    expect(h.download).not.toHaveBeenCalled();
  });

  it("shares without a title when none is provided (no title key)", async () => {
    const share = shareSpy();
    const h = setup({ share });

    await run(h.deps, undefined);

    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0]![0]).toEqual({ files: [fakeFile("card.png")] });
    expect("title" in (share.mock.calls[0]![0] as object)).toBe(false);
  });

  it("treats a missing canShare dep as shareable", async () => {
    const share = shareSpy();
    const h = setup({ share });
    expect(await run(h.deps)).toEqual({ status: "shared" });
    expect(share).toHaveBeenCalledTimes(1);
  });

  it("includes text + url in the share payload when provided", async () => {
    const share = shareSpy();
    const h = setup({ share });
    await shareCard(
      NODE,
      {
        fileName: "card.png",
        title: "KFC",
        text: "Klaim voucher kamu",
        url: "https://wealth.test/vouchers/1",
      },
      h.deps,
    );
    expect(share.mock.calls[0]![0]).toEqual({
      files: [fakeFile("card.png")],
      title: "KFC",
      text: "Klaim voucher kamu",
      url: "https://wealth.test/vouchers/1",
    });
  });

  it("omits text/url keys when not provided", async () => {
    const share = shareSpy();
    const h = setup({ share });
    await run(h.deps, "KFC");
    const payload = share.mock.calls[0]![0] as Record<string, unknown>;
    expect("text" in payload).toBe(false);
    expect("url" in payload).toBe(false);
  });
});

// ── shareCard: download fallback paths ───────────────────────────────────────

describe("shareCard — downloading", () => {
  it("downloads when there is no Web Share API", async () => {
    const h = setup();
    const result = await run(h.deps);
    expect(result).toEqual({ status: "downloaded" });
    expect(h.download).toHaveBeenCalledWith(fakeFile("card.png"), "card.png");
  });

  it("downloads (not shares) when canShare returns false", async () => {
    const share = vi.fn(async () => {});
    const canShare = vi.fn(() => false);
    const h = setup({ share, canShare });

    const result = await run(h.deps);

    expect(result).toEqual({ status: "downloaded" });
    expect(share).not.toHaveBeenCalled();
    expect(h.download).toHaveBeenCalledTimes(1);
  });
});

// ── shareCard: cancellation is NOT an error (the reported bug) ────────────────

describe("shareCard — user cancels the share sheet", () => {
  for (const [name, make] of Object.entries(abortShapes)) {
    it(`returns "canceled" (no error, no download) for AbortError as ${name}`, async () => {
      const share = vi.fn(async () => {
        throw make();
      });
      const h = setup({ share, canShare: vi.fn(() => true) });

      const result = await run(h.deps);

      expect(result).toEqual({ status: "canceled" });
      expect(h.download).not.toHaveBeenCalled();
    });
  }
});

// ── shareCard: genuine share failures fall back to download ──────────────────

describe("shareCard — share fails for a real reason", () => {
  it("falls back to download on NotAllowedError", async () => {
    const share = vi.fn(async () => {
      throw notAllowed();
    });
    const h = setup({ share, canShare: vi.fn(() => true) });

    const result = await run(h.deps);

    expect(result).toEqual({ status: "downloaded" });
    expect(h.download).toHaveBeenCalledTimes(1);
  });

  it("falls back to download on a generic error", async () => {
    const share = vi.fn(async () => {
      throw genericError();
    });
    const h = setup({ share, canShare: vi.fn(() => true) });
    expect(await run(h.deps)).toEqual({ status: "downloaded" });
  });

  it("reports error:share only when both share AND download fail", async () => {
    const share = vi.fn(async () => {
      throw genericError();
    });
    const download = vi.fn(() => {
      throw new Error("download blocked");
    });
    const h = setup({ share, canShare: vi.fn(() => true), download });

    expect(await run(h.deps)).toEqual({ status: "error", reason: "share" });
  });
});

// ── shareCard: capture failures ──────────────────────────────────────────────

describe("shareCard — capture failures", () => {
  it("errors (capture) when capture returns null", async () => {
    const share = vi.fn(async () => {});
    const h = setup({ capture: vi.fn(async () => null), share });

    const result = await run(h.deps);

    expect(result).toEqual({ status: "error", reason: "capture" });
    expect(share).not.toHaveBeenCalled();
    expect(h.download).not.toHaveBeenCalled();
  });

  it("errors (capture) when capture returns undefined", async () => {
    const h = setup({ capture: vi.fn(async () => undefined) });
    expect(await run(h.deps)).toEqual({ status: "error", reason: "capture" });
  });

  it("errors (capture) when capture throws", async () => {
    const h = setup({
      capture: vi.fn(async () => {
        throw new Error("canvas tainted");
      }),
    });
    expect(await run(h.deps)).toEqual({ status: "error", reason: "capture" });
  });

  it("errors (capture) when makeFile throws", async () => {
    const h = setup({
      makeFile: vi.fn(() => {
        throw new Error("no File ctor");
      }),
    });
    expect(await run(h.deps)).toEqual({ status: "error", reason: "capture" });
  });
});

// ── shareCard: prepare / restore lifecycle ───────────────────────────────────

describe("shareCard — prepare/restore lifecycle", () => {
  it("calls restore exactly once, after capture and before share", async () => {
    const log: string[] = [];
    const restore = vi.fn(() => log.push("restore"));
    const prepare = vi.fn(async () => {
      log.push("prepare");
      return restore;
    });
    const capture = vi.fn(async () => {
      log.push("capture");
      return BLOB;
    });
    const share = vi.fn(async () => {
      log.push("share");
    });
    const h = setup({ prepare, capture, share, canShare: vi.fn(() => true) });

    await run(h.deps);

    expect(restore).toHaveBeenCalledTimes(1);
    expect(log).toEqual(["prepare", "capture", "restore", "share"]);
  });

  it("still restores when capture fails", async () => {
    const restore = vi.fn();
    const prepare = vi.fn(async () => restore);
    const h = setup({ prepare, capture: vi.fn(async () => null) });

    const result = await run(h.deps);

    expect(result).toEqual({ status: "error", reason: "capture" });
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it("still restores when the user cancels", async () => {
    const restore = vi.fn();
    const prepare = vi.fn(async () => restore);
    const share = vi.fn(async () => {
      throw abortShapes.domException();
    });
    const h = setup({ prepare, share, canShare: vi.fn(() => true) });

    expect(await run(h.deps)).toEqual({ status: "canceled" });
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it("treats a failing prepare as non-fatal (capture still runs)", async () => {
    const prepare = vi.fn(async () => {
      throw new Error("inline failed");
    });
    const share = vi.fn(async () => {});
    const h = setup({ prepare, share, canShare: vi.fn(() => true) });

    expect(await run(h.deps)).toEqual({ status: "shared" });
    expect(h.capture).toHaveBeenCalledTimes(1);
  });
});

// ── Chaos: every combination, and shareCard must never throw ─────────────────

describe("shareCard — chaos matrix", () => {
  const shareOutcomes = {
    none: undefined,
    resolve: () => vi.fn(async () => {}),
    abortDom: () =>
      vi.fn(async () => {
        throw abortShapes.domException();
      }),
    abortPlain: () =>
      vi.fn(async () => {
        throw abortShapes.plainObject();
      }),
    notAllowed: () =>
      vi.fn(async () => {
        throw notAllowed();
      }),
    generic: () =>
      vi.fn(async () => {
        throw genericError();
      }),
  } as const;

  const canShareValues = [undefined, true, false] as const;
  const downloadModes = ["ok", "throws"] as const;

  // Expected status given (hasShare, shareResolves?, canceled?, canShare, downloadOk).
  function expected(
    outcomeKey: keyof typeof shareOutcomes,
    canShare: boolean | undefined,
    downloadOk: boolean,
  ): { status: string; reason?: string } {
    const willTryShare = outcomeKey !== "none" && canShare !== false;
    if (willTryShare) {
      if (outcomeKey === "resolve") return { status: "shared" };
      if (outcomeKey === "abortDom" || outcomeKey === "abortPlain")
        return { status: "canceled" };
      // notAllowed / generic → fall through to download
    }
    return downloadOk
      ? { status: "downloaded" }
      : { status: "error", reason: "share" };
  }

  for (const [outcomeKey, factory] of Object.entries(shareOutcomes)) {
    for (const canShare of canShareValues) {
      for (const downloadMode of downloadModes) {
        it(`share=${outcomeKey} canShare=${String(canShare)} download=${downloadMode}`, async () => {
          const overrides: Partial<ShareCardDeps> = {};
          if (factory) overrides.share = factory();
          if (canShare !== undefined)
            overrides.canShare = vi.fn(() => canShare);
          if (downloadMode === "throws")
            overrides.download = vi.fn(() => {
              throw new Error("blocked");
            });
          const h = setup(overrides);

          const result = await run(h.deps, "Promo");

          expect(result).toEqual(
            expected(
              outcomeKey as keyof typeof shareOutcomes,
              canShare,
              downloadMode === "ok",
            ),
          );
        });
      }
    }
  }

  it("never throws even when capture, share and download all blow up", async () => {
    const h = setup({
      capture: vi.fn(async () => {
        throw new Error("x");
      }),
      share: vi.fn(async () => {
        throw new Error("y");
      }),
      download: vi.fn(() => {
        throw new Error("z");
      }),
      canShare: vi.fn(() => true),
    });
    await expect(run(h.deps)).resolves.toEqual({
      status: "error",
      reason: "capture",
    });
  });
});
