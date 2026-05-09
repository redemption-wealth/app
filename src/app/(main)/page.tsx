import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/hooks/query-keys";
import { voucherListResponseSchema } from "@/lib/schemas/voucher";
import { HomeInteractive } from "./home-client";

// SSR fetch directly to production backend (bypasses localhost proxy)
const BACKEND_URL = "https://backend-wealthcrypto-fund.vercel.app";

export default async function HomePage() {
  const queryClient = getQueryClient();

  // Server-side fetch directly to backend (not through proxy)
  try {
    const response = await fetch(`${BACKEND_URL}/api/vouchers?limit=6`, {
      cache: "no-store",
    });
    const data = await response.json();
    const parsed = voucherListResponseSchema.parse(data);

    queryClient.setQueryData(queryKeys.vouchers({ limit: 6 }), parsed);
  } catch (error) {
    console.error("SSR prefetch vouchers failed:", error);
    // Don't block rendering on error - client will retry
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeInteractive />
    </HydrationBoundary>
  );
}
