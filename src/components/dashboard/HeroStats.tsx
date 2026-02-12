"use client";

import { useEffect, useState } from "react";
import { fetchFormattedStats } from "@/lib/coingecko";

interface StatsData {
  marketCap: string;
  tvl: string;
  volume24h: string;
  holders: string;
}

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-3 w-16 bg-wojak-border rounded animate-pulse" />
      <div className="h-6 w-24 bg-wojak-border rounded animate-pulse" />
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <span className="text-lg font-semibold text-white">{value}</span>
    </div>
  );
}

export default function HeroStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormattedStats()
      .then((data) => {
        setStats({
          marketCap: data.marketCap,
          tvl: data.tvl,
          volume24h: data.volume24h,
          holders: data.holders,
        });
      })
      .catch(() => {
        setStats({
          marketCap: "—",
          tvl: "—",
          volume24h: "—",
          holders: "19,630",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-wojak-card border border-wojak-border rounded-xl p-6">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatItem label="Market Cap" value={stats?.marketCap ?? "—"} />
            <StatItem label="TVL" value={stats?.tvl ?? "—"} />
            <StatItem label="24h Volume" value={stats?.volume24h ?? "—"} />
            <StatItem label="Holders" value={stats?.holders ?? "—"} />
          </>
        )}
      </div>
    </section>
  );
}
