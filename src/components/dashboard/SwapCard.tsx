"use client";

import { useEffect, useState } from "react";
import { COW_SWAP_URL, MATCHA_URL } from "@/lib/constants";
import { fetchFormattedStats } from "@/lib/coingecko";

export default function SwapCard() {
  const [wojakAmount, setWojakAmount] = useState<string>("—");

  useEffect(() => {
    fetchFormattedStats()
      .then((data) => {
        if (data.price > 0 && data.ethPrice > 0) {
          const ethValue = 0.0911;
          const usdValue = ethValue * data.ethPrice;
          const tokens = usdValue / data.price;
          // Format with commas, no decimals
          setWojakAmount(Math.floor(tokens).toLocaleString());
        }
      })
      .catch(() => {
        // keep default
      });
  }, []);

  return (
    <div>
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-4 sm:p-5">
        {/* Header */}
        <h3 className="text-lg font-bold text-white mb-4">Swap</h3>

        {/* Sell section */}
        <div className="bg-black/30 rounded-xl p-4 border border-wojak-border">
          <p className="text-xs text-gray-500 mb-2">Sell</p>
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value="0.0911"
              readOnly
              className="bg-transparent text-2xl font-medium text-white outline-none w-full cursor-default"
            />
            <div className="flex items-center gap-2 bg-wojak-card px-3 py-1.5 rounded-full border border-wojak-border shrink-0">
              {/* ETH icon */}
              <div className="w-5 h-5 rounded-full bg-[#627eea] flex items-center justify-center">
                <svg width="10" height="16" viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="#fff" fillOpacity="0.6" />
                  <path d="M127.962 0L0 212.32L127.962 287.959V154.158V0Z" fill="#fff" />
                  <path d="M127.961 312.187L126.386 314.107V412.306L127.961 416.905L255.999 236.585L127.961 312.187Z" fill="#fff" fillOpacity="0.6" />
                  <path d="M127.962 416.905V312.187L0 236.585L127.962 416.905Z" fill="#fff" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">ETH</span>
            </div>
          </div>
        </div>

        {/* Arrow divider */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-wojak-card border border-wojak-border flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
        </div>

        {/* Buy section */}
        <div className="bg-black/30 rounded-xl p-4 border border-wojak-border">
          <p className="text-xs text-gray-500 mb-2">Buy</p>
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={wojakAmount !== "—" ? `~${wojakAmount}` : "—"}
              readOnly
              className="bg-transparent text-2xl font-medium text-white outline-none w-full cursor-default"
            />
            <div className="flex items-center gap-2 bg-wojak-card px-3 py-1.5 rounded-full border border-wojak-border shrink-0">
              {/* WOJAK token logo */}
              <img
                src="/images/wojak.jpg"
                alt="WOJAK"
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-sm font-semibold text-white">WOJAK</span>
            </div>
          </div>
        </div>

        {/* Swap button */}
        <a
          href={COW_SWAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full mt-3 bg-wojak-green hover:bg-green-300 text-black text-center font-bold py-3.5 rounded-xl transition-colors text-sm"
        >
          Swap on CoW Swap
        </a>

        {/* MEV Protection note */}
        <div className="flex items-center gap-2 mt-3 justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wojak-green shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-xs text-gray-400">MEV Protected</span>
        </div>

        {/* Powered by CoW Swap */}
        <p className="text-center text-xs text-gray-600 mt-2">
          Powered by CoW Swap
        </p>
        <p className="text-center text-[11px] text-gray-600 mt-1">
          Also available on{" "}
          <a
            href={MATCHA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-wojak-green hover:underline transition-colors"
          >
            Matcha.xyz
          </a>
        </p>
      </div>
    </div>
  );
}
