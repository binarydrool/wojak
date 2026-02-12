"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchRecentTrades } from "@/lib/etherscan";
import type { Trade } from "@/types";

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAmount(raw: string): string {
  const num = parseFloat(raw);
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(2);
}

function formatUsd(raw: string): string {
  const num = parseFloat(raw);
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(2)}`;
  return `$${num.toFixed(4)}`;
}

function RowSkeleton() {
  return (
    <tr>
      <td className="py-3 px-3"><div className="h-4 w-14 bg-wojak-border rounded animate-pulse" /></td>
      <td className="py-3 px-3"><div className="h-4 w-10 bg-wojak-border rounded animate-pulse" /></td>
      <td className="py-3 px-3"><div className="h-4 w-20 bg-wojak-border rounded animate-pulse" /></td>
      <td className="py-3 px-3"><div className="h-4 w-16 bg-wojak-border rounded animate-pulse" /></td>
      <td className="py-3 px-3"><div className="h-4 w-24 bg-wojak-border rounded animate-pulse" /></td>
    </tr>
  );
}

export default function RecentTrades({ embedded = false }: { embedded?: boolean }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  const loadTrades = useCallback(async () => {
    try {
      const data = await fetchRecentTrades();
      setTrades(data);
      setError(data.length === 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrades();
    const interval = setInterval(loadTrades, 30_000);
    return () => clearInterval(interval);
  }, [loadTrades]);

  const table = (
    <>
      {!embedded && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
          {!loading && trades.length > 0 && (
            <span className="text-xs text-gray-600">Auto-refreshes every 30s</span>
          )}
        </div>
      )}
      {embedded && !loading && trades.length > 0 && (
        <div className="flex justify-end px-4 pt-3">
          <span className="text-xs text-gray-600">Auto-refreshes every 30s</span>
        </div>
      )}

      <div className={`overflow-x-auto ${embedded ? "px-0" : ""}`}>
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-wojak-border">
              <th className="text-left py-3 px-3 font-medium">Time</th>
              <th className="text-left py-3 px-3 font-medium">Type</th>
              <th className="text-left py-3 px-3 font-medium">Amount</th>
              <th className="text-left py-3 px-3 font-medium">Value</th>
              <th className="text-left py-3 px-3 font-medium">Wallet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wojak-border/50">
            {loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  {error ? "Loading trades..." : "No recent trades found"}
                </td>
              </tr>
            ) : (
              trades.map((trade, i) => (
                  <tr key={`${trade.hash}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-gray-500 text-xs">
                      {formatTimeAgo(trade.timestamp)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                          trade.type === "buy"
                            ? "text-wojak-green bg-wojak-green/10"
                            : "text-red-400 bg-red-400/10"
                        }`}
                      >
                        {trade.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white font-mono text-xs">
                      {formatAmount(trade.amount)}
                    </td>
                    <td className="py-3 px-3 text-gray-400 font-mono text-xs">
                      {formatUsd(trade.volumeUsd)}
                    </td>
                    <td className="py-3 px-3">
                      <a
                        href={`https://etherscan.io/address/${trade.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-wojak-green font-mono text-xs transition-colors"
                      >
                        {truncateAddress(trade.wallet)}
                      </a>
                    </td>
                  </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  if (embedded) {
    return <div className="max-h-[500px] overflow-y-auto">{table}</div>;
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-4 pb-8">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-4 sm:p-6">
        {table}
      </div>
    </section>
  );
}
