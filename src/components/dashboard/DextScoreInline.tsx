"use client";

import { DEXTOOLS_URL } from "@/lib/constants";

const OVERALL_SCORE = 99;

const SUB_SCORES = [
  { label: "INFO", score: 99 },
  { label: "TX", score: 99 },
  { label: "HOLD", score: 99 },
  { label: "AUDIT", score: 99 },
  { label: "POOL", score: 99 },
];

export default function DextScoreInline() {
  return (
    <div className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Label */}
      <span className="text-sm font-bold text-white">DEXscore</span>

      {/* Overall score badge */}
      <div className="relative w-8 h-8 shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#1e1e1e" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="#4ade80"
            strokeWidth="3"
            strokeDasharray={`${(OVERALL_SCORE / 100) * 125.66} 125.66`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-wojak-green">
          {OVERALL_SCORE}
        </span>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-5 bg-wojak-border" />

      {/* Sub-scores */}
      {SUB_SCORES.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">{item.label}</span>
          <span className="text-xs font-bold text-wojak-green">{item.score}</span>
        </div>
      ))}

      {/* Spacer to push link right on desktop */}
      <div className="hidden sm:block flex-1" />

      {/* DexTools link */}
      <a
        href={DEXTOOLS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-wojak-green transition-colors"
      >
        View on DexTools
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
