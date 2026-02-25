"use client";

import { useState, useEffect, useRef } from "react";
import { fetchPriceStats, type PriceStats } from "@/lib/coingecko";
import { TICKER_INTERVAL } from "@/lib/constants";

/* ── tiny ETH diamond SVG (matches SwapCard ticker) ────────────────── */
function EthIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block -mt-0.5 shrink-0">
      <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="#00ff41" fillOpacity="0.7" />
      <path d="M127.962 0L0 212.32L127.962 287.959V154.158V0Z" fill="#00ff41" />
      <path d="M127.961 312.187L126.386 314.107V412.306L127.961 416.905L255.999 236.585L127.961 312.187Z" fill="#00ff41" fillOpacity="0.7" />
      <path d="M127.962 416.905V312.187L0 236.585L127.962 416.905Z" fill="#00ff41" />
    </svg>
  );
}

/* ── tiny USD icon ──────────────────────────────────────────────────── */
function UsdIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block -mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="10" stroke="#00ff41" strokeWidth="1.5" fill="none" />
      <text x="12" y="16.5" textAnchor="middle" fill="#00ff41" fontSize="13" fontWeight="bold" fontFamily="monospace">$</text>
    </svg>
  );
}

/* ── format helpers ─────────────────────────────────────────────────── */
function fmtPct(val: number): string {
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
}
function pctColor(val: number): string {
  return val >= 0 ? "text-wojak-green" : "text-red-400";
}

/* ── single stat cell — label stays static, only value rolodexes ───── */
function StatCell({
  label,
  value,
  color,
  animKey,
  animate,
}: {
  label: string;
  value: string;
  color?: string;
  animKey: number;
  animate: boolean;
}) {
  return (
    <div className="bg-black/30 border border-wojak-border rounded-lg px-2 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">{label}</p>
      <div className="relative h-[18px] overflow-hidden">
        <span
          key={animKey}
          className={`absolute inset-x-0 top-0 text-[13px] font-semibold leading-tight ${color || "text-white"}${animate ? " animate-rolodex-up" : ""}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────────── */
export default function PriceStatsCard() {
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [mode, setMode] = useState<0 | 1>(0); // 0 = ETH, 1 = USD
  const [animKey, setAnimKey] = useState(0);
  const hasToggled = useRef(false);

  // Fetch price stats once
  useEffect(() => {
    fetchPriceStats().then(setStats).catch(() => {});
  }, []);

  // Toggle mode on same interval as SwapCard rolodex ticker
  useEffect(() => {
    const interval = setInterval(() => {
      hasToggled.current = true;
      setMode((prev) => (prev === 0 ? 1 : 0));
      setAnimKey((prev) => prev + 1);
    }, TICKER_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Loading skeleton
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

  // Pick the current mode's values
  const vals = mode === 0
    ? { h1: stats.change1h, h24: stats.change24h, d7: stats.change7d, d30: stats.change30d }
    : { h1: stats.usdChange1h, h24: stats.usdChange24h, d7: stats.usdChange7d, d30: stats.usdChange30d };

  const hasAny = vals.h1 !== null || vals.h24 !== null || vals.d7 !== null || vals.d30 !== null;

  // Fall back: if current mode has no data but the other does, still show
  const altVals = mode === 1
    ? { h1: stats.change1h, h24: stats.change24h, d7: stats.change7d, d30: stats.change30d }
    : { h1: stats.usdChange1h, h24: stats.usdChange24h, d7: stats.usdChange7d, d30: stats.usdChange30d };
  const altHasAny = altVals.h1 !== null || altVals.h24 !== null || altVals.d7 !== null || altVals.d30 !== null;

  if (!hasAny && !altHasAny) return null;

  // Use current mode values, falling back to alt if needed
  const display = hasAny ? vals : altVals;
  const showMode = hasAny ? mode : (mode === 0 ? 1 : 0);
  const shouldAnimate = hasToggled.current;

  return (
    <div className="bg-wojak-card border border-wojak-border rounded-2xl px-3 py-3">
      {/* Mode indicator — ETH/USD icon + label */}
      <div className="flex items-center justify-end gap-1.5 mb-1.5 pr-0.5">
        <div className="relative h-4 overflow-hidden min-w-[48px]">
          <span
            key={`icon-${animKey}`}
            className={`absolute right-0 top-0 flex items-center gap-1 h-4${shouldAnimate ? " animate-rolodex-up" : ""}`}
          >
            {showMode === 0 ? <EthIcon /> : <UsdIcon />}
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#00ff41]/70 uppercase">
              {showMode === 0 ? "ETH" : "USD"}
            </span>
          </span>
        </div>
      </div>

      {/* Stat grid — containers and labels stay static, only values animate */}
      <div className="grid grid-cols-2 gap-2">
        {display.h1 !== null && (
          <StatCell label="1H" value={fmtPct(display.h1)} color={pctColor(display.h1)} animKey={animKey} animate={shouldAnimate} />
        )}
        {display.h24 !== null && (
          <StatCell label="24H" value={fmtPct(display.h24)} color={pctColor(display.h24)} animKey={animKey} animate={shouldAnimate} />
        )}
        {display.d7 !== null && (
          <StatCell label="7D" value={fmtPct(display.d7)} color={pctColor(display.d7)} animKey={animKey} animate={shouldAnimate} />
        )}
        {display.d30 !== null && (
          <StatCell label="1M" value={fmtPct(display.d30)} color={pctColor(display.d30)} animKey={animKey} animate={shouldAnimate} />
        )}
      </div>
    </div>
  );
}
