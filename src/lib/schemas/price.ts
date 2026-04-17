import { z } from "zod";

export const priceResponseSchema = z.object({
  priceIdr: z.number().positive(),
  cached: z.boolean(),
  stale: z.boolean().optional(),
});
