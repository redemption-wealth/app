import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/protect-api";
import { prisma } from "@/lib/db";

export const GET = withAuth(async (_req: NextRequest, ctx, auth) => {
  const { id } = await ctx.params;

  const redemption = await prisma.redemption.findFirst({
    where: { id, userId: auth.userId },
    include: {
      voucher: { include: { merchant: true } },
      qrCode: true,
      transaction: true,
    },
  });

  if (!redemption) {
    return NextResponse.json({ error: "Redemption not found" }, { status: 404 });
  }

  return NextResponse.json({ redemption });
});
