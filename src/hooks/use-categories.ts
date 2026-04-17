"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./query-keys";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => endpoints.listCategories(),
    staleTime: 5 * 60_000,
  });
}
