import { z } from "zod";
import { decimalStringSchema, paginationSchema } from "./common";
import { merchantSchema } from "./merchant";

export const voucherSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  expiryDate: z.string(),
  totalStock: z.number().int(),
  remainingStock: z.number().int(),
  basePrice: decimalStringSchema,
  appFeeRate: decimalStringSchema,
  gasFeeAmount: decimalStringSchema,
  totalPrice: decimalStringSchema,
  qrPerSlot: z.number().int().positive(),
  isActive: z.boolean(),
  createdBy: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  merchant: merchantSchema.optional(),
});

export type Voucher = z.infer<typeof voucherSchema>;

export const voucherListResponseSchema = z.object({
  vouchers: z.array(voucherSchema),
  pagination: paginationSchema,
});

export const voucherDetailResponseSchema = z.object({
  voucher: voucherSchema,
});
