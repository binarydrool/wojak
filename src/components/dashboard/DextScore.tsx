"use client";

import { DEXTOOLS_URL } from "@/lib/constants";

const OVERALL_SCORE = 99;

const SUB_SCORES = [
  { label: "INFO", score: 99, icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "TX", score: 99, icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { label: "HOLD", score: 99, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "AUDIT", score: 99, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { label: "POOL", score: 99, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
];

export default function DextScore() {
  return (
    <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-6">
      {/* Header with overall score */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">DEXscore</h3>
        <div className="relative w-12 h-12">
          {/* Circular badge */}
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24" cy="24" r="20"
              fill="none"
              stroke="#1e1e1e"
              strokeWidth="3"
            />
            <circle
              cx="24" cy="24" r="20"
              fill="none"
              stroke="#4ade80"
              strokeWidth="3"
              strokeDasharray={`${(OVERALL_SCORE / 100) * 125.66} 125.66`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-wojak-green">
            {OVERALL_SCORE}
          </span>
        </div>
      </div>

      {/* Sub-score row */}
      <div className="grid grid-cols-5 gap-2">
        {SUB_SCORES.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1.5 bg-black/30 border border-wojak-border rounded-lg py-2.5 px-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide leading-none">
              {item.label}
            </span>
            <span className="text-sm font-bold text-wojak-green leading-none">
              {item.score}
            </span>
          </div>
        ))}
      </div>

      {/* Link to DexTools */}
      <div className="mt-4 text-center">
        <a
          href={DEXTOOLS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-wojak-green transition-colors"
        >
          View on DexTools
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
