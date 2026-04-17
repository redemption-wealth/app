import { z } from "zod";

export const priceResponseSchema = z.object({
  priceIdr: z.number().positive(),
  cached: z.boolean(),
  stale: z.boolean().optional(),
});

export type PriceResponse = z.infer<typeof priceResponseSchema>;
