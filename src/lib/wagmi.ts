import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { env } from "@/lib/env";
import { NETWORK, targetChain, TARGET_CHAIN_ID } from "@/lib/chain";

// Network selection + explorer config live in `@/lib/chain` (single source of
// truth). This module only builds the wagmi config. The branch keeps the
// `transports` computed key type-safe (one chain id per config).
export const wagmiConfig =
  NETWORK === "sepolia"
    ? createConfig({
        chains: [sepolia],
        transports: { [sepolia.id]: http(env.NEXT_PUBLIC_ALCHEMY_RPC_URL) },
      })
    : createConfig({
        chains: [mainnet],
        transports: { [mainnet.id]: http(env.NEXT_PUBLIC_ALCHEMY_RPC_URL) },
      });

// Re-exported for backward compatibility with existing importers.
export { targetChain, TARGET_CHAIN_ID };
