import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/hooks/query-keys";
import { MerchantsListInteractive } from "./merchants-client";

export const metadata: Metadata = {
  title: "Merchant — Wealth Redemption",
  description:
    "Jelajahi merchant yang menerima $WEALTH dan temukan voucher favoritmu.",
  openGraph: {
    title: "Merchant — Wealth Redemption",
    description:
      "Jelajahi merchant yang menerima $WEALTH dan temukan voucher favoritmu.",
  },
};

export default async function MerchantsPage() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories(),
      queryFn: () => endpoints.listCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.merchants({ limit: 24 }),
      queryFn: () => endpoints.listMerchants({ limit: 24 }),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.vouchers({ limit: 100 }),
      queryFn: () => endpoints.listVouchers({ limit: 100 }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MerchantsListInteractive />
    </HydrationBoundary>
  );
}
