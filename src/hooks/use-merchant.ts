"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

export function useMerchant(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.merchant(id ?? ""),
    queryFn: () => endpoints.getMerchant(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
