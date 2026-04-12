"use client";

import { usePrivy, useLoginWithEmail } from "@privy-io/react-auth";
import { useCallback, useEffect, useRef } from "react";

export function useAuth() {
  const { user, authenticated, ready, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const syncedRef = useRef(false);

  // Sync user to our database after login
  useEffect(() => {
    if (!authenticated || !user || syncedRef.current) return;

    const syncUser = async () => {
      try {
        const token = localStorage.getItem("privy:token");
        if (!token) return;

        await fetch("/api/auth/user-sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        syncedRef.current = true;
      } catch {
        // Silently fail — user can still browse
      }
    };

    syncUser();
  }, [authenticated, user]);

  const handleLogout = useCallback(async () => {
    syncedRef.current = false;
    await logout();
  }, [logout]);

  return {
    user,
    authenticated,
    ready,
    sendCode,
    loginWithCode,
    logout: handleLogout,
    email: user?.email?.address ?? null,
    walletAddress: user?.wallet?.address ?? null,
  };
}
