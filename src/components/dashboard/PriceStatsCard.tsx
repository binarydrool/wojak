"use client";

import { useState, useEffect } from "react";
import { fetchPriceStats, type PriceStats } from "@/lib/coingecko";

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-black/30 border border-wojak-border rounded-lg px-2 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">{label}</p>
      <p className={`text-[13px] font-semibold leading-tight ${color || "text-white"}`}>{value}</p>
    </div>
  );
}

export default function PriceStatsCard() {
  const [stats, setStats] = useState<PriceStats | null>(null);

  useEffect(() => {
    fetchPriceStats().then(setStats).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="bg-wojak-card border border-wojak-border rounded-2xl px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-black/30 border border-wojak-border rounded-lg px-2 py-2">
              <div className="h-2.5 w-6 bg-wojak-border rounded animate-pulse mx-auto mb-1" />
              <div className="h-3.5 w-10 bg-wojak-border rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasAny =
    stats.change1h !== null ||
    stats.change24h !== null ||
    stats.change7d !== null ||
    stats.change30d !== null;

  if (!hasAny) return null;

  return (
    <div className="bg-wojak-card border border-wojak-border rounded-2xl px-3 py-3">
      <div className="grid grid-cols-2 gap-2">
        {stats.change1h !== null && (
          <StatCell
            label="1H"
            value={`${stats.change1h >= 0 ? "+" : ""}${stats.change1h.toFixed(2)}%`}
            color={stats.change1h >= 0 ? "text-wojak-green" : "text-red-400"}
          />
        )}
        {stats.change24h !== null && (
          <StatCell
            label="24H"
            value={`${stats.change24h >= 0 ? "+" : ""}${stats.change24h.toFixed(2)}%`}
            color={stats.change24h >= 0 ? "text-wojak-green" : "text-red-400"}
          />
        )}
        {stats.change7d !== null && (
          <StatCell
            label="7D"
            value={`${stats.change7d >= 0 ? "+" : ""}${stats.change7d.toFixed(2)}%`}
            color={stats.change7d >= 0 ? "text-wojak-green" : "text-red-400"}
          />
        )}
        {stats.change30d !== null && (
          <StatCell
            label="1M"
            value={`${stats.change30d >= 0 ? "+" : ""}${stats.change30d.toFixed(2)}%`}
            color={stats.change30d >= 0 ? "text-wojak-green" : "text-red-400"}
          />
        )}
      </div>
    </div>
  );
}
