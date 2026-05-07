import { describe, expect, it } from "vitest";
import { deriveAuthStatus } from "@/hooks/use-require-auth";

describe("deriveAuthStatus", () => {
  it("returns 'authenticated' when ready and authenticated", () => {
    expect(
      deriveAuthStatus({ ready: true, authenticated: true, elapsedMs: 0 }),
    ).toBe("authenticated");
  });

  it("returns 'redirecting' when ready but unauthenticated", () => {
    expect(
      deriveAuthStatus({ ready: true, authenticated: false, elapsedMs: 0 }),
    ).toBe("redirecting");
  });

  it("returns 'loading' while not ready and within timeout", () => {
    expect(
      deriveAuthStatus({ ready: false, authenticated: false, elapsedMs: 0 }),
    ).toBe("loading");
    expect(
      deriveAuthStatus({ ready: false, authenticated: false, elapsedMs: 7999 }),
    ).toBe("loading");
  });

  it("returns 'timeout' when not ready and elapsed >= 8000ms", () => {
    expect(
      deriveAuthStatus({ ready: false, authenticated: false, elapsedMs: 8000 }),
    ).toBe("timeout");
    expect(
      deriveAuthStatus({
        ready: false,
        authenticated: false,
        elapsedMs: 12_000,
      }),
    ).toBe("timeout");
  });

  it("does not flicker back to redirecting once authenticated", () => {
    const seq: Array<Parameters<typeof deriveAuthStatus>[0]> = [
      { ready: false, authenticated: false, elapsedMs: 100 },
      { ready: true, authenticated: true, elapsedMs: 200 },
      { ready: true, authenticated: true, elapsedMs: 300 },
    ];
    expect(seq.map(deriveAuthStatus)).toEqual([
      "loading",
      "authenticated",
      "authenticated",
    ]);
  });
});
