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
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[#ececec] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#dcdcdc] hover:shadow-sm"
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
        <h4 className="font-display line-clamp-1 text-sm font-bold text-[#171717]">
          {merchant.name}
        </h4>
        {merchant.category?.name ? (
          <p className="line-clamp-1 text-xs text-[#525252]">
            {merchant.category.name}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
