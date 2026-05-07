import { describe, expect, it } from "vitest";
import { shouldShowWelcomeSheet } from "@/lib/welcome-trigger";

const baseInput = {
  ready: true,
  authenticated: true,
  balanceIsSuccess: true,
  rawBalance: 0n as bigint | undefined,
  redemptionsIsSuccess: true,
  redemptionTotal: 0,
  flagSet: false,
};

describe("shouldShowWelcomeSheet", () => {
  it("returns true when all conditions are met", () => {
    expect(shouldShowWelcomeSheet(baseInput)).toBe(true);
  });

  it("returns false when balance query is still loading", () => {
    expect(
      shouldShowWelcomeSheet({ ...baseInput, balanceIsSuccess: false }),
    ).toBe(false);
  });

  it("returns false when redemptions query is still loading", () => {
    expect(
      shouldShowWelcomeSheet({ ...baseInput, redemptionsIsSuccess: false }),
    ).toBe(false);
  });

  it("returns false when flagSet is true", () => {
    expect(shouldShowWelcomeSheet({ ...baseInput, flagSet: true })).toBe(false);
  });

  it("returns false when balance > 0", () => {
    expect(
      shouldShowWelcomeSheet({ ...baseInput, rawBalance: 10n ** 18n }),
    ).toBe(false);
  });

  it("returns false when user has redemptions", () => {
    expect(shouldShowWelcomeSheet({ ...baseInput, redemptionTotal: 1 })).toBe(
      false,
    );
  });

  it("returns false when not authenticated", () => {
    expect(shouldShowWelcomeSheet({ ...baseInput, authenticated: false })).toBe(
      false,
    );
  });

  it("returns false when not ready", () => {
    expect(shouldShowWelcomeSheet({ ...baseInput, ready: false })).toBe(false);
  });

  it("returns false when balance is undefined (not yet resolved)", () => {
    expect(
      shouldShowWelcomeSheet({ ...baseInput, rawBalance: undefined }),
    ).toBe(false);
  });
});
