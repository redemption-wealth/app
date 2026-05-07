import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/hooks/query-keys";
import { ApiError } from "@/lib/api/errors";
import { MerchantDetailInteractive } from "./merchant-detail-client";

const fetchMerchant = cache(async (id: string) => {
  try {
    return await endpoints.getMerchant(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchMerchant(id);
  const merchant = data?.merchant;
  if (!merchant) {
    return { title: "Merchant tidak ditemukan — Wealth Redemption" };
  }
  const title = `${merchant.name} — Wealth Redemption`;
  const description =
    merchant.description ??
    `Voucher dari ${merchant.name} di marketplace Wealth.`;
  const images = merchant.logoUrl
    ? [{ url: merchant.logoUrl, alt: merchant.name }]
    : [{ url: "/image/w-logo.png", alt: "Wealth Redemption" }];
  return {
    title,
    description,
    openGraph: { title, description, images },
  };
}

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchMerchant(id);
  if (!data) notFound();

  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.merchant(id), data);

  await queryClient.prefetchQuery({
    queryKey: queryKeys.vouchers({ merchantId: id, limit: 24 }),
    queryFn: () => endpoints.listVouchers({ merchantId: id, limit: 24 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MerchantDetailInteractive id={id} />
    </HydrationBoundary>
  );
}
