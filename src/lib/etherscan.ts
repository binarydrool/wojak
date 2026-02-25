import type { Trade } from "@/types";

/**
 * Fetch recent trades for OG WOJAK via /api/trades (server-side on-chain event logs).
 * Returns the most recent 25 trades with buy/sell type, amount, price, and wallet.
 */
export async function fetchRecentTrades(): Promise<Trade[]> {
  try {
    const res = await fetch("/api/trades");
    if (!res.ok) return [];
    const data = await res.json();
    return data.trades ?? [];
  } catch {
    return [];
  }
}
