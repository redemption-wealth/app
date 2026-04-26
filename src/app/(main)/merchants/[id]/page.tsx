"use client";

import Link from "next/link";
import { use } from "react";
import { VoucherCard } from "@/components/features/voucher-card";
import { useMerchant } from "@/hooks/use-merchant";
import { useVouchers } from "@/hooks/use-vouchers";

export default function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: merchantData,
    isLoading: merchantLoading,
    error: merchantError,
  } = useMerchant(id);
  const {
    data: voucherData,
    isLoading: vouchersLoading,
    error: vouchersError,
    refetch,
  } = useVouchers({ merchantId: id, limit: 24 });

  const merchant = merchantData?.merchant;
  const vouchers = voucherData?.vouchers ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:max-w-4xl">
      <Link
        href="/merchants"
        className="text-primary inline-flex items-center gap-1 text-sm font-semibold"
      >
        ← Kembali
      </Link>

      {merchantLoading ? (
        <div className="h-48 animate-pulse rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6" />
      ) : merchantError || !merchant ? (
        <div className="rounded-[var(--radius-lg)] bg-[#fee2e2] p-4 text-sm text-[#b91c1c]">
          Gagal memuat merchant.
        </div>
      ) : (
        <section className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[#f5f5f4]">
            {merchant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={merchant.logoUrl}
                alt={merchant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display text-3xl font-bold text-[#525252]">
                {merchant.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-[#171717]">
              {merchant.name}
            </h1>
            {merchant.category?.name ? (
              <p className="mt-1 text-xs text-[#525252]">
                {merchant.category.name}
              </p>
            ) : null}
            {merchant.description ? (
              <p className="mt-2 text-sm text-[#525252]">
                {merchant.description}
              </p>
            ) : null}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[#171717]">
          Voucher
        </h2>
        {vouchersLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-6"
              />
            ))}
          </div>
        ) : vouchersError ? (
          <div className="flex items-center justify-between rounded-[var(--radius-lg)] bg-[#fee2e2] p-4 text-sm text-[#b91c1c]">
            <span>Gagal memuat voucher.</span>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-8 text-center">
            <p className="text-sm text-[#525252]">
              Belum ada voucher untuk merchant ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {vouchers.map((v) => (
              <VoucherCard key={v.id} voucher={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
