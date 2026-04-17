import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/protect-api";
import { prisma } from "@/lib/db";

export const GET = withAuth(async (req: NextRequest, _ctx, auth) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const type = searchParams.get("type");

  const where = {
    userId: auth.userId,
    ...(type && { type: type as never }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
