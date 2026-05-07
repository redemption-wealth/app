export const queryKeys = {
  categories: () => ["categories"] as const,
  merchants: (params?: object) => ["merchants", params ?? {}] as const,
  merchant: (id: string) => ["merchant", id] as const,
  vouchers: (params?: object) => ["vouchers", params ?? {}] as const,
  voucher: (id: string) => ["voucher", id] as const,
  redemptions: (params?: object) => ["redemptions", params ?? {}] as const,
  redemption: (id: string) => ["redemption", id] as const,
  price: () => ["price", "wealth"] as const,
} as const;
