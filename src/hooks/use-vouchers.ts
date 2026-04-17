"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, type PaginationParams } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

interface UseVouchersParams extends PaginationParams {
  merchantId?: string;
  category?: string;
  search?: string;
}

export function useVouchers(params: UseVouchersParams = {}) {
  return useQuery({
    queryKey: queryKeys.vouchers(params),
    queryFn: () => endpoints.listVouchers(params),
    staleTime: 30_000,
  });
}
