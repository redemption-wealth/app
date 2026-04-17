import { z } from "zod";

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  privyUserId: z.string(),
  walletAddress: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const userSyncResponseSchema = z.object({
  user: userSchema,
});
