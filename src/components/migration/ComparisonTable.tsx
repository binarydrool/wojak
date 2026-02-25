"use client";

import { useEffect, useState } from "react";
import {
  OG_WOJAK_CONTRACT,
  CTO_CONTRACT,
} from "@/lib/constants";

type RowData = {
  metric: string;
  og: string;
  ogAdvantage: boolean;
  newToken: string;
  newDanger: boolean;
};

interface ComparisonResponse {
  og: { liquidity: number | null };
  new: { liquidity: number | null };
  lastUpdated: string | null;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// Static rows — snapshot from Feb 11, 2025
const staticRows: RowData[] = [
  {
    metric: "Token Name",
    og: "Wojak Coin (WOJAK)",
    ogAdvantage: false,
    newToken: "wojak (wojak)",
    newDanger: false,
  },
  {
    metric: "Supply",
    og: "69,420,000,000",
    ogAdvantage: true,
    newToken: "420,690,000,000,000 (6,057x more)",
    newDanger: true,
  },
  {
    metric: "Holders",
    og: "~19,000+",
    ogAdvantage: true,
    newToken: "~5,580",
    newDanger: true,
  },
  {
    metric: "Market Cap",
    og: "~$2M",
    ogAdvantage: false,
    newToken: "~$15M",
    newDanger: false,
  },
  {
    metric: "LP Lock",
    og: "Until year 2100 (~74 yrs)",
    ogAdvantage: true,
    newToken: "Unknown",
    newDanger: true,
  },
  {
    metric: "Contract",
    og: "RENOUNCED — clean ERC-20, zero admin functions",
    ogAdvantage: true,
    newToken: "RENOUNCED — deployed with blacklist + setRule, now locked",
    newDanger: true,
  },
  {
    metric: "Pool Created",
    og: "April 17, 2023",
    ogAdvantage: true,
    newToken: "Recent",
    newDanger: false,
  },
  {
    metric: "Code",
    og: "Clean OpenZeppelin ERC-20",
    ogAdvantage: true,
    newToken: "blacklist + setRule (owner renounced, functions locked)",
    newDanger: true,
  },
];

function SkeletonCell() {
  return (
    <span className="inline-block h-4 w-20 animate-pulse rounded bg-white/10" />
  );
}

export default function ComparisonTable() {
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/comparison")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const liquidityRow: RowData = {
    metric: "Liquidity",
    og: data?.og?.liquidity != null
      ? `${formatNumber(data.og.liquidity)} (100% locked)`
      : "—",
    ogAdvantage: true,
    newToken: data?.new?.liquidity != null
      ? formatNumber(data.new.liquidity)
      : "—",
    newDanger: true,
  };

  // Insert liquidity after Market Cap (index 4)
  const rows: RowData[] = [
    ...staticRows.slice(0, 4),
    liquidityRow,
    ...staticRows.slice(4),
  ];

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[640px] px-4 sm:px-0">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-wojak-border">
                Metric
              </th>
              <th className="text-left text-sm font-semibold text-green-400 uppercase tracking-wider px-4 py-3 border-b border-wojak-border">
                OG WOJAK (0x50)
              </th>
              <th className="text-left text-sm font-semibold text-red-400 uppercase tracking-wider px-4 py-3 border-b border-wojak-border">
                New wojak (0x8d)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isDynamic = row.metric === "Liquidity";
              return (
                <tr
                  key={row.metric}
                  className={i % 2 === 0 ? "bg-white/[0.02]" : ""}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-300 border-b border-wojak-border/50">
                    {row.metric}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm border-b border-wojak-border/50 ${
                      row.ogAdvantage
                        ? "text-green-400 bg-green-500/[0.06]"
                        : "text-gray-300"
                    }`}
                  >
                    {isDynamic && loading ? <SkeletonCell /> : row.og}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm border-b border-wojak-border/50 ${
                      row.newDanger
                        ? "text-red-400 bg-red-500/[0.06]"
                        : "text-gray-300"
                    }`}
                  >
                    {isDynamic && loading ? <SkeletonCell /> : row.newToken}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Contract address footnotes */}
      <div className="mt-3 px-4 sm:px-0 flex flex-col sm:flex-row gap-2 text-xs text-gray-500">
        <span>
          OG: <span className="font-mono">{OG_WOJAK_CONTRACT.slice(0, 6)}...{OG_WOJAK_CONTRACT.slice(-4)}</span>
        </span>
        <span className="hidden sm:inline">|</span>
        <span>
          New: <span className="font-mono">{CTO_CONTRACT.slice(0, 6)}...{CTO_CONTRACT.slice(-4)}</span>
        </span>
      </div>

      {/* Last updated timestamp for live liquidity */}
      {data?.lastUpdated && (
        <div className="mt-2 px-4 sm:px-0 text-xs text-gray-600">
          Liquidity updated: {new Date(data.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
