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
  categoryId: z.string(),
  isActive: z.boolean(),
  createdBy: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: embeddedCategorySchema.optional(),
});

export type Merchant = z.infer<typeof merchantSchema>;

export const merchantListResponseSchema = z.object({
  merchants: z.array(merchantSchema),
  pagination: paginationSchema,
});

export const merchantDetailResponseSchema = z.object({
  merchant: merchantSchema,
});
