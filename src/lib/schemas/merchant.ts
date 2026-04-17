import { z } from "zod";
import { categorySchema } from "./category";
import { paginationSchema } from "./common";

export const merchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  description: z.string().nullable(),
  categoryId: z.string(),
  isActive: z.boolean(),
  createdBy: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: categorySchema.optional(),
});

export type Merchant = z.infer<typeof merchantSchema>;

export const merchantListResponseSchema = z.object({
  merchants: z.array(merchantSchema),
  pagination: paginationSchema,
});

export type MerchantListResponse = z.infer<typeof merchantListResponseSchema>;

export const merchantDetailResponseSchema = z.object({
  merchant: merchantSchema,
});

export type MerchantDetailResponse = z.infer<
  typeof merchantDetailResponseSchema
>;
