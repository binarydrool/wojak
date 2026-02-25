import { NextResponse } from "next/server";
import { fetchOnChainData, ethCall } from "@/lib/onchain";

// Uniswap V2 pair: new wojak (0x8de) / WETH (0xc02)
// token0 = new wojak (0x8de < 0xc02), both 18 decimals
const NEW_WOJAK_POOL = "0xcaa3a16f8440f85303afaab1992f2b97d12469b1";

// In-memory cache — 10 minutes
let cached: ComparisonData | null = null;
let cachedAt = 0;
const CACHE_TTL = 10 * 60 * 1000;

interface ComparisonData {
  og: { liquidity: number | null };
  new: { liquidity: number | null };
}

async function fetchNewPoolTvl(ethPriceUsd: number): Promise<number | null> {
  try {
    // getReserves() selector: 0x0902f1ac
    const result = await ethCall(NEW_WOJAK_POOL, "0x0902f1ac");
    const hex = result.slice(2);
    // reserve0 = new wojak (token0), reserve1 = WETH — both 18 decimals
    const ethReserve = Number(BigInt("0x" + hex.slice(64, 128))) / 1e18;
    // Uniswap V2 is 50/50 — TVL = 2 * ETH side value
    return ethReserve * ethPriceUsd * 2;
  } catch (err) {
    console.error("[comparison] New pool reserves error:", err);
    return null;
  }
}

async function fetchComparisonData(): Promise<ComparisonData | null> {
  try {
    const onchain = await fetchOnChainData();
    const newTvl = await fetchNewPoolTvl(onchain.ethPriceUsd);

    return {
      og: { liquidity: onchain.tvlUsd },
      new: { liquidity: newTvl },
    };
  } catch (err) {
    console.error("[comparison] Fetch error:", err);
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  if (cached && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(
      { ...cached, source: "cache", lastUpdated: new Date(cachedAt).toISOString() },
      { headers: { "Cache-Control": "public, max-age=600, s-maxage=600" } }
    );
  }

  const data = await fetchComparisonData();

  if (data) {
    cached = data;
    cachedAt = now;
    return NextResponse.json(
      { ...data, source: "live", lastUpdated: new Date(now).toISOString() },
      { headers: { "Cache-Control": "public, max-age=600, s-maxage=600" } }
    );
  }

  if (cached) {
    return NextResponse.json(
      { ...cached, source: "stale-cache", lastUpdated: new Date(cachedAt).toISOString() },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
    );
  }

  return NextResponse.json(
    { og: null, new: null, source: "unavailable", lastUpdated: null },
    { status: 503, headers: { "Cache-Control": "no-cache" } }
  );
}
