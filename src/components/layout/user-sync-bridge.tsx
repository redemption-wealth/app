"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSyncUser } from "@/hooks/use-sync-user";
import { useUserSync } from "@/stores/user-sync";

export function UserSyncBridge() {
  const { ready, authenticated, user } = useAuth();
  const { mutate: syncUser } = useSyncUser();
  const markSynced = useUserSync((s) => s.markSynced);
  const resetSync = useUserSync((s) => s.reset);
  const lastSyncedUserIdRef = useRef<string | null>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      if (lastSyncedUserIdRef.current !== null) {
        lastSyncedUserIdRef.current = null;
        resetSync();
      }
      return;
    }

    if (userId && userId !== lastSyncedUserIdRef.current) {
      lastSyncedUserIdRef.current = userId;
      syncUser(undefined, {
        onSuccess: () => markSynced(userId),
        // Treat sync failure as best-effort: if the BE endpoint is missing or
        // returns an error, still mark synced so the redeem CTA isn't stuck on
        // "Login untuk Redeem" forever. The actual /redeem call will surface a
        // real BE error if the user record is genuinely missing.
        onError: (err) => {
          console.warn("[user-sync] failed; proceeding optimistically:", err);
          markSynced(userId);
        },
      });
    }
  }, [ready, authenticated, userId, syncUser, markSynced, resetSync]);

  return null;
}
