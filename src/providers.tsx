"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { env } from "@/lib/env";
import { wagmiConfig, targetChain } from "@/lib/wagmi";
import { AccessTokenBridge } from "@/components/layout/access-token-bridge";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

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
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
