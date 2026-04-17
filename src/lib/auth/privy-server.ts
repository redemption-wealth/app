import { PrivyClient } from "@privy-io/server-auth";

const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function verifyPrivyToken(authToken: string) {
  try {
    const verifiedClaims = await privyClient.verifyAuthToken(authToken);
    return verifiedClaims;
  } catch {
    return null;
  }
}

export { privyClient };
