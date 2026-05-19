import { describe, it, expect, afterEach, vi } from "vitest";

// app/chain.ts derives the network from env (Zod-validated in env.ts) at
// module load, so each case sets a full valid env, resets the module
// registry, then re-imports.
const BASE_ENV = {
  NEXT_PUBLIC_PRIVY_APP_ID: "test-privy",
  NEXT_PUBLIC_API_BASE_URL: "https://api.test",
  NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS:
    "0x1111111111111111111111111111111111111111",
  NEXT_PUBLIC_APP_URL: "https://app.test",
};

async function loadChain(chain?: string) {
  vi.resetModules();
  for (const [k, v] of Object.entries(BASE_ENV)) vi.stubEnv(k, v);
  if (chain === undefined) vi.stubEnv("NEXT_PUBLIC_CHAIN", "");
  else vi.stubEnv("NEXT_PUBLIC_CHAIN", chain);
  return import("@/lib/chain");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("app chain config (NEXT_PUBLIC_CHAIN)", () => {
  it("positive: mainnet → Etherscan, chainId 1", async () => {
    const c = await loadChain("mainnet");
    expect(c.NETWORK).toBe("mainnet");
    expect(c.TARGET_CHAIN_ID).toBe(1);
    expect(c.CHAIN.explorerName).toBe("Etherscan");
    expect(c.explorerTxUrl("0xabc")).toBe("https://etherscan.io/tx/0xabc");
  });

  it("positive: sepolia → sepolia.etherscan, chainId 11155111", async () => {
    const c = await loadChain("sepolia");
    expect(c.NETWORK).toBe("sepolia");
    expect(c.TARGET_CHAIN_ID).toBe(11155111);
    expect(c.explorerAddressUrl("0xdead")).toBe(
      "https://sepolia.etherscan.io/address/0xdead",
    );
  });

  it("edge: unset NEXT_PUBLIC_CHAIN defaults to mainnet (Zod default)", async () => {
    const c = await loadChain(undefined);
    expect(c.NETWORK).toBe("mainnet");
  });

  it("negative: invalid value rejected by env Zod validation", async () => {
    await expect(loadChain("polygon")).rejects.toThrow(
      /Invalid environment variables|NEXT_PUBLIC_CHAIN/,
    );
  });

  it("targetChain object matches selected network id", async () => {
    const c = await loadChain("sepolia");
    expect(c.targetChain.id).toBe(c.TARGET_CHAIN_ID);
  });
});
