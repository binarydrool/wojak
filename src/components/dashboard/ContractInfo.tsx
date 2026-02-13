"use client";

import { useState } from "react";
import CopyButton from "@/components/ui/CopyButton";
import Badge from "@/components/ui/Badge";
import LPGuideModal from "./LPGuideModal";
import {
  OG_WOJAK_CONTRACT,
  ETHERSCAN_TOKEN_URL,
  DEXTOOLS_URL,
  UNISWAP_POOL_URL,
  UNISWAP_ADD_LIQUIDITY,
  LP_LOCK_EXPIRY,
} from "@/lib/constants";

const LINKS = [
  { label: "Etherscan", href: ETHERSCAN_TOKEN_URL },
  { label: "DexTools", href: DEXTOOLS_URL },
  { label: "Uniswap Liquidity Pool", href: UNISWAP_POOL_URL },
];

export default function ContractInfo() {
  const [showLPGuide, setShowLPGuide] = useState(false);

  return (
    <section className="max-w-5xl mx-auto px-4 pb-4">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-4 sm:p-6">
        {/* Top row: heading + renounced badge + token stats inline */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-white">Contract Info</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="green" className="w-fit text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Contract RENOUNCED
            </Badge>
            <div className="w-px h-3 bg-wojak-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Total Supply</span>
              <span className="text-xs font-semibold text-[#00ff41]">69.42B</span>
            </div>
            <div className="w-px h-3 bg-wojak-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Tax</span>
              <span className="text-xs font-semibold text-[#00ff41]">0%</span>
            </div>
          </div>
        </div>

        {/* Contract address row with copy + links */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 border border-wojak-border flex-1 min-w-0">
            <CopyButton text={OG_WOJAK_CONTRACT} label={OG_WOJAK_CONTRACT} className="text-white text-xs sm:text-sm" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-wojak-border rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* LP lock note — compact */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wojak-green shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            <span className="text-wojak-green font-medium">LP Locked</span> until {LP_LOCK_EXPIRY} — liquidity cannot be rugged
          </span>
        </div>

        {/* Add Liquidity CTA */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wojak-green shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span>
            Want to become a Liquidity Provider?{" "}
            <a
              href={UNISWAP_ADD_LIQUIDITY}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wojak-green hover:underline font-medium"
            >
              Add Liquidity on Uniswap
            </a>
          </span>
        </div>

        {/* LP Guide link */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wojak-green shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            New to LP?{" "}
            <button
              onClick={() => setShowLPGuide(true)}
              className="text-wojak-green hover:underline font-medium"
            >
              How to become a Liquidity Provider
            </button>
          </span>
        </div>
      </div>

      {/* LP Guide Modal */}
      {showLPGuide && <LPGuideModal onClose={() => setShowLPGuide(false)} />}
    </section>
  );
}
