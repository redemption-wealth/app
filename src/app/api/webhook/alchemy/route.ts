import { NextRequest, NextResponse } from "next/server";
import { confirmRedemption, failRedemption } from "@/lib/services/redemption.service";

export async function POST(req: NextRequest) {
  // Verify Alchemy webhook signature
  const signature = req.headers.get("x-alchemy-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // TODO: Verify signature with ALCHEMY_WEBHOOK_SIGNING_KEY
  // const isValid = verifyAlchemySignature(signature, body, process.env.ALCHEMY_WEBHOOK_SIGNING_KEY);

  const body = await req.json();
  const { event } = body;

  if (!event?.activity) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  for (const activity of event.activity) {
    const txHash = activity.hash;
    if (!txHash) continue;

    try {
      if (activity.category === "token" && activity.typeTraceAddress === "CALL") {
        // Successful ERC-20 transfer
        await confirmRedemption(txHash);
      }
    } catch {
      // If tx failed or was reverted
      try {
        await failRedemption(txHash);
      } catch {
        // Redemption may not exist for this txHash
      }
    }
  }

  return NextResponse.json({ ok: true });
}
