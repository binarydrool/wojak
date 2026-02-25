import { NextResponse } from "next/server";
import { fetchRecentSwaps } from "@/lib/subgraph";
import type { Trade } from "@/types";

// In-memory cache — 2 minutes
let cached: Trade[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 2 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (cached && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(
      { trades: cached, source: "cache" },
      { headers: { "Cache-Control": "public, max-age=120, s-maxage=120" } }
    );
  }

  try {
    const trades = await fetchRecentSwaps();
    cached = trades;
    cachedAt = now;
    return NextResponse.json(
      { trades, source: "onchain" },
      { headers: { "Cache-Control": "public, max-age=120, s-maxage=120" } }
    );
  } catch (err) {
    console.error("[trades] Fetch error:", err);

    if (cached) {
      return NextResponse.json(
        { trades: cached, source: "stale-cache" },
        { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } }
      );
    }

    return NextResponse.json(
      { trades: [], source: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-cache" } }
    );
  }
}
