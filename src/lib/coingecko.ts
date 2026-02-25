const WOJAK_TOTAL_SUPPLY = 69_420_000_000;

export interface WojakMarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  tvl: number;
  holders: number;
  imageUrl: string;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value > 0) return `$${value.toFixed(6)}`;
  return "$0";
}

export { formatCurrency };

/**
 * Fetch dynamic holder count from our /api/holders scraper route.
 * Falls back to null if the API is unavailable.
 */
export async function fetchHolderCount(): Promise<number | null> {
  try {
    const res = await fetch("/api/holders");
    if (!res.ok) return null;
    const data = await res.json();
    return data.holders ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch all WOJAK market data from on-chain sources via /api/pool.
 */
export async function fetchWojakMarketData(): Promise<WojakMarketData> {
  const [poolRes, holders] = await Promise.all([
    fetch("/api/pool").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetchHolderCount(),
  ]);

  const price = poolRes?.wojakPrice ?? 0;
  const marketCap = price * WOJAK_TOTAL_SUPPLY;
  const volume24h = poolRes?.volume24h ?? 0;
  const tvl = poolRes?.tvlUsd ?? 0;

  return {
    price,
    marketCap,
    volume24h,
    tvl,
    holders: holders ?? 0,
    imageUrl: "",
  };
}

/**
 * Get formatted stats for the dashboard hero section.
 */
export async function fetchFormattedStats(): Promise<{
  marketCap: string;
  tvl: string;
  volume24h: string;
  holders: string;
  price: number;
  ethPrice: number;
}> {
  const [poolRes, holders] = await Promise.all([
    fetch("/api/pool").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetchHolderCount(),
  ]);

  const price = poolRes?.wojakPrice ?? 0;
  const marketCap = price * WOJAK_TOTAL_SUPPLY;
  const tvl = poolRes?.tvlUsd ?? 0;
  const volume24h = poolRes?.volume24h ?? 0;
  const ethPrice = poolRes?.ethPrice ?? 0;
  const holderCount = holders ?? 0;

  return {
    marketCap: marketCap > 0 ? formatCurrency(marketCap) : "—",
    tvl: tvl > 0 ? formatCurrency(tvl) : "—",
    volume24h: volume24h > 0 ? formatCurrency(volume24h) : "—",
    holders: holderCount > 0 ? holderCount.toLocaleString() : "—",
    price,
    ethPrice,
  };
}

export interface PriceStats {
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  usdChange1h: number | null;
  usdChange24h: number | null;
  usdChange7d: number | null;
  usdChange30d: number | null;
}

/**
 * Fetch price change stats from the /api/price-stats route (subgraph data).
 * Returns both ETH-denominated and USD-denominated percentage changes.
 */
export async function fetchPriceStats(): Promise<PriceStats> {
  const nullStats: PriceStats = {
    change1h: null, change24h: null, change7d: null, change30d: null,
    usdChange1h: null, usdChange24h: null, usdChange7d: null, usdChange30d: null,
  };
  try {
    const res = await fetch("/api/price-stats");
    if (!res.ok) return nullStats;
    const data = await res.json();
    return {
      change1h: data.change1h ?? null,
      change24h: data.change24h ?? null,
      change7d: data.change7d ?? null,
      change30d: data.change30d ?? null,
      usdChange1h: data.usdChange1h ?? null,
      usdChange24h: data.usdChange24h ?? null,
      usdChange7d: data.usdChange7d ?? null,
      usdChange30d: data.usdChange30d ?? null,
    };
  } catch {
    return nullStats;
  }
}
