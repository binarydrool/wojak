import { OG_UNISWAP_POOL } from "./constants";
import type { Trade } from "@/types";

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
