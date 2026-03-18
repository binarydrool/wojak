import { OG_UNISWAP_POOL } from "./constants";

const WOJAK_ADDRESS = "0x8De39B057CC6522230AB19C0205080a8663331Ef";
// WETH/USDC Uniswap V2 pair — used to derive ETH/USD price on-chain
// token0 = USDC (6 decimals), token1 = WETH (18 decimals)
const WETH_USDC_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

const RPC_URLS = [
  "https://eth.llamarpc.com",
  "https://ethereum-rpc.publicnode.com",
  "https://eth.drpc.org",
];

/**
 * Raw eth_call with RPC fallback chain. Returns hex result string.
 */
export async function ethCall(to: string, data: string): Promise<string> {
  for (const rpcUrl of RPC_URLS) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to, data }, "latest"],
          id: 1,
        }),
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (json.result && json.result !== "0x") return json.result;
    } catch {
      continue;
    }
  }
  throw new Error(`eth_call failed for ${to}`);
}

// Cache token order (module-level, persists across requests in same server instance)
let _isWojakcto0: boolean | null = null;

/**
 * Determine token order in the Uniswap V2 pair by calling token0().
 * WOJAK (0x5026) < WETH (0xC02a) lexicographically, so WOJAK should be token0.
 */
async function getTokenOrder(): Promise<boolean> {
  if (_isWojakcto0 !== null) return _isWojakcto0;
  // token0() selector: 0x0dfe1681
  const result = await ethCall(OG_UNISWAP_POOL, "0x0dfe1681");
  // Result is 32 bytes, address is in the last 20 bytes
  const token0Addr = "0x" + result.slice(26).toLowerCase();
  _isWojakcto0 = token0Addr === WOJAK_ADDRESS.toLowerCase();
  return _isWojakcto0;
}

/**
 * Call getReserves() on the Uniswap V2 pair.
 * Returns reserves respecting token order.
 */
async function getReserves(): Promise<{ wojakReserve: bigint; ethReserve: bigint }> {
  const [isWojakcto0, result] = await Promise.all([
    getTokenOrder(),
    // getReserves() selector: 0x0902f1ac
    ethCall(OG_UNISWAP_POOL, "0x0902f1ac"),
  ]);

  // Response: 3x 32-byte words (reserve0, reserve1, blockTimestampLast)
  const hex = result.slice(2); // remove 0x
  const reserve0 = BigInt("0x" + hex.slice(0, 64));
  const reserve1 = BigInt("0x" + hex.slice(64, 128));

  if (isWojakcto0) {
    return { wojakReserve: reserve0, ethReserve: reserve1 };
  }
  return { wojakReserve: reserve1, ethReserve: reserve0 };
}

/**
 * Get ETH/USD price from the WETH/USDC Uniswap V2 pair reserves.
 * token0 = USDC (6 decimals), token1 = WETH (18 decimals)
 * ETH price = (reserve0 / 1e6) / (reserve1 / 1e18)
 */
async function getEthPrice(): Promise<number> {
  // getReserves() selector: 0x0902f1ac
  const result = await ethCall(WETH_USDC_PAIR, "0x0902f1ac");
  const hex = result.slice(2);
  const usdcReserve = BigInt("0x" + hex.slice(0, 64));
  const wethReserve = BigInt("0x" + hex.slice(64, 128));

  // USDC has 6 decimals, WETH has 18 decimals
  // ETH price = (usdcReserve / 1e6) / (wethReserve / 1e18)
  //           = usdcReserve * 1e12 / wethReserve
  return (Number(usdcReserve) * 1e12) / Number(wethReserve);
}

export interface OnChainData {
  wojakReserve: number;
  ethReserve: number;
  wojakPriceEth: number;
  wojakPriceUsd: number;
  ethPriceUsd: number;
  tvlUsd: number;
  marketCapUsd: number;
}

const GECKO_TERMINAL_URL =
  "https://api.geckoterminal.com/api/v2/networks/eth/pools/0xcaA3A16F8440F85303aFaab1992f2b97D12469B1";

/**
 * Main export: fetch live pool data from GeckoTerminal API.
 */
export async function fetchOnChainData(): Promise<OnChainData> {
  const res = await fetch(GECKO_TERMINAL_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(`GeckoTerminal API error: ${res.status}`);
  }

  const json = await res.json();
  const attrs = json.data.attributes;

  const wojakPriceUsd = parseFloat(attrs.base_token_price_usd) || 0;
  const ethPriceUsd = parseFloat(attrs.quote_token_price_usd) || 0;

  // Use reserve data if available, otherwise default to 0
  const wojakReserve = parseFloat(attrs.reserve_in_usd) > 0
    ? parseFloat(attrs.reserve_in_usd) / 2 / wojakPriceUsd
    : 0;
  const ethReserve = parseFloat(attrs.reserve_in_usd) > 0
    ? parseFloat(attrs.reserve_in_usd) / 2 / ethPriceUsd
    : 0;

  const tvlUsd = ethReserve * ethPriceUsd * 2;

  const wojakPriceEth = ethPriceUsd > 0 ? wojakPriceUsd / ethPriceUsd : 0;
  const marketCapUsd = parseFloat(attrs.market_cap_usd) || 0;

  return {
    wojakReserve,
    ethReserve,
    wojakPriceEth,
    wojakPriceUsd,
    ethPriceUsd,
    tvlUsd,
    marketCapUsd,
  };
}
