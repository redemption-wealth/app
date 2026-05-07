import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { endpoints } from "@/lib/api/endpoints";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/hooks/query-keys";
import { ApiError } from "@/lib/api/errors";
import { VoucherDetailInteractive } from "./voucher-detail-client";

const fetchVoucher = cache(async (id: string) => {
  try {
    return await endpoints.getVoucher(id);
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
  const data = await fetchVoucher(id);
  const voucher = data?.voucher;
  if (!voucher) {
    return { title: "Voucher tidak ditemukan — Wealth Redemption" };
  }
  const merchantName = voucher.merchant?.name;
  const title = merchantName
    ? `${voucher.title} · ${merchantName} — Wealth Redemption`
    : `${voucher.title} — Wealth Redemption`;
  const description =
    voucher.description ??
    (merchantName
      ? `Redeem ${voucher.title} dari ${merchantName} dengan $WEALTH.`
      : `Redeem ${voucher.title} dengan $WEALTH.`);
  const images = [{ url: "/image/w-logo.png", alt: voucher.title }];
  return {
    title,
    description,
    openGraph: { title, description, images },
  };
}

export default async function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchVoucher(id);
  if (!data) notFound();

  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.voucher(id), data);

  await queryClient.prefetchQuery({
    queryKey: queryKeys.price(),
    queryFn: () => endpoints.getWealthPrice(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VoucherDetailInteractive id={id} />
    </HydrationBoundary>
  );
}
