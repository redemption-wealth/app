import { NextRequest, NextResponse } from "next/server";
import { verifyPrivyToken } from "./privy-server";
import { prisma } from "@/lib/db";

export interface AuthContext {
  userId: string;
  email: string;
  privyUserId: string;
}

type HandlerWithAuth = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  auth: AuthContext
) => Promise<NextResponse>;

export function withAuth(handler: HandlerWithAuth) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const claims = await verifyPrivyToken(token);

    if (!claims) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { privyUserId: claims.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return handler(req, ctx, {
      userId: user.id,
      email: user.email,
      privyUserId: user.privyUserId,
    });
  };
}
