import { z } from "zod";
import { decimalStringSchema, paginationSchema } from "./common";

export const transactionTypeSchema = z.enum([
  "deposit",
  "withdrawal",
  "redeem",
]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const transactionStatusSchema = z.enum([
  "pending",
  "confirmed",
  "failed",
]);
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  redemptionId: z.string().nullable(),
  type: transactionTypeSchema,
  amountWealth: decimalStringSchema,
  txHash: z.string().nullable(),
  status: transactionStatusSchema,
  createdAt: z.string(),
  confirmedAt: z.string().nullable(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const transactionListResponseSchema = z.object({
  transactions: z.array(transactionSchema),
  pagination: paginationSchema,
});

export type TransactionListResponse = z.infer<
  typeof transactionListResponseSchema
>;
