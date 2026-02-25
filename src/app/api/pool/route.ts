import { NextResponse } from "next/server";
import { fetchOnChainData } from "@/lib/onchain";
import { fetchVolumeMultiTimeframe, fetchBuySellCounts24h } from "@/lib/subgraph";

// In-memory cache — 5 minutes
let cached: PoolCache | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

interface PoolCache {
  tvlUsd: number;
  wojakReserve: number;
  ethReserve: number;
  wojakPrice: number;
  ethPrice: number;
  volume24h: number;
  volume6h: number;
  volume1h: number;
  fees24h: number;
  buys24h: number;
  sells24h: number;
  buyers24h: number;
  sellers24h: number;
}

async function fetchPoolData(): Promise<PoolCache | null> {
  try {
    const [onchain, volumes, txCounts] = await Promise.all([
      fetchOnChainData(),
      fetchVolumeMultiTimeframe(),
      fetchBuySellCounts24h(),
    ]);

    // Volumes from event logs are in ETH — convert to USD
    const ethPrice = onchain.ethPriceUsd;
    const volume24hUsd = volumes.volume24h * ethPrice;
    const volume6hUsd = volumes.volume6h * ethPrice;
    const volume1hUsd = volumes.volume1h * ethPrice;

    return {
      tvlUsd: onchain.tvlUsd,
      wojakReserve: onchain.wojakReserve,
      ethReserve: onchain.ethReserve,
      wojakPrice: onchain.wojakPriceUsd,
      ethPrice,
      volume24h: volume24hUsd,
      volume6h: volume6hUsd,
      volume1h: volume1hUsd,
      fees24h: volume24hUsd * 0.003,
      buys24h: txCounts.buys,
      sells24h: txCounts.sells,
      buyers24h: txCounts.buyers,
      sellers24h: txCounts.sellers,
    };
  } catch (err) {
    console.error("[pool] Fetch error:", err);
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  // Return cached if fresh
  if (cached && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(
      { ...cached, source: "cache", lastUpdated: new Date(cachedAt).toISOString() },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
  }

  const data = await fetchPoolData();

  if (data) {
    cached = data;
    cachedAt = now;
    return NextResponse.json(
      { ...data, source: "onchain", lastUpdated: new Date(now).toISOString() },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
  }

  // Stale fallback
  if (cached) {
    return NextResponse.json(
      { ...cached, source: "stale-cache", lastUpdated: new Date(cachedAt).toISOString() },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
    );
  }

  // No data at all
  return NextResponse.json(
    {
      tvlUsd: null, wojakReserve: null, ethReserve: null,
      wojakPrice: null, ethPrice: null,
      volume24h: null, volume6h: null, volume1h: null,
      fees24h: null, buys24h: null, sells24h: null,
      buyers24h: null, sellers24h: null,
      source: "unavailable", lastUpdated: null,
    },
    { status: 503, headers: { "Cache-Control": "no-cache" } }
  );
}
