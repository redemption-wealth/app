"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, type PaginationParams } from "@/lib/api/endpoints";
import type { TransactionType } from "@/lib/schemas/transaction";
import { queryKeys } from "./query-keys";

interface UseTransactionsParams extends PaginationParams {
  type?: TransactionType;
  enabled?: boolean;
}

export function useTransactions(params: UseTransactionsParams = {}) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: queryKeys.transactions(queryParams),
    queryFn: () => endpoints.listTransactions(queryParams),
    enabled,
    staleTime: 30_000,
  });
}
