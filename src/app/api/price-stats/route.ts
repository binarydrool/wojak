import { NextResponse } from "next/server";
import { fetchPriceHistory, type PriceHistoryResult } from "@/lib/subgraph";

// In-memory cache — 2 minutes
let cached: PriceHistoryResult | null = null;
let cachedAt = 0;
const CACHE_TTL = 2 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (cached && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(
      { ...cached, source: "cache", lastUpdated: new Date(cachedAt).toISOString() },
      { headers: { "Cache-Control": "public, max-age=120, s-maxage=120" } }
    );
  }

  try {
    const data = await fetchPriceHistory();

    cached = data;
    cachedAt = now;
    return NextResponse.json(
      { ...data, source: "subgraph", lastUpdated: new Date(now).toISOString() },
      { headers: { "Cache-Control": "public, max-age=120, s-maxage=120" } }
    );
  } catch (err) {
    console.error("[price-stats] Fetch error:", err);

    if (cached) {
      return NextResponse.json(
        { ...cached, source: "stale-cache", lastUpdated: new Date(cachedAt).toISOString() },
        { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } }
      );
    }

    return NextResponse.json(
      {
        change1h: null, change24h: null, change7d: null, change30d: null,
        usdChange1h: null, usdChange24h: null, usdChange7d: null, usdChange30d: null,
        source: "unavailable", lastUpdated: null,
      },
      { status: 503, headers: { "Cache-Control": "no-cache" } }
    );
  }
}
