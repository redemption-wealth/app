"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSyncUser } from "@/hooks/use-sync-user";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authenticated, ready } = useAuth();
  const router = useRouter();
  const {
    mutate: syncUser,
    isPending: isSyncing,
    isSuccess: isSynced,
    isError: syncFailed,
  } = useSyncUser();
  const syncStartedRef = useRef(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/auth/login");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (ready && authenticated && !syncStartedRef.current) {
      syncStartedRef.current = true;
      syncUser();
    }
  }, [ready, authenticated, syncUser]);

  if (!ready || (authenticated && isSyncing && !isSynced && !syncFailed)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
