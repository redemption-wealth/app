import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const ORIGINAL_FETCH = globalThis.fetch;

beforeAll(() => {
  vi.stubEnv("NEXT_PUBLIC_PRIVY_APP_ID", "test-privy-app-id");
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
  vi.stubEnv(
    "NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS",
    "0x1111111111111111111111111111111111111111",
  );
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.test");
});

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

function mockFetchOnce(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  return fetchMock;
}

describe("endpoints.listVouchers", () => {
  it("calls the list endpoint and unwraps a valid fixture", async () => {
    const fetchMock = mockFetchOnce({
      vouchers: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const { endpoints } = await import("../endpoints");
    const result = await endpoints.listVouchers({ limit: 10 });

    expect(result.vouchers).toEqual([]);
    expect(result.pagination.total).toBe(0);

    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call as [string, RequestInit | undefined];
    expect(url).toBe("https://api.example.test/api/vouchers?limit=10");
    expect(init?.method).toBe("GET");
  });

  it("throws on malformed response (schema mismatch)", async () => {
    mockFetchOnce({ vouchers: "not-an-array" });

    const { endpoints } = await import("../endpoints");
    await expect(endpoints.listVouchers()).rejects.toThrow();
  });
});

describe("endpoints.getWealthPrice", () => {
  it("parses a price response", async () => {
    mockFetchOnce({ priceIdr: 100, cached: false });

    const { endpoints } = await import("../endpoints");
    const result = await endpoints.getWealthPrice();

    expect(result.priceIdr).toBe(100);
    expect(result.cached).toBe(false);
  });
});

describe("endpoints.redeemVoucher (idempotency)", () => {
  it("returns alreadyExists=true when backend flags replay", async () => {
    const redemption = {
      id: "r1",
      userId: "u1",
      voucherId: "v1",
      wealthAmount: "10",
      priceIdrAtRedeem: 100,
      wealthPriceIdrAtRedeem: "100",
      appFeeAmount: "0.2",
      gasFeeAmount: "0.5",
      txHash: "0xabc",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      status: "confirmed",
      redeemedAt: "2026-04-17T00:00:00Z",
      confirmedAt: "2026-04-17T00:05:00Z",
      createdAt: "2026-04-17T00:00:00Z",
    };
    mockFetchOnce({ redemption, alreadyExists: true });

    const { registerAccessTokenGetter } = await import("../client");
    registerAccessTokenGetter(async () => "test-token");
    const { endpoints } = await import("../endpoints");

    const result = await endpoints.redeemVoucher("v1", {
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      wealthPriceIdr: 100,
    });

    expect(result.alreadyExists).toBe(true);
    expect(result.redemption.status).toBe("confirmed");
  });
});

describe("endpoints auth errors", () => {
  it("throws ApiError with 401 status on unauthorized", async () => {
    mockFetchOnce({ error: "unauthorized" }, 401);

    const { registerAccessTokenGetter } = await import("../client");
    registerAccessTokenGetter(async () => "bad-token");
    const { endpoints } = await import("../endpoints");
    const { ApiError } = await import("../errors");

    try {
      await endpoints.listRedemptions();
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as InstanceType<typeof ApiError>).status).toBe(401);
      expect((err as InstanceType<typeof ApiError>).isUnauthorized).toBe(true);
    }
  });
});
