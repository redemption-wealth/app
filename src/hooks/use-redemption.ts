"use client";

import { useQuery, type Query } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import type { RedemptionDetailResponse } from "@/lib/schemas/redemption";
import { queryKeys } from "./query-keys";

type RefetchIntervalFn = (
  query: Query<RedemptionDetailResponse>,
) => number | false | undefined;

interface UseRedemptionOptions {
  refetchInterval?: number | false | RefetchIntervalFn;
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
    refetchOnWindowFocus: true,
    // staleTime 0 so every refocus refetches immediately (used/redeemed status
    // can change while the tab is backgrounded — e.g. the merchant scans it).
    staleTime: 0,
  });
}
