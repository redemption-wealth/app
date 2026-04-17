import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get("merchantId");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = {
    isActive: true,
    remainingStock: { gt: 0 },
    endDate: { gte: new Date() },
    ...(merchantId && { merchantId }),
    ...(category && {
      merchant: { category: category as never },
    }),
    ...(search && {
      title: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      include: { merchant: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.voucher.count({ where }),
  ]);

  return NextResponse.json({
    vouchers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
