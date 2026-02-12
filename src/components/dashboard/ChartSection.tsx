"use client";

import { useState, useEffect } from "react";
import PriceChart from "./PriceChart";
import RecentTrades from "./RecentTrades";
import DextScoreInline from "./DextScoreInline";
import { fetchWojakMarketData, formatCurrency } from "@/lib/coingecko";
import { OG_UNISWAP_POOL, ETHERSCAN_BASE_URL, LP_LOCK_EXPIRY, UNISWAP_POOL_URL } from "@/lib/constants";

const TABS = ["Chart", "Transactions", "TVL"] as const;
type Tab = (typeof TABS)[number];

function TVLPanel() {
  const [tvl, setTvl] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWojakMarketData()
      .then((data) => {
        setTvl(data.tvl > 0 ? formatCurrency(data.tvl) : "—");
      })
      .catch(() => {
        setTvl("—");
      })
      .finally(() => setLoading(false));
  }, []);

  const poolAddress = OG_UNISWAP_POOL;
  const truncated = `${poolAddress.slice(0, 10)}...${poolAddress.slice(-8)}`;

  return (
    <div className="p-5 sm:p-6 space-y-5">
      {/* TVL Value — prominent */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Value Locked</p>
        {loading ? (
          <div className="h-14 w-48 bg-wojak-border rounded animate-pulse mx-auto" />
        ) : (
          <p className="text-4xl sm:text-5xl font-bold text-wojak-green">{tvl}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">Uniswap V2 — WOJAK/WETH Pool</p>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 border border-wojak-border rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Pool Type</p>
          <p className="text-sm font-semibold text-white">Uniswap V2</p>
        </div>
        <div className="bg-black/20 border border-wojak-border rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Fee Tier</p>
          <p className="text-sm font-semibold text-white">0.3%</p>
        </div>
        <div className="bg-black/20 border border-wojak-border rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Pool Pair</p>
          <p className="text-sm font-semibold text-white">WOJAK / WETH</p>
        </div>
        <div className="bg-black/20 border border-wojak-border rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">LP Lock Expiry</p>
          <p className="text-sm font-semibold text-wojak-green">{LP_LOCK_EXPIRY}</p>
        </div>
      </div>

      {/* Pool Address */}
      <div className="bg-black/20 border border-wojak-border rounded-lg p-4">
        <p className="text-xs text-gray-500 mb-1">Pool Address</p>
        <a
          href={`${ETHERSCAN_BASE_URL}/address/${poolAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-mono text-wojak-green hover:underline break-all"
        >
          {truncated}
        </a>
      </div>

      {/* LP Lock Status */}
      <div className="bg-wojak-green/5 border border-wojak-green/20 rounded-lg p-4 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wojak-green shrink-0 mt-0.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-wojak-green">LP Locked Until {LP_LOCK_EXPIRY}</p>
          <p className="text-sm text-gray-300 mt-0.5">
            Liquidity is permanently locked — it cannot be rugged or withdrawn by anyone.
          </p>
        </div>
      </div>

      {/* View on Uniswap link */}
      <div className="text-center pt-2">
        <a
          href={UNISWAP_POOL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-wojak-green hover:underline"
        >
          View Liquidity Pool on Uniswap
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function ChartSection() {
  const [activeTab, setActiveTab] = useState<Tab>("Chart");

  return (
    <div className="bg-wojak-card border border-wojak-border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-wojak-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-wojak-green" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Chart" ? (
        <PriceChart />
      ) : activeTab === "Transactions" ? (
        <RecentTrades embedded />
      ) : (
        <TVLPanel />
      )}

      {/* DEXscore footer */}
      <div className="border-t border-wojak-border">
        <DextScoreInline />
      </div>
    </div>
  );
}
