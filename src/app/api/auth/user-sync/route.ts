import { NextRequest, NextResponse } from "next/server";
import { verifyPrivyToken, privyClient } from "@/lib/auth/privy-server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const claims = await verifyPrivyToken(token);

  if (!claims) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Get user details from Privy
  const privyUser = await privyClient.getUser(claims.userId);
  const email = privyUser.email?.address;
  const wallet = privyUser.wallet?.address;

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 400 });
  }

  // Upsert user in database
  const user = await prisma.user.upsert({
    where: { privyUserId: claims.userId },
    update: {
      email,
      walletAddress: wallet ?? undefined,
    },
    create: {
      privyUserId: claims.userId,
      email,
      walletAddress: wallet,
    },
  });

  return NextResponse.json({ user });
}
