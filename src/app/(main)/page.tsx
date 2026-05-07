import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/hooks/query-keys";
import { HomeInteractive } from "./home-client";

export default async function HomePage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.vouchers({ limit: 6 }),
    queryFn: () => endpoints.listVouchers({ limit: 6 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeInteractive />
    </HydrationBoundary>
  );
}
