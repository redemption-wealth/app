import { describe, expect, it } from "vitest";
import { deriveRedeemState } from "@/lib/voucher-redeem-state";

const REQ = 10n ** 18n;

describe("deriveRedeemState", () => {
  it("returns 'unauth' when not authenticated", () => {
    expect(
      deriveRedeemState({
        authenticated: false,
        userSynced: false,
        onWrongChain: false,
        rawBalance: REQ,
        requiredAmount: REQ,
      }),
    ).toBe("unauth");
  });

  it("returns 'unauth' when authenticated but sync still pending", () => {
    expect(
      deriveRedeemState({
        authenticated: true,
        userSynced: false,
        onWrongChain: false,
        rawBalance: REQ,
        requiredAmount: REQ,
      }),
    ).toBe("unauth");
  });

  it("returns 'wrong-chain' before checking balance (precedence)", () => {
    expect(
      deriveRedeemState({
        authenticated: true,
        userSynced: true,
        onWrongChain: true,
        rawBalance: 0n,
        requiredAmount: REQ,
      }),
    ).toBe("wrong-chain");
  });

  it("returns 'loading' when balance still resolving", () => {
    expect(
      deriveRedeemState({
        authenticated: true,
        userSynced: true,
        onWrongChain: false,
        rawBalance: undefined,
        requiredAmount: REQ,
      }),
    ).toBe("loading");
  });

  it("returns 'loading' when requiredAmount unknown (price loading)", () => {
    expect(
      deriveRedeemState({
        authenticated: true,
        userSynced: true,
        onWrongChain: false,
        rawBalance: REQ,
        requiredAmount: null,
      }),
    ).toBe("loading");
  });

  it("returns 'insufficient' when balance below required", () => {
    expect(
      deriveRedeemState({
        authenticated: true,
        userSynced: true,
        onWrongChain: false,
        rawBalance: REQ - 1n,
        requiredAmount: REQ,
      }),
    ).toBe("insufficient");
  });

  it("returns 'redeem' when all checks pass", () => {
    expect(
      deriveRedeemState({
        authenticated: true,
        userSynced: true,
        onWrongChain: false,
        rawBalance: REQ,
        requiredAmount: REQ,
      }),
    ).toBe("redeem");
    expect(
      deriveRedeemState({
        authenticated: true,
        userSynced: true,
        onWrongChain: false,
        rawBalance: REQ * 2n,
        requiredAmount: REQ,
      }),
    ).toBe("redeem");
  });
});
