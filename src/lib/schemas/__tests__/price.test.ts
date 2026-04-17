import { describe, expect, it } from "vitest";
import { priceResponseSchema } from "../price";

describe("priceResponseSchema", () => {
  it("parses a fresh price response", () => {
    const response = { priceIdr: 100, cached: false };
    expect(() => priceResponseSchema.parse(response)).not.toThrow();
  });

  it("parses a cached+stale response", () => {
    const response = { priceIdr: 100, cached: true, stale: true };
    expect(() => priceResponseSchema.parse(response)).not.toThrow();
  });

  it("rejects non-positive price", () => {
    expect(() =>
      priceResponseSchema.parse({ priceIdr: 0, cached: false }),
    ).toThrow();
  });
});
