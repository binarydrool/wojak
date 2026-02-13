"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import PriceChart from "./PriceChart";
import RecentTrades from "./RecentTrades";
import DextScoreInline from "./DextScoreInline";
import { formatCurrency } from "@/lib/coingecko";
import { OG_UNISWAP_POOL, ETHERSCAN_BASE_URL, LP_LOCK_EXPIRY, UNISWAP_POOL_URL } from "@/lib/constants";
import type { PoolData } from "@/types";

const BubbleMapModal = lazy(() => import("./BubbleMapModal"));

const TABS = ["Chart", "Transactions", "TVL", "Volume"] as const;
type Tab = (typeof TABS)[number];

/* ── Helpers ── */

function formatTokenAmount(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}

/* ── Shared hook ── */

function usePoolData() {
  const [data, setData] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pool")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

/* ── Skeleton ── */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-wojak-border rounded animate-pulse ${className}`} />;
}

/* ── TVL Panel (condensed) ── */

function TVLPanel({ data, loading }: { data: PoolData | null; loading: boolean }) {
  const poolAddress = OG_UNISWAP_POOL;
  const truncated = `${poolAddress.slice(0, 10)}...${poolAddress.slice(-8)}`;

  const tvlUsd = data?.tvlUsd ?? 0;
  const wojakReserve = data?.wojakReserve ?? 0;
  const ethReserve = data?.ethReserve ?? 0;
  const wojakValue = data?.wojakPrice ? wojakReserve * data.wojakPrice : 0;
  const ethValue = data?.ethPrice ? ethReserve * data.ethPrice : 0;
  const total = wojakValue + ethValue;
  const wojakPct = total > 0 ? (wojakValue / total) * 100 : 50;
  const ethPct = total > 0 ? (ethValue / total) * 100 : 50;

  return (
    <div className="h-full p-4 sm:p-5 flex flex-col justify-between">
      {/* TVL + Pool Balances side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* TVL Value */}
        <div className="text-center sm:text-left py-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Value Locked</p>
          {loading ? (
            <Skeleton className="h-9 w-36 mx-auto sm:mx-0" />
          ) : (
            <p className="text-3xl font-bold text-wojak-green">
              {tvlUsd > 0 ? formatCurrency(tvlUsd) : "—"}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">Uniswap V2 — WOJAK/WETH</p>
        </div>

        {/* Pool Balances */}
        <div className="bg-black/20 border border-wojak-border rounded-lg p-3 space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Pool Balances</p>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-white font-medium">
                      {wojakReserve > 0 ? formatTokenAmount(wojakReserve) : "—"} WOJAK
                    </span>
                  </span>
                  <span className="text-gray-400">{wojakPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-wojak-border rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${wojakPct}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-white font-medium">
                      {ethReserve > 0 ? formatTokenAmount(ethReserve) : "—"} ETH
                    </span>
                  </span>
                  <span className="text-gray-400">{ethPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-wojak-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${ethPct}%` }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4-column info grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-black/20 border border-wojak-border rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Pool Type</p>
          <p className="text-xs font-semibold text-white">Uniswap V2</p>
        </div>
        <div className="bg-black/20 border border-wojak-border rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Fee Tier</p>
          <p className="text-xs font-semibold text-white">0.3%</p>
        </div>
        <div className="bg-black/20 border border-wojak-border rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Pair</p>
          <p className="text-xs font-semibold text-white">WOJAK/WETH</p>
        </div>
        <div className="bg-black/20 border border-wojak-border rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">LP Lock</p>
          <p className="text-xs font-semibold text-wojak-green">{LP_LOCK_EXPIRY}</p>
        </div>
      </div>

      {/* Pool address + LP lock — compact row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="bg-black/20 border border-wojak-border rounded-lg p-3">
          <p className="text-[10px] text-gray-500 mb-0.5">Pool Address</p>
          <a
            href={`${ETHERSCAN_BASE_URL}/address/${poolAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-wojak-green hover:underline"
          >
            {truncated}
          </a>
        </div>
        <div className="bg-wojak-green/5 border border-wojak-green/20 rounded-lg p-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wojak-green shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-wojak-green">Locked Until {LP_LOCK_EXPIRY}</p>
            <p className="text-[10px] text-gray-300">Cannot be rugged or withdrawn</p>
          </div>
        </div>
      </div>

      {/* Uniswap link */}
      <div className="text-center">
        <a
          href={UNISWAP_POOL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-wojak-green hover:underline"
        >
          View Liquidity Pool on Uniswap
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ── Volume Panel (condensed) ── */

function VolumePanel({ data, loading }: { data: PoolData | null; loading: boolean }) {
  const volume24h = data?.volume24h ?? 0;
  const fees24h = data?.fees24h ?? 0;
  const buys = data?.buys24h ?? 0;
  const sells = data?.sells24h ?? 0;
  const buyers = data?.buyers24h ?? 0;
  const sellers = data?.sellers24h ?? 0;
  const totalTxns = buys + sells;
  const uniqueTraders = buyers + sellers;
  const buyPct = totalTxns > 0 ? ((buys / totalTxns) * 100).toFixed(1) : "—";
  const sellPct = totalTxns > 0 ? ((sells / totalTxns) * 100).toFixed(1) : "—";

  return (
    <div className="h-full p-4 sm:p-5 flex flex-col justify-between">
      {/* 24h Volume headline */}
      <div className="text-center py-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">24h Volume</p>
        {loading ? (
          <Skeleton className="h-9 w-36 mx-auto" />
        ) : (
          <p className="text-3xl font-bold text-wojak-green">
            {volume24h > 0 ? formatCurrency(volume24h) : "—"}
          </p>
        )}
      </div>

      {/* 2x2 stats grid — compact */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/20 border border-wojak-border rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">24h Fees</p>
            <p className="text-xs font-semibold text-white">
              {fees24h > 0 ? formatCurrency(fees24h) : "—"}
            </p>
          </div>
          <div className="bg-black/20 border border-wojak-border rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Buy / Sell Ratio</p>
            <p className="text-xs font-semibold text-white">
              <span className="text-green-400">{buyPct}%</span>
              {" / "}
              <span className="text-red-400">{sellPct}%</span>
            </p>
          </div>
          <div className="bg-black/20 border border-wojak-border rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Unique Traders (24h)</p>
            <p className="text-xs font-semibold text-white">
              {uniqueTraders > 0 ? uniqueTraders.toLocaleString() : "—"}
            </p>
          </div>
          <div className="bg-black/20 border border-wojak-border rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-gray-500 mb-0.5">Total Txns (24h)</p>
            <p className="text-xs font-semibold text-white">
              {totalTxns > 0 ? totalTxns.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Multi-timeframe volume */}
      <div className="bg-black/20 border border-wojak-border rounded-lg p-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Volume by Timeframe</p>
        {loading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-gray-500 mb-0.5">1h</p>
              <p className="text-xs font-semibold text-white">
                {(data?.volume1h ?? 0) > 0 ? formatCurrency(data!.volume1h!) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-0.5">6h</p>
              <p className="text-xs font-semibold text-white">
                {(data?.volume6h ?? 0) > 0 ? formatCurrency(data!.volume6h!) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-0.5">24h</p>
              <p className="text-xs font-semibold text-white">
                {volume24h > 0 ? formatCurrency(volume24h) : "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Uniswap link */}
      <div className="text-center">
        <a
          href={UNISWAP_POOL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-wojak-green hover:underline"
        >
          View Pool on Uniswap
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function ChartSection() {
  const [activeTab, setActiveTab] = useState<Tab>("Chart");
  const [showBubbleMap, setShowBubbleMap] = useState(false);
  const pool = usePoolData();

  return (
    <div className="bg-wojak-card border border-wojak-border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-wojak-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-3 sm:px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-wojak-green" />
            )}
          </button>
        ))}
        <button
          onClick={() => setShowBubbleMap(true)}
          className="relative px-3 sm:px-5 py-3 text-sm font-medium transition-colors text-gray-400 hover:text-gray-300"
        >
          Bubble Map
        </button>
      </div>

      {/* Tab content — min-height on mobile so non-chart tabs can grow; fixed height on sm+ */}
      <div className="min-h-[320px] sm:h-[390px] md:h-[460px]">
        {activeTab === "Chart" ? (
          <PriceChart />
        ) : activeTab === "Transactions" ? (
          <RecentTrades embedded />
        ) : activeTab === "TVL" ? (
          <TVLPanel data={pool.data} loading={pool.loading} />
        ) : (
          <VolumePanel data={pool.data} loading={pool.loading} />
        )}
      </div>

      {/* DEXscore footer */}
      <div className="border-t border-wojak-border">
        <DextScoreInline />
      </div>

      {/* Bubble Map Modal */}
      {showBubbleMap && (
        <Suspense fallback={null}>
          <BubbleMapModal onClose={() => setShowBubbleMap(false)} />
        </Suspense>
      )}
    </div>
  );
}
