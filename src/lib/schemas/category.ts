import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const categoryListResponseSchema = z.object({
  data: z.array(categorySchema),
});

export const categoryDetailResponseSchema = z.object({
  data: categorySchema,
});
