/**
 * Single source of truth for the on-chain network the app operates on.
 *
 * The platform only ever runs on Ethereum mainnet (production) or the Sepolia
 * testnet. The network is selected via `NEXT_PUBLIC_CHAIN` (Zod-validated in
 * `env.ts`: a `mainnet | sepolia` enum that defaults to `mainnet` and throws
 * on any invalid value).
 *
 * All explorer URLs and chain/wagmi config MUST be derived from here — never
 * hardcode an explorer base URL or chain object in a component.
 */

import { mainnet, sepolia } from "wagmi/chains";
import { env } from "@/lib/env";

const NETWORKS = {
  mainnet: {
    chain: mainnet,
    explorerBaseUrl: "https://etherscan.io",
    explorerName: "Etherscan",
  },
  sepolia: {
    chain: sepolia,
    explorerBaseUrl: "https://sepolia.etherscan.io",
    explorerName: "Sepolia Etherscan",
  },
} as const;

export const NETWORK = env.NEXT_PUBLIC_CHAIN;
export const CHAIN = NETWORKS[NETWORK];

/** The wagmi/viem chain object for the selected network. */
export const targetChain = CHAIN.chain;
/** Numeric chain id for the selected network (1 or 11155111). */
export const TARGET_CHAIN_ID = CHAIN.chain.id;

/** Block-explorer URL for a transaction hash. */
export function explorerTxUrl(txHash: string): string {
  return `${CHAIN.explorerBaseUrl}/tx/${txHash}`;
}

/** Block-explorer URL for an address. */
export function explorerAddressUrl(address: string): string {
  return `${CHAIN.explorerBaseUrl}/address/${address}`;
}
