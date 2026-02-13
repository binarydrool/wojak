"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { COW_SWAP_URL, MATCHA_URL } from "@/lib/constants";

interface PriceData {
  wojakPriceUsd: number;
  wojakPriceEth: number;
  ethPriceUsd: number;
}

const TICKER_INTERVAL = 7000;

export default function SwapCard() {
  const [ethValue, setEthValue] = useState("0.0911");
  const [wojakValue, setWojakValue] = useState("—");
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [gasGwei, setGasGwei] = useState<number | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerKey, setTickerKey] = useState(0);
  const [editingField, setEditingField] = useState<"eth" | "wojak" | null>(null);
  const [introAnim, setIntroAnim] = useState(false);
  const gasInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const ethInputRef = useRef<HTMLInputElement>(null);
  const [cursorLeft, setCursorLeft] = useState(0);

  // One-time mock-focus intro animation (pure CSS, sessionStorage gated)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("swap-intro")) return;
    sessionStorage.setItem("swap-intro", "1");
    if (ethInputRef.current) {
      const input = ethInputRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const style = window.getComputedStyle(input);
        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const textWidth = ctx.measureText("0.0911").width;
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        setCursorLeft(paddingLeft + textWidth);
      }
    }
    setIntroAnim(true);
  }, []);

  // Fetch prices from /api/pool (GeckoTerminal pool data — same source as rest of site)
  useEffect(() => {
    fetch("/api/pool")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.wojakPrice > 0 && data?.ethPrice > 0) {
          const wojakPriceEth = data.wojakPrice / data.ethPrice;
          setPrices({
            wojakPriceUsd: data.wojakPrice,
            wojakPriceEth,
            ethPriceUsd: data.ethPrice,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Calculate WOJAK amount when prices load or ETH value changes (from ETH side)
  useEffect(() => {
    if (!prices || editingField === "wojak") return;
    const eth = parseFloat(ethValue);
    if (isNaN(eth) || eth <= 0) {
      setWojakValue("");
      return;
    }
    const usdValue = eth * prices.ethPriceUsd;
    const tokens = usdValue / prices.wojakPriceUsd;
    setWojakValue(Math.floor(tokens).toLocaleString());
  }, [ethValue, prices, editingField]);

  // Fetch gas price
  const fetchGas = useCallback(() => {
    fetch("/api/gas")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.gasGwei != null) setGasGwei(data.gasGwei);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchGas();
    gasInterval.current = setInterval(fetchGas, 45000);
    return () => {
      if (gasInterval.current) clearInterval(gasInterval.current);
    };
  }, [fetchGas]);

  // Ticker rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % 3);
      setTickerKey((prev) => prev + 1);
    }, TICKER_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Handle ETH input change
  const handleEthChange = (val: string) => {
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setEditingField("eth");
      setEthValue(val);
    }
  };

  // Handle WOJAK input change
  const handleWojakChange = (val: string) => {
    const raw = val.replace(/,/g, "");
    if (raw === "" || /^\d*$/.test(raw)) {
      setEditingField("wojak");
      const numericVal = parseInt(raw);
      if (raw === "" || isNaN(numericVal)) {
        setWojakValue("");
        setEthValue("");
        return;
      }
      setWojakValue(numericVal.toLocaleString());
      if (prices && prices.wojakPriceUsd > 0 && prices.ethPriceUsd > 0) {
        const usdValue = numericVal * prices.wojakPriceUsd;
        const ethAmount = usdValue / prices.ethPriceUsd;
        setEthValue(ethAmount < 0.0001 ? ethAmount.toExponential(2) : ethAmount.toFixed(4));
      }
    }
  };

  const handleBlur = () => {
    setEditingField(null);
  };

  // Ticker content renderer
  const getTickerContent = () => {
    switch (tickerIndex) {
      case 0: {
        const val = !prices ? "$—" : prices.wojakPriceUsd < 0.01
          ? `$${prices.wojakPriceUsd.toFixed(8)}`
          : `$${prices.wojakPriceUsd.toFixed(4)}`;
        return <>{val}</>;
      }
      case 1: {
        const val = !prices ? "—" : prices.wojakPriceEth < 0.0001
          ? prices.wojakPriceEth.toFixed(11)
          : prices.wojakPriceEth.toFixed(8);
        return (
          <>
            {/* ETH diamond icon */}
            <svg width="10" height="16" viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block -mt-0.5 mr-1.5 shrink-0">
              <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="#00ff41" fillOpacity="0.7" />
              <path d="M127.962 0L0 212.32L127.962 287.959V154.158V0Z" fill="#00ff41" />
              <path d="M127.961 312.187L126.386 314.107V412.306L127.961 416.905L255.999 236.585L127.961 312.187Z" fill="#00ff41" fillOpacity="0.7" />
              <path d="M127.962 416.905V312.187L0 236.585L127.962 416.905Z" fill="#00ff41" />
            </svg>
            {val}
          </>
        );
      }
      case 2: {
        const val = gasGwei === null ? "—" : gasGwei < 1
          ? gasGwei.toFixed(2)
          : String(Math.round(gasGwei));
        return (
          <>
            {/* Raindrop icon */}
            <svg width="12" height="14" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block -mt-0.5 mr-1.5 shrink-0">
              <path d="M12 0C12 0 3 12 3 18C3 22.97 7.03 27 12 27C16.97 27 21 22.97 21 18C21 12 12 0 12 0Z" fill="#00ff41" fillOpacity="0.85" />
            </svg>
            {val} Gwei
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-4 sm:p-5">
        {/* Header with rolodex ticker */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Swap</h3>

          {/* Rolodex ticker */}
          <div className="relative h-6 overflow-hidden min-w-[130px]">
            <span
              key={tickerKey}
              className="text-sm font-bold font-mono text-[#00ff41] whitespace-nowrap animate-rolodex-up absolute right-0 top-0 flex items-center h-6 tracking-wide drop-shadow-[0_0_6px_rgba(0,255,65,0.3)]"
            >
              {getTickerContent()}
            </span>
          </div>
        </div>

        {/* Sell section */}
        <div
          className={`bg-black/30 rounded-xl p-4 border ${
            introAnim
              ? "mock-focus-anim"
              : "border-wojak-border focus-within:border-[#00ff41]/40"
          }`}
          onAnimationEnd={(e) => {
            if (e.animationName === "mockFocusBorder") setIntroAnim(false);
          }}
        >
          <p className="text-xs text-gray-500 mb-2">Sell</p>
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex items-center w-full">
              <input
                ref={ethInputRef}
                type="text"
                inputMode="decimal"
                value={ethValue}
                onChange={(e) => handleEthChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="0.0"
                className="bg-transparent text-2xl font-medium text-white outline-none w-full cursor-text
                           placeholder:text-gray-600 selection:bg-[#00ff41]/20"
              />
              {/* Mock blinking cursor — fades out via CSS animation */}
              {introAnim && (
                <span
                  className="absolute top-1/2 -translate-y-1/2 mock-cursor-fade pointer-events-none"
                  style={{ left: `${cursorLeft}px` }}
                >
                  <span className="block w-[1.5px] h-7 bg-white animate-cursor-blink" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-wojak-card px-3 py-1.5 rounded-full border border-wojak-border shrink-0">
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
        <div className="bg-black/30 rounded-xl p-4 border border-wojak-border focus-within:border-[#00ff41]/40 transition-colors">
          <p className="text-xs text-gray-500 mb-2">Buy (estimate)</p>
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              inputMode="numeric"
              value={wojakValue === "—" ? "" : `~${wojakValue}`}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/^~/, "");
                handleWojakChange(cleaned);
              }}
              onFocus={(e) => {
                if (e.target.value.startsWith("~")) {
                  const raw = e.target.value.slice(1);
                  e.target.value = raw;
                }
              }}
              onBlur={handleBlur}
              placeholder="0"
              className="bg-transparent text-2xl font-medium text-white outline-none w-full cursor-text
                         placeholder:text-gray-600 selection:bg-[#00ff41]/20"
            />
            <div className="flex items-center gap-2 bg-wojak-card px-3 py-1.5 rounded-full border border-wojak-border shrink-0">
              <img
                src="/images/wojak.jpg"
                alt="WOJAK"
                loading="lazy"
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
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#00ff41" className={introAnim ? 'shield-fill-anim' : ''} />
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
