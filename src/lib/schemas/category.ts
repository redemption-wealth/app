import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;

export const categoryListResponseSchema = z.object({
  data: z.array(categorySchema),
});

export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;

export const categoryDetailResponseSchema = z.object({
  data: categorySchema,
});

export type CategoryDetailResponse = z.infer<typeof categoryDetailResponseSchema>;
