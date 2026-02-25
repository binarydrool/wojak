import { NextResponse } from "next/server";

// In-memory cache — 30 seconds
let cached: { gasGwei: number } | null = null;
let cachedAt = 0;
const CACHE_TTL = 30 * 1000;

async function fetchFromEtherscan(): Promise<number | null> {
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  if (!apiKey || apiKey === "your_key_here") return null;
  try {
    const res = await fetch(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status === "1" && json.result?.ProposeGasPrice) {
      return parseFloat(json.result.ProposeGasPrice);
    }
  } catch {}
  return null;
}

async function fetchFromRpc(): Promise<number | null> {
  const rpcUrls = [
    "https://ethereum-rpc.publicnode.com",
    "https://1rpc.io/eth",
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

async function fetchGasPrice(): Promise<number | null> {
  // Try Etherscan gas oracle first (most reliable with API key)
  const etherscanResult = await fetchFromEtherscan();
  if (etherscanResult !== null) return etherscanResult;

  // Fallback to public RPC endpoints
  return fetchFromRpc();
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
