import { NextResponse } from "next/server";

let cachedPrice: { price: number; updatedAt: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

export async function GET() {
  const now = Date.now();

  if (cachedPrice && now - cachedPrice.updatedAt < CACHE_TTL) {
    return NextResponse.json({
      priceIdr: cachedPrice.price,
      cached: true,
    });
  }

  try {
    // TODO: Replace with real CoinGecko API call
    // const res = await fetch(
    //   "https://api.coingecko.com/api/v3/simple/price?ids=wealth&vs_currencies=idr"
    // );
    // const data = await res.json();
    // const price = data.wealth.idr;

    const price = 850; // Mock price: 850 IDR per $WEALTH

    cachedPrice = { price, updatedAt: now };

    return NextResponse.json({
      priceIdr: price,
      cached: false,
    });
  } catch {
    if (cachedPrice) {
      return NextResponse.json({
        priceIdr: cachedPrice.price,
        cached: true,
        stale: true,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
