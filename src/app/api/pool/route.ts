import { NextResponse } from "next/server";
import { OG_UNISWAP_POOL } from "@/lib/constants";

const GECKOTERMINAL_POOL_URL = `https://api.geckoterminal.com/api/v2/networks/eth/pools/${OG_UNISWAP_POOL}`;

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

interface GeckoPoolResponse {
  data?: {
    attributes?: {
      reserve_in_usd?: string;
      base_token_price_usd?: string;
      quote_token_price_usd?: string;
      volume_usd?: {
        h1?: string;
        h6?: string;
        h24?: string;
      };
      transactions?: {
        h24?: {
          buys?: number;
          sells?: number;
          buyers?: number;
          sellers?: number;
        };
      };
    };
  };
}

async function fetchPoolData(): Promise<PoolCache | null> {
  try {
    const res = await fetch(GECKOTERMINAL_POOL_URL, { cache: "no-store" });
    if (!res.ok) {
      console.error(`[pool] GeckoTerminal returned HTTP ${res.status}`);
      return null;
    }

    const json: GeckoPoolResponse = await res.json();
    const attrs = json.data?.attributes;
    if (!attrs) return null;

    const tvlUsd = parseFloat(attrs.reserve_in_usd ?? "0");
    const wojakPrice = parseFloat(attrs.base_token_price_usd ?? "0");
    const ethPrice = parseFloat(attrs.quote_token_price_usd ?? "0");

    // Uniswap V2 is 50/50 — each side holds half the TVL
    const wojakReserve = wojakPrice > 0 ? (tvlUsd / 2) / wojakPrice : 0;
    const ethReserve = ethPrice > 0 ? (tvlUsd / 2) / ethPrice : 0;

    const volume24h = parseFloat(attrs.volume_usd?.h24 ?? "0");
    const volume6h = parseFloat(attrs.volume_usd?.h6 ?? "0");
    const volume1h = parseFloat(attrs.volume_usd?.h1 ?? "0");

    const fees24h = volume24h * 0.003;

    const txns = attrs.transactions?.h24;
    const buys24h = txns?.buys ?? 0;
    const sells24h = txns?.sells ?? 0;
    const buyers24h = txns?.buyers ?? 0;
    const sellers24h = txns?.sellers ?? 0;

    return {
      tvlUsd,
      wojakReserve,
      ethReserve,
      wojakPrice,
      ethPrice,
      volume24h,
      volume6h,
      volume1h,
      fees24h,
      buys24h,
      sells24h,
      buyers24h,
      sellers24h,
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
      { ...data, source: "geckoterminal", lastUpdated: new Date(now).toISOString() },
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
