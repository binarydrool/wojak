import { OG_WOJAK_CONTRACT, OG_UNISWAP_POOL } from "./constants";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const GECKOTERMINAL_BASE = "https://api.geckoterminal.com/api/v2";

interface CoinGeckoTokenData {
  market_data?: {
    current_price?: { usd?: number };
    market_cap?: { usd?: number };
    total_volume?: { usd?: number };
    price_change_percentage_1h_in_currency?: { usd?: number };
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
  };
  image?: {
    small?: string;
    thumb?: string;
    large?: string;
  };
}

interface GeckoTerminalPoolData {
  data?: Array<{
    attributes?: {
      reserve_in_usd?: string;
      price_change_percentage?: {
        h1?: string;
        h24?: string;
        h6?: string;
      };
      volume_usd?: {
        h24?: string;
      };
    };
  }>;
}

interface GeckoTerminalSinglePool {
  data?: {
    attributes?: {
      price_change_percentage?: {
        h1?: string;
        h24?: string;
        h6?: string;
      };
      volume_usd?: {
        h24?: string;
      };
    };
  };
}

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
 * Fetch WOJAK token data from CoinGecko free API.
 * Endpoint: /coins/ethereum/contract/{address}
 * Returns: price, market_cap, total_volume, image
 */
async function fetchCoinGeckoData(): Promise<CoinGeckoTokenData | null> {
  try {
    const url = `${COINGECKO_BASE}/coins/ethereum/contract/${OG_WOJAK_CONTRACT}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch TVL from GeckoTerminal by looking at the top pool's reserve_in_usd.
 */
async function fetchGeckoTerminalTVL(): Promise<number> {
  try {
    const url = `${GECKOTERMINAL_BASE}/networks/eth/tokens/${OG_WOJAK_CONTRACT}/pools?page=1`;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data: GeckoTerminalPoolData = await res.json();
    if (data.data && data.data.length > 0) {
      const reserveStr = data.data[0].attributes?.reserve_in_usd;
      return reserveStr ? parseFloat(reserveStr) : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch all WOJAK market data from CoinGecko + GeckoTerminal.
 * Returns formatted stats ready for display.
 */
export async function fetchWojakMarketData(): Promise<WojakMarketData> {
  const [cgData, tvl, holders] = await Promise.all([
    fetchCoinGeckoData(),
    fetchGeckoTerminalTVL(),
    fetchHolderCount(),
  ]);

  const price = cgData?.market_data?.current_price?.usd ?? 0;
  const marketCap = cgData?.market_data?.market_cap?.usd ?? 0;
  const volume24h = cgData?.market_data?.total_volume?.usd ?? 0;
  const imageUrl = cgData?.image?.small ?? "";

  return {
    price,
    marketCap,
    volume24h,
    tvl,
    holders: holders ?? 0,
    imageUrl,
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
  const data = await fetchWojakMarketData();

  // Also fetch ETH price for swap calculation
  let ethPrice = 0;
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=ethereum&vs_currencies=usd`
    );
    if (res.ok) {
      const ethData = await res.json();
      ethPrice = ethData?.ethereum?.usd ?? 0;
    }
  } catch {
    // ignore
  }

  return {
    marketCap: data.marketCap > 0 ? formatCurrency(data.marketCap) : "—",
    tvl: data.tvl > 0 ? formatCurrency(data.tvl) : "—",
    volume24h: data.volume24h > 0 ? formatCurrency(data.volume24h) : "—",
    holders: data.holders > 0 ? data.holders.toLocaleString() : "—",
    price: data.price,
    ethPrice,
  };
}

export interface PriceStats {
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  volume24h: number | null;
}

/**
 * Fetch price change stats for display below the chart.
 * Tries CoinGecko first, falls back to GeckoTerminal for missing fields.
 */
export async function fetchPriceStats(): Promise<PriceStats> {
  const stats: PriceStats = {
    change1h: null,
    change24h: null,
    change7d: null,
    volume24h: null,
  };

  // Try CoinGecko first
  const cgData = await fetchCoinGeckoData();
  if (cgData?.market_data) {
    const md = cgData.market_data;
    stats.change1h = md.price_change_percentage_1h_in_currency?.usd ?? null;
    stats.change24h = md.price_change_percentage_24h ?? null;
    stats.change7d = md.price_change_percentage_7d ?? null;
    if (md.total_volume?.usd) stats.volume24h = md.total_volume.usd;
  }

  // Fill gaps from GeckoTerminal pool data
  if (stats.change1h === null || stats.change24h === null || stats.volume24h === null) {
    try {
      const url = `${GECKOTERMINAL_BASE}/networks/eth/pools/${OG_UNISWAP_POOL}`;
      const res = await fetch(url);
      if (res.ok) {
        const pool: GeckoTerminalSinglePool = await res.json();
        const attrs = pool.data?.attributes;
        if (attrs) {
          if (stats.change1h === null && attrs.price_change_percentage?.h1) {
            stats.change1h = parseFloat(attrs.price_change_percentage.h1);
          }
          if (stats.change24h === null && attrs.price_change_percentage?.h24) {
            stats.change24h = parseFloat(attrs.price_change_percentage.h24);
          }
          if (stats.volume24h === null && attrs.volume_usd?.h24) {
            stats.volume24h = parseFloat(attrs.volume_usd.h24);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return stats;
}
