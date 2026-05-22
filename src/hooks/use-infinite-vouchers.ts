"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "@/hooks/query-keys";
import type { Voucher } from "@/lib/schemas/voucher";

const PAGE_SIZE = 24;

export function useInfiniteVouchers() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.vouchers({ scope: "marketplace", limit: PAGE_SIZE }),
    queryFn: ({ pageParam }) =>
      endpoints.listVouchers({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const vouchers = useMemo<Voucher[]>(() => {
    if (!query.data) return [];
    const seen = new Set<string>();
    const out: Voucher[] = [];
    for (const page of query.data.pages) {
      for (const v of page.vouchers) {
        if (seen.has(v.id)) continue;
        seen.add(v.id);
        out.push(v);
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
    vouchers,
    isLoading: query.isLoading,
    isFetching: query.isFetching || query.isFetchingNextPage,
    isError: query.isError,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage,
  };
}
