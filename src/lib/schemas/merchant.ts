import { z } from "zod";
import { paginationSchema } from "./common";

const embeddedCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
});

export const merchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  description: z.string().nullable(),
  category: z.string(), // Backend returns category as string (e.g., "kuliner"), not categoryId
  isActive: z.boolean(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Merchant = z.infer<typeof merchantSchema>;

export const merchantListResponseSchema = z.object({
  merchants: z.array(merchantSchema),
  pagination: paginationSchema,
});

export const merchantDetailResponseSchema = z.object({
  merchant: merchantSchema,
});
