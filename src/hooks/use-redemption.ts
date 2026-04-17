"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

interface UseRedemptionOptions {
  refetchInterval?: number | false;
  enabled?: boolean;
}

export function useRedemption(
  id: string | undefined,
  options: UseRedemptionOptions = {},
) {
  const { refetchInterval = false, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.redemption(id ?? ""),
    queryFn: () => endpoints.getRedemption(id as string),
    enabled: enabled && Boolean(id),
    refetchInterval,
    staleTime: 10_000,
  });
}
