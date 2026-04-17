import { z } from "zod";

const hexAddress = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Must be a 0x-prefixed 40-character hex address");

const envSchema = z.object({
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1, "NEXT_PUBLIC_PRIVY_APP_ID is required"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url("NEXT_PUBLIC_API_BASE_URL must be a URL"),
  NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS: hexAddress,
  NEXT_PUBLIC_TREASURY_WALLET_ADDRESS: hexAddress,
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a URL"),
  NEXT_PUBLIC_ALCHEMY_RPC_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS,
    NEXT_PUBLIC_TREASURY_WALLET_ADDRESS:
      process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ALCHEMY_RPC_URL: process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${details}\n\nSee .env.example for the required shape.`,
    );
  }

  return parsed.data;
}

export const env = parseEnv();
