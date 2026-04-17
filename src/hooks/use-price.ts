"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

export function usePrice() {
  return useQuery({
    queryKey: queryKeys.price(),
    queryFn: () => endpoints.getWealthPrice(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
