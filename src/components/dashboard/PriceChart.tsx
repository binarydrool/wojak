"use client";

import { useState, useCallback } from "react";
import { GECKOTERMINAL_EMBED_URL } from "@/lib/constants";

export default function PriceChart() {
  const [loading, setLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <div className="relative w-full">
      {/* Loading skeleton */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-wojak-card z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-wojak-green border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading chart...</span>
          </div>
        </div>
      )}

      {/* Chart iframe — GeckoTerminal embed, responsive height */}
      <iframe
        src={GECKOTERMINAL_EMBED_URL}
        title="WOJAK Price Chart — GeckoTerminal"
        className="w-full border-0 h-[320px] sm:h-[390px] md:h-[460px]"
        onLoad={handleLoad}
        allow="clipboard-write"
        loading="lazy"
      />
    </div>
  );
}
