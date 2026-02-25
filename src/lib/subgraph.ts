import { OG_UNISWAP_POOL } from "./constants";
import type { Trade } from "@/types";

/**
 * On-chain swap event queries via eth_getLogs.
 * Replaces the deprecated Uniswap V2 subgraph with direct RPC reads.
 *
 * Uniswap V2 Swap event:
 *   Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)
 *   topic0: 0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822
 */

const PAIR_ADDRESS = OG_UNISWAP_POOL.toLowerCase();
const SWAP_TOPIC =
  "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822";

const RPC_URLS = [
  "https://eth.llamarpc.com",
  "https://ethereum-rpc.publicnode.com",
  "https://eth.drpc.org",
];

// ~12 seconds per block on Ethereum
const BLOCKS_PER_HOUR = 300;
const BLOCKS_PER_DAY = 7200;

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  for (const rpcUrl of RPC_URLS) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (json.error) continue;
      if (json.result !== undefined) return json.result;
    } catch {
      continue;
    }
  }
  return null;
}

async function getBlockNumber(): Promise<number> {
  const result = await rpcCall("eth_blockNumber", []);
  if (!result) throw new Error("Failed to get block number");
  return parseInt(result as string, 16);
}

interface SwapLog {
  transactionHash: string;
  blockNumber: string;
  topics: string[];
  data: string;
}

async function getSwapLogs(fromBlock: number, toBlock: number): Promise<SwapLog[]> {
  // Free RPCs have a ~2000 block range limit for getLogs, so chunk if needed
  const MAX_RANGE = 2000;
  const logs: SwapLog[] = [];

  for (let start = fromBlock; start <= toBlock; start += MAX_RANGE) {
    const end = Math.min(start + MAX_RANGE - 1, toBlock);
    const result = await rpcCall("eth_getLogs", [
      {
        address: PAIR_ADDRESS,
        topics: [SWAP_TOPIC],
        fromBlock: "0x" + start.toString(16),
        toBlock: "0x" + end.toString(16),
      },
    ]);
    if (Array.isArray(result)) {
      logs.push(...(result as SwapLog[]));
    }
  }

  return logs;
}

interface ParsedSwap {
  txHash: string;
  blockNumber: number;
  sender: string;
  to: string;
  amount0In: bigint;
  amount1In: bigint;
  amount0Out: bigint;
  amount1Out: bigint;
  isBuy: boolean;
}

function parseSwapLog(log: SwapLog): ParsedSwap {
  // topics[1] = sender (indexed), topics[2] = to (indexed)
  const sender = "0x" + log.topics[1].slice(26);
  const to = "0x" + log.topics[2].slice(26);

  // data = amount0In (32 bytes) + amount1In (32 bytes) + amount0Out (32 bytes) + amount1Out (32 bytes)
  const data = log.data.slice(2);
  const amount0In = BigInt("0x" + data.slice(0, 64));
  const amount1In = BigInt("0x" + data.slice(64, 128));
  const amount0Out = BigInt("0x" + data.slice(128, 192));
  const amount1Out = BigInt("0x" + data.slice(192, 256));

  // WOJAK is token0. Buy = WOJAK out (amount0Out > 0), Sell = WOJAK in (amount0In > 0)
  const isBuy = amount0Out > BigInt(0);

  return {
    txHash: log.transactionHash,
    blockNumber: parseInt(log.blockNumber, 16),
    sender,
    to,
    amount0In,
    amount1In,
    amount0Out,
    amount1Out,
    isBuy,
  };
}

// ---------------------------------------------------------------------------
// Volume (multi-timeframe) + buy/sell counts — computed from Swap events
// ---------------------------------------------------------------------------

export async function fetchVolumeMultiTimeframe(): Promise<{
  volume1h: number;
  volume6h: number;
  volume24h: number;
}> {
  try {
    const currentBlock = await getBlockNumber();
    const fromBlock24h = currentBlock - BLOCKS_PER_DAY;
    const fromBlock6h = currentBlock - BLOCKS_PER_HOUR * 6;
    const fromBlock1h = currentBlock - BLOCKS_PER_HOUR;

    const logs = await getSwapLogs(fromBlock24h, currentBlock);
    const swaps = logs.map(parseSwapLog);

    let volume24h = 0;
    let volume6h = 0;
    let volume1h = 0;

    for (const swap of swaps) {
      // Volume in ETH (token1). Use the "in" side for volume.
      const ethAmount =
        Number(swap.isBuy ? swap.amount1In : swap.amount1Out) / 1e18;
      const vol = Math.abs(ethAmount);

      volume24h += vol;
      if (swap.blockNumber >= fromBlock6h) volume6h += vol;
      if (swap.blockNumber >= fromBlock1h) volume1h += vol;
    }

    return { volume1h, volume6h, volume24h };
  } catch (err) {
    console.error("[subgraph] fetchVolumeMultiTimeframe error:", err);
    return { volume1h: 0, volume6h: 0, volume24h: 0 };
  }
}

export async function fetchBuySellCounts24h(): Promise<{
  buys: number;
  sells: number;
  buyers: number;
  sellers: number;
}> {
  try {
    const currentBlock = await getBlockNumber();
    const fromBlock = currentBlock - BLOCKS_PER_DAY;
    const logs = await getSwapLogs(fromBlock, currentBlock);
    const swaps = logs.map(parseSwapLog);

    let buys = 0;
    let sells = 0;
    const buyerSet = new Set<string>();
    const sellerSet = new Set<string>();

    for (const swap of swaps) {
      if (swap.isBuy) {
        buys++;
        buyerSet.add(swap.to.toLowerCase());
      } else {
        sells++;
        sellerSet.add(swap.sender.toLowerCase());
      }
    }

    return { buys, sells, buyers: buyerSet.size, sellers: sellerSet.size };
  } catch (err) {
    console.error("[subgraph] fetchBuySellCounts24h error:", err);
    return { buys: 0, sells: 0, buyers: 0, sellers: 0 };
  }
}

// ---------------------------------------------------------------------------
// Price history (change percentages) — from on-chain getReserves at past blocks
// ---------------------------------------------------------------------------

// WETH/USDC Uniswap V2 pair — used to derive ETH/USD price on-chain
// token0 = USDC (6 decimals), token1 = WETH (18 decimals)
const WETH_USDC_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

async function getReservesAtBlock(
  pairAddress: string,
  blockNumber: number
): Promise<{ reserve0: number; reserve1: number } | null> {
  const blockHex = "0x" + blockNumber.toString(16);
  for (const rpcUrl of RPC_URLS) {
    try {
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            { to: pairAddress, data: "0x0902f1ac" },
            blockHex,
          ],
          id: 1,
        }),
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (!json.result || json.result === "0x") continue;

      const hex = (json.result as string).slice(2);
      const reserve0 = Number(BigInt("0x" + hex.slice(0, 64)));
      const reserve1 = Number(BigInt("0x" + hex.slice(64, 128)));

      return { reserve0, reserve1 };
    } catch {
      continue;
    }
  }
  return null;
}

/** Get WOJAK/WETH reserves at a block. WOJAK is token0 (18 dec), WETH is token1 (18 dec). */
async function getWojakReservesAtBlock(
  blockNumber: number
): Promise<{ wojakReserve: number; ethReserve: number } | null> {
  const raw = await getReservesAtBlock(OG_UNISWAP_POOL, blockNumber);
  if (!raw) return null;
  return { wojakReserve: raw.reserve0 / 1e18, ethReserve: raw.reserve1 / 1e18 };
}

/** Get ETH/USD price at a block from WETH/USDC pair. token0=USDC(6dec), token1=WETH(18dec). */
async function getEthPriceAtBlock(blockNumber: number): Promise<number | null> {
  const raw = await getReservesAtBlock(WETH_USDC_PAIR, blockNumber);
  if (!raw || raw.reserve1 === 0) return null;
  // ETH price = (usdcReserve / 1e6) / (wethReserve / 1e18) = usdcReserve * 1e12 / wethReserve
  return (raw.reserve0 * 1e12) / raw.reserve1;
}

export interface PriceHistoryResult {
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  usdChange1h: number | null;
  usdChange24h: number | null;
  usdChange7d: number | null;
  usdChange30d: number | null;
}

export async function fetchPriceHistory(): Promise<PriceHistoryResult> {
  const nullResult: PriceHistoryResult = {
    change1h: null, change24h: null, change7d: null, change30d: null,
    usdChange1h: null, usdChange24h: null, usdChange7d: null, usdChange30d: null,
  };

  try {
    const currentBlock = await getBlockNumber();

    const blockTargets = {
      h1: currentBlock - BLOCKS_PER_HOUR,
      h24: currentBlock - BLOCKS_PER_DAY,
      d7: currentBlock - BLOCKS_PER_DAY * 7,
      d30: currentBlock - BLOCKS_PER_DAY * 30,
    };

    // Fetch WOJAK/WETH reserves and ETH/USD prices at all timepoints in parallel
    const [
      current, h1, h24, d7, d30,
      ethNow, ethH1, ethH24, ethD7, ethD30,
    ] = await Promise.all([
      getWojakReservesAtBlock(currentBlock),
      getWojakReservesAtBlock(blockTargets.h1),
      getWojakReservesAtBlock(blockTargets.h24),
      getWojakReservesAtBlock(blockTargets.d7),
      getWojakReservesAtBlock(blockTargets.d30),
      getEthPriceAtBlock(currentBlock),
      getEthPriceAtBlock(blockTargets.h1),
      getEthPriceAtBlock(blockTargets.h24),
      getEthPriceAtBlock(blockTargets.d7),
      getEthPriceAtBlock(blockTargets.d30),
    ]);

    if (!current || current.wojakReserve === 0) return nullResult;

    const currentPriceEth = current.ethReserve / current.wojakReserve;

    // ETH-denominated % change (WOJAK price in ETH)
    const ethPctChange = (
      hist: { wojakReserve: number; ethReserve: number } | null
    ): number | null => {
      if (!hist || hist.wojakReserve === 0) return null;
      const histPrice = hist.ethReserve / hist.wojakReserve;
      if (!histPrice) return null;
      return ((currentPriceEth - histPrice) / histPrice) * 100;
    };

    // USD-denominated % change (WOJAK price in USD = priceEth * ethPriceUsd)
    const usdPctChange = (
      hist: { wojakReserve: number; ethReserve: number } | null,
      histEthPrice: number | null
    ): number | null => {
      if (!hist || hist.wojakReserve === 0 || !ethNow || !histEthPrice) return null;
      const histPriceEth = hist.ethReserve / hist.wojakReserve;
      if (!histPriceEth) return null;
      const currentPriceUsd = currentPriceEth * ethNow;
      const histPriceUsd = histPriceEth * histEthPrice;
      if (!histPriceUsd) return null;
      return ((currentPriceUsd - histPriceUsd) / histPriceUsd) * 100;
    };

    return {
      change1h: ethPctChange(h1),
      change24h: ethPctChange(h24),
      change7d: ethPctChange(d7),
      change30d: ethPctChange(d30),
      usdChange1h: usdPctChange(h1, ethH1),
      usdChange24h: usdPctChange(h24, ethH24),
      usdChange7d: usdPctChange(d7, ethD7),
      usdChange30d: usdPctChange(d30, ethD30),
    };
  } catch (err) {
    console.error("[subgraph] fetchPriceHistory error:", err);
    return nullResult;
  }
}

// ---------------------------------------------------------------------------
// Recent swaps (for RecentTrades component)
// ---------------------------------------------------------------------------

export async function fetchRecentSwaps(): Promise<Trade[]> {
  try {
    const currentBlock = await getBlockNumber();
    // Look back ~2000 blocks (~7 hours) for recent trades
    const fromBlock = currentBlock - 2000;
    const logs = await getSwapLogs(fromBlock, currentBlock);

    // Sort by block number descending, take latest 25
    logs.sort(
      (a, b) => parseInt(b.blockNumber, 16) - parseInt(a.blockNumber, 16)
    );
    const recent = logs.slice(0, 25);

    return recent.map((log) => {
      const swap = parseSwapLog(log);

      // WOJAK amount (token0)
      const wojakAmount =
        Number(swap.isBuy ? swap.amount0Out : swap.amount0In) / 1e18;
      // ETH amount (token1)
      const ethAmount =
        Number(swap.isBuy ? swap.amount1In : swap.amount1Out) / 1e18;

      // Approximate price per WOJAK in ETH (then convert in frontend)
      const priceEth = wojakAmount > 0 ? ethAmount / wojakAmount : 0;

      // Estimate block timestamp: current time - (currentBlock - swapBlock) * 12
      const blocksAgo = currentBlock - swap.blockNumber;
      const timestamp = Math.floor(Date.now() / 1000) - blocksAgo * 12;

      return {
        hash: swap.txHash,
        type: swap.isBuy ? ("buy" as const) : ("sell" as const),
        amount: wojakAmount.toFixed(0),
        wallet: swap.isBuy ? swap.to : swap.sender,
        timestamp,
        priceUsd: priceEth.toFixed(12),
        volumeUsd: ethAmount.toFixed(6),
      };
    });
  } catch (err) {
    console.error("[subgraph] fetchRecentSwaps error:", err);
    return [];
  }
}
