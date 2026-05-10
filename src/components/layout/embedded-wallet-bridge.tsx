"use client";

import { useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useEffect, useRef } from "react";

// Ensures wagmi signs through Privy's embedded wallet, not any injected
// browser wallet (MetaMask, Rabby, ...). Privy creates the embedded wallet
// on login, but wagmi's "active" connector is whatever connected first —
// if the user happens to have an injected wallet installed, the redeem
// signature prompt would pop up there instead. We pin the embedded wallet
// as soon as it appears in the connected list and re-pin if it changes
// (e.g. after a fresh login).
export function EmbeddedWalletBridge() {
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const lastPinnedRef = useRef<string | null>(null);

  useEffect(() => {
    const embedded = wallets.find((w) => w.walletClientType === "privy");
    if (!embedded) {
      lastPinnedRef.current = null;
      return;
    }
    if (lastPinnedRef.current === embedded.address) return;
    lastPinnedRef.current = embedded.address;
    void setActiveWallet(embedded);
  }, [wallets, setActiveWallet]);

  return null;
}
