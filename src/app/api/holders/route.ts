import { NextResponse } from "next/server";

const OG_WOJAK_CONTRACT = "0x5026F006B85729a8b14553FAE6af249aD16c9aaB";
const ETHERSCAN_TOKEN_URL = `https://etherscan.io/token/${OG_WOJAK_CONTRACT}`;

// Minimum sane holder count — anything below this is obviously wrong
const MIN_HOLDER_THRESHOLD = 1000;

// In-memory cache
let cachedHolders: number | null = null;
let cachedAt: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function scrapeHolderCount(): Promise<number | null> {
  try {
    const res = await fetch(ETHERSCAN_TOKEN_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[holders] Etherscan returned HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();

    if (html.length < 10000) {
      console.warn(`[holders] Response too small (${html.length} bytes) — likely captcha/block`);
      return null;
    }

    // Ordered by reliability — simplest/most stable patterns first
    const patterns: { name: string; regex: RegExp; group: number }[] = [
      // Pattern 1: Meta description tag — most stable, always present
      // <meta name="Description" content="...Holders: 19,504 |..."
      {
        name: "meta description",
        regex: /Holders:\s*([\d]{1,3}(?:,\d{3})+)/i,
        group: 1,
      },
      // Pattern 2: tokenHolders div — the actual holder section on the page
      // <div id="ContentPlaceHolder1_tr_tokenHolders">...<div>\n 19,504  <span
      {
        name: "tokenHolders div",
        regex: /tr_tokenHolders[\s\S]{0,300}?>\s*([\d]{1,3}(?:,\d{3})+)\s/,
        group: 1,
      },
      // Pattern 3: Number followed by percentage change — "19,504  <span...>(-0.031%)"
      {
        name: "number with pct change",
        regex: /([\d]{1,3}(?:,\d{3})+)\s+<span[^>]*>.*?[\d.]+%/,
        group: 1,
      },
    ];

    for (const { name, regex, group } of patterns) {
      const match = html.match(regex);
      if (match) {
        const value = parseInt(match[group].replace(/,/g, ""), 10);
        if (isNaN(value)) continue;
        console.log(`[holders] Pattern "${name}" matched: raw="${match[group]}" parsed=${value}`);
        if (value >= MIN_HOLDER_THRESHOLD) {
          return value;
        }
        console.warn(`[holders] Pattern "${name}" returned ${value} — below threshold, skipping`);
      }
    }

    console.warn("[holders] No pattern matched a valid holder count");
    return null;
  } catch (err) {
    console.error("[holders] Scrape error:", err);
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

  const holders = await scrapeHolderCount();

  if (holders !== null && holders >= MIN_HOLDER_THRESHOLD) {
    cachedHolders = holders;
    cachedAt = now;

    return NextResponse.json(
      {
        holders,
        source: "etherscan",
        lastUpdated: new Date(now).toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  }

  // Scrape failed — return stale cached value if we have one
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
