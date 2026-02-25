import { OG_UNISWAP_POOL } from "./constants";

const WOJAK_ADDRESS = "0x5026F006B85729a8b14553FAE6af249aD16c9aaB";
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
let _isWojakToken0: boolean | null = null;

/**
 * Determine token order in the Uniswap V2 pair by calling token0().
 * WOJAK (0x5026) < WETH (0xC02a) lexicographically, so WOJAK should be token0.
 */
async function getTokenOrder(): Promise<boolean> {
  if (_isWojakToken0 !== null) return _isWojakToken0;
  // token0() selector: 0x0dfe1681
  const result = await ethCall(OG_UNISWAP_POOL, "0x0dfe1681");
  // Result is 32 bytes, address is in the last 20 bytes
  const token0Addr = "0x" + result.slice(26).toLowerCase();
  _isWojakToken0 = token0Addr === WOJAK_ADDRESS.toLowerCase();
  return _isWojakToken0;
}

/**
 * Call getReserves() on the Uniswap V2 pair.
 * Returns reserves respecting token order.
 */
async function getReserves(): Promise<{ wojakReserve: bigint; ethReserve: bigint }> {
  const [isWojakToken0, result] = await Promise.all([
    getTokenOrder(),
    // getReserves() selector: 0x0902f1ac
    ethCall(OG_UNISWAP_POOL, "0x0902f1ac"),
  ]);

  // Response: 3x 32-byte words (reserve0, reserve1, blockTimestampLast)
  const hex = result.slice(2); // remove 0x
  const reserve0 = BigInt("0x" + hex.slice(0, 64));
  const reserve1 = BigInt("0x" + hex.slice(64, 128));

  if (isWojakToken0) {
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
}

/**
 * Main export: fetch live on-chain data from Uniswap V2 reserves.
 * WOJAK price derived from WOJAK/WETH pair, ETH price from WETH/USDC pair.
 */
export async function fetchOnChainData(): Promise<OnChainData> {
  const [reserves, ethPriceUsd] = await Promise.all([
    getReserves(),
    getEthPrice(),
  ]);

  // Both WOJAK and WETH have 18 decimals — ratio gives direct ETH price
  const wojakReserveNum = Number(reserves.wojakReserve) / 1e18;
  const ethReserveNum = Number(reserves.ethReserve) / 1e18;

  const wojakPriceEth = ethReserveNum / wojakReserveNum;
  const wojakPriceUsd = wojakPriceEth * ethPriceUsd;

  // Uniswap V2 is 50/50 — TVL = 2 * ETH side value
  const tvlUsd = ethReserveNum * ethPriceUsd * 2;

  return {
    wojakReserve: wojakReserveNum,
    ethReserve: ethReserveNum,
    wojakPriceEth,
    wojakPriceUsd,
    ethPriceUsd,
    tvlUsd,
  };
}
