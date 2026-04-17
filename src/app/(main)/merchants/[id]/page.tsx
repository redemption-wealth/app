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
    <div className="max-w-2xl mx-auto md:max-w-4xl space-y-6">
      <Link
        href="/merchants"
        className="text-sm text-primary font-semibold inline-flex items-center gap-1"
      >
        ← Kembali
      </Link>

      {merchantLoading ? (
        <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-48 animate-pulse" />
      ) : merchantError || !merchant ? (
        <div className="bg-error-container text-on-error-container rounded-[var(--radius-md)] p-4 text-sm">
          Gagal memuat merchant.
        </div>
      ) : (
        <section className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 flex gap-4 items-start">
          <div className="w-20 h-20 rounded-[var(--radius-md)] bg-surface-container overflow-hidden flex items-center justify-center shrink-0">
            {merchant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={merchant.logoUrl}
                alt={merchant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display text-3xl font-bold text-on-surface-variant">
                {merchant.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold">{merchant.name}</h1>
            {merchant.category?.name ? (
              <p className="text-xs text-on-surface-variant mt-1">
                {merchant.category.name}
              </p>
            ) : null}
            {merchant.description ? (
              <p className="text-sm text-on-surface-variant mt-2">
                {merchant.description}
              </p>
            ) : null}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Voucher</h2>
        {vouchersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-6 h-32 animate-pulse"
              />
            ))}
          </div>
        ) : vouchersError ? (
          <div className="bg-error-container text-on-error-container rounded-[var(--radius-md)] p-4 text-sm flex items-center justify-between">
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
          <div className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Belum ada voucher untuk merchant ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map((v) => (
              <VoucherCard key={v.id} voucher={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
