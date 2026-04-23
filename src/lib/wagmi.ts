import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { env } from "@/lib/env";

export const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
  },
});

export const TARGET_CHAIN_ID = mainnet.id;
