"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "redirecting"
  | "timeout";

const READY_TIMEOUT_MS = 8000;

export function deriveAuthStatus(input: {
  ready: boolean;
  authenticated: boolean;
  elapsedMs: number;
}): AuthStatus {
  const { ready, authenticated, elapsedMs } = input;
  if (ready && authenticated) return "authenticated";
  if (ready && !authenticated) return "redirecting";
  if (!ready && elapsedMs >= READY_TIMEOUT_MS) return "timeout";
  return "loading";
}

export function useRequireAuth(): AuthStatus {
  const router = useRouter();
  const { ready, authenticated } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [ready]);

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/");
    }
  }, [ready, authenticated, router]);

  return deriveAuthStatus({
    ready,
    authenticated,
    elapsedMs: timedOut ? READY_TIMEOUT_MS : 0,
  });
}
