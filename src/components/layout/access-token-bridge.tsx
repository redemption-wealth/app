"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { registerAccessTokenGetter } from "@/lib/api/client";

export function AccessTokenBridge() {
  const { getAccessToken, authenticated } = usePrivy();

  useEffect(() => {
    registerAccessTokenGetter(async () => {
      if (!authenticated) return null;
      try {
        return await getAccessToken();
      } catch {
        return null;
      }
    });
  }, [getAccessToken, authenticated]);

  return null;
}
