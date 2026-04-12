import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/protect-api";
import { prisma } from "@/lib/db";

export const GET = withAuth(async (req: NextRequest, _ctx, auth) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const status = searchParams.get("status");

  const where = {
    userId: auth.userId,
    ...(status && { status: status as never }),
  };

  const [redemptions, total] = await Promise.all([
    prisma.redemption.findMany({
      where,
      include: {
        voucher: { include: { merchant: true } },
        qrCode: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.redemption.count({ where }),
  ]);

  return NextResponse.json({
    redemptions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
