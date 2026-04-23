import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { env } from "@/lib/env";

const isTestnet = env.NEXT_PUBLIC_CHAIN === "sepolia";

export const targetChain = isTestnet ? sepolia : mainnet;

export const wagmiConfig = isTestnet
  ? createConfig({
      chains: [sepolia],
      transports: { [sepolia.id]: http(env.NEXT_PUBLIC_ALCHEMY_RPC_URL) },
    })
  : createConfig({
      chains: [mainnet],
      transports: { [mainnet.id]: http(env.NEXT_PUBLIC_ALCHEMY_RPC_URL) },
    });

export const TARGET_CHAIN_ID = targetChain.id;
