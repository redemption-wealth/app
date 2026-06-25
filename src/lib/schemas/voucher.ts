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
  // appFeeRate / gasFeeAmount / totalPrice are computed live by the BE
  // pricing service and only injected on the public /api/vouchers/:id
  // and /api/vouchers/ routes. When a voucher is nested inside a
  // redemption response they are absent, so accept them as optional.
  appFeeRate: decimalStringSchema.optional(),
  gasFeeAmount: decimalStringSchema.optional(),
  totalPrice: decimalStringSchema.optional(),
  // Snapshot fields exist on the DB row (live-fee-rate refactor kept the
  // columns for historical pricing) and come back through nested
  // redemption.voucher payloads. Optional because public voucher
  // endpoints do not include them after the live-fee migration.
  appFeeSnapshot: decimalStringSchema.optional(),
  gasFeeSnapshot: decimalStringSchema.optional(),
  qrPerSlot: z.number().int().positive(),
  // Asset format presented behind the voucher. Defaults to QR for backward
  // compatibility with payloads from before the multi-format migration.
  format: z.enum(["QR", "CODE", "BARCODE"]).default("QR"),
  barcodeSymbology: z.string().nullable().optional(),
  isActive: z.boolean(),
  deletedAt: z.string().nullable().optional(),
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
