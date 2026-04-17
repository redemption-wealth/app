import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/protect-api";
import { initiateRedemption } from "@/lib/services/redemption.service";
import { prisma } from "@/lib/db";

export const POST = withAuth(async (req: NextRequest, ctx, auth) => {
  const { id: voucherId } = await ctx.params;
  const body = await req.json();
  const { idempotencyKey, wealthPriceIdr } = body;

  if (!idempotencyKey || !wealthPriceIdr) {
    return NextResponse.json(
      { error: "idempotencyKey and wealthPriceIdr are required" },
      { status: 400 }
    );
  }

  try {
    const { redemption, alreadyExists } = await initiateRedemption({
      userId: auth.userId,
      voucherId,
      idempotencyKey,
      wealthPriceIdr,
    });

    if (alreadyExists) {
      return NextResponse.json({ redemption, alreadyExists: true });
    }

    // Return redemption with details needed for client-side tx
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    return NextResponse.json({
      redemption,
      txDetails: {
        tokenContractAddress: settings?.tokenContractAddress,
        treasuryWalletAddress: settings?.treasuryWalletAddress,
        wealthAmount: redemption.wealthAmount.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Redemption failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
