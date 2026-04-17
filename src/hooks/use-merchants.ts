"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, type PaginationParams } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

interface UseMerchantsParams extends PaginationParams {
  categoryId?: string;
  search?: string;
}

export function useMerchants(params: UseMerchantsParams = {}) {
  return useQuery({
    queryKey: queryKeys.merchants(params),
    queryFn: () => endpoints.listMerchants(params),
    staleTime: 60_000,
  });
}
