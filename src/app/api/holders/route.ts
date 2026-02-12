import { NextResponse } from "next/server";

const OG_WOJAK_CONTRACT = "0x5026F006B85729a8b14553FAE6af249aD16c9aaB";
const ETHPLORER_URL = `https://api.ethplorer.io/getTokenInfo/${OG_WOJAK_CONTRACT}?apiKey=freekey`;

// Minimum sane holder count — anything below this is obviously wrong
const MIN_HOLDER_THRESHOLD = 1000;

// In-memory cache
let cachedHolders: number | null = null;
let cachedAt: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchHolderCount(): Promise<number | null> {
  try {
    const res = await fetch(ETHPLORER_URL, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[holders] Ethplorer returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (typeof data.holdersCount === "number" && data.holdersCount >= MIN_HOLDER_THRESHOLD) {
      console.log(`[holders] Ethplorer returned holdersCount=${data.holdersCount}`);
      return data.holdersCount;
    }

    console.warn(`[holders] Ethplorer holdersCount missing or invalid:`, data.holdersCount);
    return null;
  } catch (err) {
    console.error("[holders] Ethplorer fetch error:", err);
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  // Return cached value if still fresh
  if (cachedHolders !== null && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(
      {
        holders: cachedHolders,
        source: "cache",
        lastUpdated: new Date(cachedAt).toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  }

  const holders = await fetchHolderCount();

  if (holders !== null && holders >= MIN_HOLDER_THRESHOLD) {
    cachedHolders = holders;
    cachedAt = now;

    return NextResponse.json(
      {
        holders,
        source: "ethplorer",
        lastUpdated: new Date(now).toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  }

  // Fetch failed — return stale cached value if we have one
  if (cachedHolders !== null && cachedHolders >= MIN_HOLDER_THRESHOLD) {
    return NextResponse.json(
      {
        holders: cachedHolders,
        source: "stale-cache",
        lastUpdated: new Date(cachedAt).toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  }

  // No data at all — return null, dashboard shows "—"
  return NextResponse.json(
    {
      holders: null,
      source: "unavailable",
      lastUpdated: null,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-cache",
      },
    }
  );
}
