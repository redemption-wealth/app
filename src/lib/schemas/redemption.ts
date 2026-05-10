import { z } from "zod";
import { decimalStringSchema, paginationSchema } from "./common";
import { voucherSchema } from "./voucher";

// Backend stores enums in UPPERCASE (Postgres enum convention) but the rest of
// the FE codebase reads them as lowercase. Preprocess casts the incoming value
// to lowercase before enum validation so we keep the lowercase contract on the
// FE side without touching every consumer.
function lowercaseEnum<const T extends readonly [string, ...string[]]>(
  values: T,
) {
  return z.preprocess(
    (val) => (typeof val === "string" ? val.toLowerCase() : val),
    z.enum(values),
  );
}

export const redemptionStatusSchema = lowercaseEnum([
  "pending",
  "confirmed",
  "failed",
  "expired",
]);
export type RedemptionStatus = z.infer<typeof redemptionStatusSchema>;

const qrCodeStatusSchema = lowercaseEnum([
  "available",
  "redeemed",
  "used",
  "fully_used",
]);

export const qrCodeSchema = z.object({
  id: z.string(),
  voucherId: z.string(),
  slotId: z.string().optional(),
  qrNumber: z.number().int().positive(),
  redemptionId: z.string().nullable(),
  imageUrl: z.string(),
  imageHash: z.string().optional(),
  token: z.string().nullable(),
  status: qrCodeStatusSchema,
  assignedToUserId: z.string().nullable().optional(),
  assignedAt: z.string().nullable().optional(),
  redeemedAt: z.string().nullable().optional(),
  usedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type QrCode = z.infer<typeof qrCodeSchema>;

export const redemptionSchema = z.object({
  id: z.string(),
  // BE migrated user identity from `userId` to `userEmail` (better-auth based).
  // Keep both optional to absorb either response shape.
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  voucherId: z.string(),
  merchantId: z.string().optional(),
  slotId: z.string().optional(),
  wealthAmount: decimalStringSchema,
  priceIdrAtRedeem: z.number().int().nonnegative(),
  wealthPriceIdrAtRedeem: decimalStringSchema,
  appFeeAmount: decimalStringSchema,
  gasFeeAmount: decimalStringSchema,
  txHash: z.string().nullable(),
  idempotencyKey: z.string(),
  status: redemptionStatusSchema,
  redeemedAt: z.string().optional(),
  confirmedAt: z.string().nullable().optional(),
  failedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  voucher: voucherSchema.optional(),
  qrCodes: z.array(qrCodeSchema).optional(),
});

export type Redemption = z.infer<typeof redemptionSchema>;

export const redemptionListResponseSchema = z.object({
  redemptions: z.array(redemptionSchema),
  pagination: paginationSchema,
});

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

export const submitTxResponseSchema = z.object({
  redemption: redemptionSchema,
});

export const reconcileRedemptionResponseSchema = z.object({
  redemption: redemptionSchema,
  reconciled: z.boolean().optional(),
});
