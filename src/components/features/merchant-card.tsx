"use client";

import Link from "next/link";
import type { Merchant } from "@/lib/schemas/merchant";

interface MerchantCardProps {
  merchant: Merchant;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  return (
    <Link
      href={`/merchants/${merchant.id}`}
      className="bg-surface-container-lowest hover:bg-surface-container flex flex-col gap-2 rounded-[var(--radius-lg)] p-4 transition-colors"
    >
      <div className="bg-surface-container flex aspect-square w-full items-center justify-center overflow-hidden rounded-[var(--radius-md)]">
        {merchant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={merchant.logoUrl}
            alt={merchant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-display text-on-surface-variant text-3xl font-bold">
            {merchant.name.charAt(0)}
          </span>
        )}
      </div>
      <div>
        <h4 className="font-display line-clamp-1 text-sm font-bold">
          {merchant.name}
        </h4>
        {merchant.category?.name ? (
          <p className="text-on-surface-variant line-clamp-1 text-xs">
            {merchant.category.name}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
