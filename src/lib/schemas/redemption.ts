import { z } from "zod";
import { decimalStringSchema, paginationSchema } from "./common";
import { voucherSchema } from "./voucher";

export const redemptionStatusSchema = z.enum([
  "pending",
  "confirmed",
  "failed",
]);
export type RedemptionStatus = z.infer<typeof redemptionStatusSchema>;

export const qrCodeStatusSchema = z.enum(["available", "redeemed", "used"]);
export type QrCodeStatus = z.infer<typeof qrCodeStatusSchema>;

export const qrCodeSchema = z.object({
  id: z.string(),
  voucherId: z.string(),
  slotId: z.string(),
  qrNumber: z.number().int().positive(),
  redemptionId: z.string().nullable(),
  imageUrl: z.string(),
  imageHash: z.string(),
  token: z.string().nullable(),
  status: qrCodeStatusSchema,
  assignedToUserId: z.string().nullable(),
  assignedAt: z.string().nullable(),
  redeemedAt: z.string().nullable(),
  usedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type QrCode = z.infer<typeof qrCodeSchema>;

export const redemptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  voucherId: z.string(),
  wealthAmount: decimalStringSchema,
  priceIdrAtRedeem: z.number().int().nonnegative(),
  wealthPriceIdrAtRedeem: decimalStringSchema,
  appFeeAmount: decimalStringSchema,
  gasFeeAmount: decimalStringSchema,
  txHash: z.string().nullable(),
  idempotencyKey: z.string(),
  status: redemptionStatusSchema,
  redeemedAt: z.string(),
  confirmedAt: z.string().nullable(),
  createdAt: z.string(),
  voucher: voucherSchema.optional(),
  qrCodes: z.array(qrCodeSchema).optional(),
});

export type Redemption = z.infer<typeof redemptionSchema>;

export const redemptionListResponseSchema = z.object({
  redemptions: z.array(redemptionSchema),
  pagination: paginationSchema,
});

export type RedemptionListResponse = z.infer<
  typeof redemptionListResponseSchema
>;

export const redemptionDetailResponseSchema = z.object({
  redemption: redemptionSchema,
});

export type RedemptionDetailResponse = z.infer<
  typeof redemptionDetailResponseSchema
>;

export const redeemVoucherRequestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  wealthPriceIdr: z.number().positive(),
});

export type RedeemVoucherRequest = z.infer<typeof redeemVoucherRequestSchema>;

export const redeemVoucherResponseSchema = z.object({
  redemption: redemptionSchema,
  alreadyExists: z.boolean().optional(),
  txDetails: z
    .object({
      tokenContractAddress: z.string().nullable(),
      treasuryWalletAddress: z.string().nullable(),
      wealthAmount: z.string(),
    })
    .optional(),
});

export type RedeemVoucherResponse = z.infer<typeof redeemVoucherResponseSchema>;

export const submitTxRequestSchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
});

export type SubmitTxRequest = z.infer<typeof submitTxRequestSchema>;

export const submitTxResponseSchema = z.object({
  redemption: redemptionSchema,
});

export type SubmitTxResponse = z.infer<typeof submitTxResponseSchema>;

export const reconcileRedemptionResponseSchema = z.object({
  redemption: redemptionSchema,
  reconciled: z.boolean().optional(),
});

export type ReconcileRedemptionResponse = z.infer<
  typeof reconcileRedemptionResponseSchema
>;
