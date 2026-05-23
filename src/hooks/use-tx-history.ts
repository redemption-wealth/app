"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  redemptionToHistoryEntry,
  type HistoryEntry,
} from "@/lib/schemas/history-entry";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "@/hooks/query-keys";
import type { RedemptionStatus } from "@/lib/schemas/redemption";

const PAGE_SIZE = 20;

interface UseTxHistoryArgs {
  status?: RedemptionStatus;
  enabled?: boolean;
}

export function useTxHistory({
  status,
  enabled = true,
}: UseTxHistoryArgs = {}) {
  const filterKey = status ?? "all";

  const query = useInfiniteQuery({
    queryKey: queryKeys.redemptions({ scope: "tx-history", filterKey }),
    queryFn: ({ pageParam }) => {
      const params: { page: number; limit: number; status?: RedemptionStatus } =
        {
          page: pageParam,
          limit: PAGE_SIZE,
        };
      if (status) params.status = status;
      return endpoints.listRedemptions(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled,
    // Pending redemptions confirm/fail server-side (webhook or reconcile), so
    // poll while any entry is still pending and refetch on focus to keep the
    // list status truthful without the user opening the QR detail.
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.pages.some((p) =>
        p.redemptions.some((r) => r.status === "pending"),
      )
        ? 15_000
        : false,
  });

  const entries = useMemo<HistoryEntry[]>(() => {
    if (!query.data) return [];
    const seen = new Set<string>();
    const out: HistoryEntry[] = [];
    for (const page of query.data.pages) {
      for (const r of page.redemptions) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(redemptionToHistoryEntry(r));
      }
    }
    return out;
  }, [query.data]);

  const fetchNextPage = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    entries,
    isLoading: query.isLoading,
    isFetching: query.isFetching || query.isFetchingNextPage,
    isError: query.isError,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage,
  };
}
