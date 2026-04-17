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
      className="bg-surface-container-lowest rounded-[var(--radius-lg)] p-4 flex flex-col gap-2 hover:bg-surface-container transition-colors"
    >
      <div className="aspect-square w-full rounded-[var(--radius-md)] bg-surface-container overflow-hidden flex items-center justify-center">
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
      <div>
        <h4 className="font-display text-sm font-bold line-clamp-1">
          {merchant.name}
        </h4>
        {merchant.category?.name ? (
          <p className="text-xs text-on-surface-variant line-clamp-1">
            {merchant.category.name}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
