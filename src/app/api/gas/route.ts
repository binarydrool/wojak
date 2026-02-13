import { NextResponse } from "next/server";

// In-memory cache — 30 seconds
let cached: { gasGwei: number } | null = null;
let cachedAt = 0;
const CACHE_TTL = 30 * 1000;

async function fetchGasPrice(): Promise<number | null> {
  // Try public Ethereum RPC (eth_gasPrice returns hex wei)
  const rpcUrls = [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com",
  ];

  for (const rpcUrl of rpcUrls) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_gasPrice",
          params: [],
          id: 1,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) continue;
      const json = await res.json();
      if (json.result) {
        const wei = parseInt(json.result, 16);
        const gwei = wei / 1e9;
        return gwei;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function GET() {
  const now = Date.now();

  if (cached && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(
      { ...cached, source: "cache" },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } }
    );
  }

  const gasGwei = await fetchGasPrice();

  if (gasGwei !== null) {
    cached = { gasGwei };
    cachedAt = now;
    return NextResponse.json(
      { gasGwei, source: "rpc" },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } }
    );
  }

  if (cached) {
    return NextResponse.json(
      { ...cached, source: "stale-cache" },
      { headers: { "Cache-Control": "public, max-age=10, s-maxage=10" } }
    );
  }

  return NextResponse.json(
    { gasGwei: null, source: "unavailable" },
    { status: 503, headers: { "Cache-Control": "no-cache" } }
  );
}
