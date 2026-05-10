import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/hooks/query-keys";
import { MarketplaceInteractive } from "./marketplace-client";

const PAGE_SIZE = 24;

export default async function HomePage() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient
      .prefetchInfiniteQuery({
        queryKey: queryKeys.vouchers({
          scope: "marketplace",
          limit: PAGE_SIZE,
        }),
        queryFn: () => endpoints.listVouchers({ page: 1, limit: PAGE_SIZE }),
        initialPageParam: 1,
      })
      .catch((error) => {
        // Don't block render if BE blips; client retries.
        console.error("SSR prefetch vouchers failed:", error);
      }),
    queryClient
      .prefetchQuery({
        queryKey: queryKeys.merchants({ limit: 100 }),
        queryFn: () => endpoints.listMerchants({ limit: 100 }),
      })
      .catch((error) => {
        console.error("SSR prefetch merchants failed:", error);
      }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MarketplaceInteractive />
    </HydrationBoundary>
  );
}
