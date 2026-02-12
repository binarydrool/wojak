import { ETHERSCAN_API_BASE, OG_WOJAK_CONTRACT, OG_UNISWAP_POOL } from "./constants";
import type { EtherscanResponse, Trade, TokenStats } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";

/**
 * Build an Etherscan API URL with the given params.
 */
function buildUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams({ ...params, apikey: API_KEY });
  return `${ETHERSCAN_API_BASE}?${searchParams.toString()}`;
}

/**
 * Fetch the total token supply for OG WOJAK.
 * Returns raw token amount (needs division by decimals).
 */
export async function fetchTokenSupply(): Promise<string> {
  try {
    const url = buildUrl({
      module: "stats",
      action: "tokensupply",
      contractaddress: OG_WOJAK_CONTRACT,
    });
    const res = await fetch(url);
    const data: EtherscanResponse<string> = await res.json();
    if (data.status === "1") {
      return data.result;
    }
    return "0";
  } catch {
    return "0";
  }
}

/**
 * Fetch recent trades for OG WOJAK from GeckoTerminal API (free, no key needed).
 * Returns the most recent 25 trades with buy/sell type, amount, price, and wallet.
 */
export async function fetchRecentTrades(): Promise<Trade[]> {
  try {
    const poolAddress = OG_UNISWAP_POOL.toLowerCase();
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/eth/pools/${poolAddress}/trades`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const trades = json.data;
    if (!Array.isArray(trades)) return [];

    return trades.slice(0, 25).map(
      (t: {
        attributes: {
          tx_hash: string;
          kind: string;
          tx_from_address: string;
          block_timestamp: string;
          from_token_amount: string;
          to_token_amount: string;
          from_token_address: string;
          to_token_address: string;
          price_from_in_usd: string;
          volume_in_usd: string;
        };
      }) => {
        const a = t.attributes;
        const isBuy = a.kind === "buy";
        // For buys, to_token is WOJAK; for sells, from_token is WOJAK
        const wojakAmount = isBuy ? a.to_token_amount : a.from_token_amount;
        return {
          hash: a.tx_hash,
          type: a.kind as "buy" | "sell",
          amount: wojakAmount,
          wallet: a.tx_from_address,
          timestamp: Math.floor(new Date(a.block_timestamp).getTime() / 1000),
          priceUsd: a.price_from_in_usd,
          volumeUsd: a.volume_in_usd,
        };
      }
    );
  } catch {
    return [];
  }
}

/**
 * Fetch ETH balance for a given address.
 * Returns balance in wei.
 */
export async function fetchEthBalance(address: string): Promise<string> {
  try {
    const url = buildUrl({
      module: "account",
      action: "balance",
      address,
      tag: "latest",
    });
    const res = await fetch(url);
    const data: EtherscanResponse<string> = await res.json();
    if (data.status === "1") {
      return data.result;
    }
    return "0";
  } catch {
    return "0";
  }
}

/**
 * Fetch the current holder count for the OG WOJAK token.
 * NOTE: Etherscan free API does not have a direct holder count endpoint.
 * We use the token info page scrape alternative — for now returns a placeholder.
 * TODO: Use Etherscan Pro API (tokenholderlist) or a third-party like Moralis/Alchemy for accurate holder count.
 */
export async function fetchHolderCount(): Promise<number> {
  // Etherscan free tier does not expose a holder count endpoint directly.
  // Placeholder value based on known community data (~14,000+ holders).
  // TODO: Integrate Alchemy/Moralis API or Etherscan Pro for real-time holder count.
  return 14000;
}

/**
 * Aggregate token stats for the dashboard.
 *
 * NOTE: Etherscan free tier limitations:
 * - No direct market cap endpoint (would need price * circulating supply from a pricing API)
 * - No TVL endpoint (would need to query Uniswap pool reserves via on-chain call or DEX API)
 * - No 24h volume endpoint (would need DEX aggregator API like CoinGecko or CoinGecko)
 * - No direct holder count endpoint (requires Pro tier)
 *
 * TODO: Integrate CoinGecko API or CoinGecko API for price, market cap, and volume data.
 * TODO: Query Uniswap V2 pool reserves for TVL calculation.
 * TODO: Use Alchemy/Moralis for holder count.
 *
 * For now: fetch what we can (token supply) and use placeholder values for the rest.
 */
export async function fetchTokenStats(): Promise<TokenStats> {
  try {
    const supply = await fetchTokenSupply();

    // Convert raw supply (18 decimals) to human-readable
    const supplyNum = parseFloat(supply) / 1e18;

    return {
      // TODO: Replace with real price from CoinGecko or CoinGecko API
      price: "—",
      // TODO: Replace with real market cap (price * circulating supply)
      marketCap: "—",
      // TODO: Replace with real TVL from Uniswap pool query
      tvl: "—",
      // TODO: Replace with real 24h volume from CoinGecko or CoinGecko
      volume24h: "—",
      // TODO: Replace with real holder count from Alchemy/Moralis or Etherscan Pro
      holders: 14000,
    };
  } catch {
    return {
      price: "—",
      marketCap: "—",
      tvl: "—",
      volume24h: "—",
      holders: 0,
    };
  }
}
