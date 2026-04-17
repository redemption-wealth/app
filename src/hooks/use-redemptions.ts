"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, type PaginationParams } from "@/lib/api/endpoints";
import type { RedemptionStatus } from "@/lib/schemas/redemption";
import { queryKeys } from "./query-keys";

export interface UseRedemptionsParams extends PaginationParams {
  status?: RedemptionStatus;
  enabled?: boolean;
}

export function useRedemptions(params: UseRedemptionsParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: queryKeys.redemptions(queryParams),
    queryFn: () => endpoints.listRedemptions(queryParams),
    enabled,
    staleTime: 30_000,
  });
}
