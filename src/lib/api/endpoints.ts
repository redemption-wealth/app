import { apiRequest, type QueryParams } from "./client";
import {
  categoryDetailResponseSchema,
  categoryListResponseSchema,
} from "@/lib/schemas/category";
import {
  merchantDetailResponseSchema,
  merchantListResponseSchema,
} from "@/lib/schemas/merchant";
import {
  voucherDetailResponseSchema,
  voucherListResponseSchema,
} from "@/lib/schemas/voucher";
import {
  reconcileRedemptionResponseSchema,
  redeemVoucherResponseSchema,
  redemptionDetailResponseSchema,
  redemptionListResponseSchema,
  submitTxResponseSchema,
  type RedeemVoucherRequest,
  type RedemptionStatus,
} from "@/lib/schemas/redemption";
import {
  transactionListResponseSchema,
  type TransactionType,
} from "@/lib/schemas/transaction";
import { priceResponseSchema } from "@/lib/schemas/price";
import { userSyncResponseSchema } from "@/lib/schemas/user";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const endpoints = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  syncUser: () =>
    apiRequest({
      method: "POST",
      path: "/api/auth/user-sync",
      responseSchema: userSyncResponseSchema,
      requireAuth: true,
    }),

  // ── Categories ────────────────────────────────────────────────────────────
  listCategories: () =>
    apiRequest({
      method: "GET",
      path: "/api/categories",
      responseSchema: categoryListResponseSchema,
    }),

  getCategory: (id: string) =>
    apiRequest({
      method: "GET",
      path: `/api/categories/${id}`,
      responseSchema: categoryDetailResponseSchema,
    }),

  // ── Merchants ─────────────────────────────────────────────────────────────
  listMerchants: (
    params: PaginationParams & { categoryId?: string; search?: string } = {},
  ) =>
    apiRequest({
      method: "GET",
      path: "/api/merchants",
      query: params as QueryParams,
      responseSchema: merchantListResponseSchema,
    }),

  getMerchant: (id: string) =>
    apiRequest({
      method: "GET",
      path: `/api/merchants/${id}`,
      responseSchema: merchantDetailResponseSchema,
    }),

  // ── Vouchers ──────────────────────────────────────────────────────────────
  listVouchers: (
    params: PaginationParams & {
      merchantId?: string;
      category?: string;
      search?: string;
    } = {},
  ) =>
    apiRequest({
      method: "GET",
      path: "/api/vouchers",
      query: params as QueryParams,
      responseSchema: voucherListResponseSchema,
    }),

  getVoucher: (id: string) =>
    apiRequest({
      method: "GET",
      path: `/api/vouchers/${id}`,
      responseSchema: voucherDetailResponseSchema,
    }),

  redeemVoucher: (id: string, body: RedeemVoucherRequest) =>
    apiRequest({
      method: "POST",
      path: `/api/vouchers/${id}/redeem`,
      body,
      responseSchema: redeemVoucherResponseSchema,
      requireAuth: true,
    }),

  // ── Redemptions ───────────────────────────────────────────────────────────
  listRedemptions: (params: PaginationParams & { status?: RedemptionStatus } = {}) =>
    apiRequest({
      method: "GET",
      path: "/api/redemptions",
      query: params as QueryParams,
      responseSchema: redemptionListResponseSchema,
      requireAuth: true,
    }),

  getRedemption: (id: string) =>
    apiRequest({
      method: "GET",
      path: `/api/redemptions/${id}`,
      responseSchema: redemptionDetailResponseSchema,
      requireAuth: true,
    }),

  submitTxHash: (id: string, txHash: string) =>
    apiRequest({
      method: "PATCH",
      path: `/api/redemptions/${id}/submit-tx`,
      body: { txHash },
      responseSchema: submitTxResponseSchema,
      requireAuth: true,
    }),

  reconcileRedemption: (id: string) =>
    apiRequest({
      method: "POST",
      path: `/api/redemptions/${id}/reconcile`,
      responseSchema: reconcileRedemptionResponseSchema,
      requireAuth: true,
    }),

  // ── Transactions ──────────────────────────────────────────────────────────
  listTransactions: (params: PaginationParams & { type?: TransactionType } = {}) =>
    apiRequest({
      method: "GET",
      path: "/api/transactions",
      query: params as QueryParams,
      responseSchema: transactionListResponseSchema,
      requireAuth: true,
    }),

  // ── Price ─────────────────────────────────────────────────────────────────
  getWealthPrice: () =>
    apiRequest({
      method: "GET",
      path: "/api/price/wealth",
      responseSchema: priceResponseSchema,
    }),
} as const;
