"use client";

import { useCreateWallet, useWallets } from "@privy-io/react-auth";
import { useCallback, useEffect, useRef } from "react";

function hasPrivyEmbeddedWallet(
  wallets: ReturnType<typeof useWallets>["wallets"],
): boolean {
  return wallets.some((w) => w.walletClientType === "privy");
}

export interface WalletHealth {
  isHealthy: () => boolean;
  recover: (timeoutMs?: number) => Promise<boolean>;
}

export function useWalletHealth(): WalletHealth {
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const walletsRef = useRef(wallets);
  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  const isHealthy = useCallback(
    () => hasPrivyEmbeddedWallet(walletsRef.current),
    [],
  );

  const recover = useCallback(
    async (timeoutMs = 10_000): Promise<boolean> => {
      if (isHealthy()) return true;
      try {
        await Promise.race([
          createWallet(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("wallet recovery timeout")),
              timeoutMs,
            ),
          ),
        ]);
        return hasPrivyEmbeddedWallet(walletsRef.current);
      } catch {
        return false;
      }
    },
    [createWallet, isHealthy],
  );

  return { isHealthy, recover };
}
