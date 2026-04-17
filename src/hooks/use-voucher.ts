"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

export function useVoucher(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.voucher(id ?? ""),
    queryFn: () => endpoints.getVoucher(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
