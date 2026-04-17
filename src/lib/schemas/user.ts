import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  privyUserId: z.string(),
  walletAddress: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const userSyncResponseSchema = z.object({
  user: userSchema,
});

export type UserSyncResponse = z.infer<typeof userSyncResponseSchema>;
