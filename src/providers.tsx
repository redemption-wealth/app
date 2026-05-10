"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { getQueryClient } from "@/lib/get-query-client";
import { wagmiConfig, targetChain } from "@/lib/wagmi";
import { AccessTokenBridge } from "@/components/layout/access-token-bridge";
import { EmbeddedWalletBridge } from "@/components/layout/embedded-wallet-bridge";
import { UserSyncBridge } from "@/components/layout/user-sync-bridge";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <PrivyProvider
      appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#006c48",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
        /* eslint-disable @typescript-eslint/no-explicit-any */
        defaultChain: targetChain as any,
        supportedChains: [targetChain] as any,
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <AccessTokenBridge />
          <UserSyncBridge />
          <EmbeddedWalletBridge />
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
