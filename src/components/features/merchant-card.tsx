"use client";

import Link from "next/link";
import type { Merchant } from "@/lib/schemas/merchant";
import { CategoryTile } from "@/components/shared/category-tile";

interface MerchantCardProps {
  merchant: Merchant;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  return (
    <Link
      href={`/merchants/${merchant.id}`}
      className="border-border hover:border-surface-container-highest flex flex-col gap-2 rounded-[var(--radius-lg)] border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)]">
        {merchant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={merchant.logoUrl}
            alt={merchant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <CategoryTile name={merchant.name} size={80} />
        )}
      </div>
      <div>
        <h4 className="font-display text-on-surface line-clamp-1 text-sm font-bold capitalize">
          {merchant.name}
        </h4>
        {merchant.category?.name ? (
          <p className="text-on-surface-variant line-clamp-1 text-xs capitalize">
            {merchant.category.name}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
