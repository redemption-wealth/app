export const queryKeys = {
  categories: () => ["categories"] as const,
  merchants: (params?: Record<string, unknown>) =>
    ["merchants", params ?? {}] as const,
  merchant: (id: string) => ["merchant", id] as const,
  vouchers: (params?: Record<string, unknown>) =>
    ["vouchers", params ?? {}] as const,
  voucher: (id: string) => ["voucher", id] as const,
  redemptions: (params?: Record<string, unknown>) =>
    ["redemptions", params ?? {}] as const,
  redemption: (id: string) => ["redemption", id] as const,
  transactions: (params?: Record<string, unknown>) =>
    ["transactions", params ?? {}] as const,
  price: () => ["price", "wealth"] as const,
} as const;
