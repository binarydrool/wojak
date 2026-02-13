import { NextResponse } from "next/server";

const OG_WOJAK_CONTRACT = "0x5026F006B85729a8b14553FAE6af249aD16c9aaB";
const ETHPLORER_URL = `https://api.ethplorer.io/getTopTokenHolders/${OG_WOJAK_CONTRACT}?apiKey=freekey&limit=1000`;

export interface HolderEntry {
  address: string;
  balance: number;
  share: number; // percentage of total supply
}

// In-memory cache
let cachedHolders: HolderEntry[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchTopHolders(): Promise<HolderEntry[] | null> {
  try {
    const res = await fetch(ETHPLORER_URL, { cache: "no-store" });

    if (!res.ok) {
      console.error(`[holders/list] Ethplorer returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (!data.holders || !Array.isArray(data.holders)) {
      return null;
    }

    const holders: HolderEntry[] = data.holders.map(
      (h: { address: string; balance: number; share: number }) => ({
        address: h.address,
        balance: h.balance,
        share: h.share,
      })
    );

    if (holders.length === 0) {
      return null;
    }

    return holders;
  } catch (err) {
    console.error("[holders/list] Ethplorer fetch error:", err);
    return null;
  }
}

// Realistic fallback data if API is unavailable
function getMockHolders(): HolderEntry[] {
  const totalSupply = 69_420_000_000_000;
  const mockData: { address: string; pct: number }[] = [
    { address: "0x000000000000000000000000000000000000dEaD", pct: 42.5 },
    { address: "0x0f23D49bC92Ec52FF591D091b3e16c937034496e", pct: 8.2 },
    { address: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", pct: 3.1 },
    { address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", pct: 2.4 },
    { address: "0xDef1C0ded9bec7F1a1670819833240f027b25EfF", pct: 1.8 },
    { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", pct: 1.5 },
    { address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", pct: 1.2 },
    { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", pct: 0.95 },
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", pct: 0.88 },
    { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", pct: 0.76 },
  ];

  // Generate 990 more holders with decreasing percentages
  let remaining = 100 - mockData.reduce((s, h) => s + h.pct, 0);
  for (let i = 0; i < 990; i++) {
    const pct = Math.max(0.0001, remaining * 0.008 * Math.pow(0.997, i));
    remaining -= pct;
    const addr =
      "0x" +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
    mockData.push({ address: addr, pct });
  }

  return mockData.map((h) => ({
    address: h.address,
    balance: (h.pct / 100) * totalSupply,
    share: h.pct,
  }));
}

export async function GET() {
  const now = Date.now();

  // Return cached value if still fresh
  if (cachedHolders && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(
      { holders: cachedHolders, source: "cache", count: cachedHolders.length },
      { headers: { "Cache-Control": "public, max-age=1800, s-maxage=1800" } }
    );
  }

  const holders = await fetchTopHolders();

  if (holders && holders.length > 0) {
    cachedHolders = holders;
    cachedAt = now;
    return NextResponse.json(
      { holders, source: "ethplorer", count: holders.length },
      { headers: { "Cache-Control": "public, max-age=1800, s-maxage=1800" } }
    );
  }

  // Stale cache fallback
  if (cachedHolders && cachedHolders.length > 0) {
    return NextResponse.json(
      { holders: cachedHolders, source: "stale-cache", count: cachedHolders.length },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
  }

  // Mock data fallback
  const mock = getMockHolders();
  return NextResponse.json(
    { holders: mock, source: "mock", count: mock.length },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
  );
}
