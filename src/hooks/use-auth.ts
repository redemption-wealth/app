"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";

export function useAuth() {
  const { user, authenticated, ready, login, logout } = usePrivy();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    user,
    authenticated,
    ready,
    login,
    logout: handleLogout,
    email: user?.email?.address ?? null,
    walletAddress: user?.wallet?.address ?? null,
  };
}
