"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BrowserProvider,
  Contract,
  parseEther,
  formatEther,
  parseUnits,
  formatUnits,
  MaxUint256,
} from "ethers";
import {
  TICKER_INTERVAL,
  UNISWAP_POOL_URL,
  OG_WOJAK_CONTRACT,
  UNISWAP_V2_ROUTER,
  WETH_ADDRESS,
  ETHERSCAN_BASE_URL,
} from "@/lib/constants";

/* ── Ethereum provider type ── */
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

/* ── Contract addresses (verified against pool & Etherscan) ── */
const WOJAK = OG_WOJAK_CONTRACT; // 0x8De39B057CC6522230AB19C0205080a8663331Ef
const WETH = WETH_ADDRESS;       // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
const ROUTER = UNISWAP_V2_ROUTER; // 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
const MAINNET = 1;

/* ── Minimal ABIs (human-readable for ethers v6) ── */
const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)",
];
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

/* ── Uniswap V2 quote (float math — 0.3% fee) ── */
function getQuote(amountIn: number, reserveIn: number, reserveOut: number): number {
  if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) return 0;
  const withFee = amountIn * 0.997;
  return (withFee * reserveOut) / (reserveIn + withFee);
}

/* ── Price data for ticker ── */
interface PriceData {
  wojakPriceUsd: number;
  wojakPriceEth: number;
  ethPriceUsd: number;
}

type Direction = "ethToWojak" | "wojakToEth";

/* ── Uniswap logo (inline SVG, green fill) ── */
function UniswapLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 168.3 193.8" fill="#4ade80" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M66,44.1c-2.1-0.3-2.2-0.4-1.2-0.5c1.9-0.3,6.3,0.1,9.4,0.8c7.2,1.7,13.7,6.1,20.6,13.8l1.8,2.1l2.6-0.4 c11.1-1.8,22.5-0.4,32,4c2.6,1.2,6.7,3.6,7.2,4.2c0.2,0.2,0.5,1.5,0.7,2.8c0.7,4.7,0.4,8.2-1.1,10.9c-0.8,1.5-0.8,1.9-0.3,3.2 c0.4,1,1.6,1.7,2.7,1.7c2.4,0,4.9-3.8,6.1-9.1l0.5-2.1l0.9,1c5.1,5.7,9.1,13.6,9.7,19.2l0.2,1.5l-0.9-1.3c-1.5-2.3-2.9-3.8-4.8-5.1 c-3.4-2.3-7-3-16.5-3.5c-8.6-0.5-13.5-1.2-18.3-2.8c-8.2-2.7-12.4-6.2-22.1-19.1c-4.3-5.7-7-8.8-9.7-11.4 C79.6,48.3,73.7,45.3,66,44.1z" />
      <path d="M140.5,56.8c0.2-3.8,0.7-6.3,1.8-8.6c0.4-0.9,0.8-1.7,0.9-1.7c0.1,0-0.1,0.7-0.4,1.5c-0.8,2.2-0.9,5.3-0.4,8.8 c0.7,4.5,1,5.1,5.8,10c2.2,2.3,4.8,5.2,5.8,6.4l1.7,2.2l-1.7-1.6c-2.1-2-6.9-5.8-8-6.3c-0.7-0.4-0.8-0.4-1.3,0.1 c-0.4,0.4-0.5,1-0.5,3.9c-0.1,4.5-0.7,7.3-2.2,10.2c-0.8,1.5-0.9,1.2-0.2-0.5c0.5-1.3,0.6-1.9,0.6-6.2c0-8.7-1-10.8-7.1-14.3 c-1.5-0.9-4.1-2.2-5.6-2.9c-1.6-0.7-2.8-1.3-2.7-1.3c0.2-0.2,6.1,1.5,8.4,2.5c3.5,1.4,4.1,1.5,4.5,1.4 C140.2,60.1,140.4,59.3,140.5,56.8z" />
      <path d="M70.1,71.7c-4.2-5.8-6.9-14.8-6.3-21.5l0.2-2.1l1,0.2c1.8,0.3,4.9,1.5,6.4,2.4c4,2.4,5.8,5.7,7.5,13.9 c0.5,2.4,1.2,5.2,1.5,6.1c0.5,1.5,2.4,5,4,7.2c1.1,1.6,0.4,2.4-2.1,2.2C78.5,79.7,73.4,76.2,70.1,71.7z" />
      <path d="M135.4,115.2c-19.8-8-26.8-14.9-26.8-26.6c0-1.7,0.1-3.1,0.1-3.1c0.1,0,0.8,0.6,1.7,1.3c4,3.2,8.5,4.6,21,6.4 c7.3,1.1,11.5,1.9,15.3,3.2c12.1,4,19.6,12.2,21.4,23.3c0.5,3.2,0.2,9.3-0.6,12.5c-0.7,2.5-2.7,7.1-3.2,7.2c-0.1,0-0.3-0.5-0.3-1.3 c-0.2-4.2-2.3-8.2-5.8-11.3C154,123.2,148.6,120.5,135.4,115.2z" />
      <path d="M121.4,118.5c-0.2-1.5-0.7-3.4-1-4.2l-0.5-1.5l0.9,1.1c1.3,1.5,2.3,3.3,3.2,5.8c0.7,1.9,0.7,2.5,0.7,5.6 c0,3-0.1,3.7-0.7,5.4c-1,2.7-2.2,4.6-4.2,6.7c-3.6,3.7-8.3,5.7-15,6.6c-1.2,0.1-4.6,0.4-7.6,0.6c-7.5,0.4-12.5,1.2-17,2.8 c-0.6,0.2-1.2,0.4-1.3,0.3c-0.2-0.2,2.9-2,5.4-3.2c3.5-1.7,7.1-2.6,15-4c3.9-0.6,7.9-1.4,8.9-1.8C118.1,135.6,123,127.9,121.4,118.5z" />
      <path d="M130.5,134.6c-2.6-5.7-3.2-11.1-1.8-16.2c0.2-0.5,0.4-1,0.6-1c0.2,0,0.8,0.3,1.4,0.7c1.2,0.8,3.7,2.2,10.1,5.7 c8.1,4.4,12.7,7.8,15.9,11.7c2.8,3.4,4.5,7.3,5.3,12.1c0.5,2.7,0.2,9.2-0.5,11.9c-2.2,8.5-7.2,15.3-14.5,19.2c-1.1,0.6-2,1-2.1,1 c-0.1,0,0.3-1,0.9-2.2c2.4-5.1,2.7-10,0.9-15.5c-1.1-3.4-3.4-7.5-8-14.4C133.2,139.6,131.9,137.5,130.5,134.6z" />
      <path d="M56,165.2c7.4-6.2,16.5-10.6,24.9-12c3.6-0.6,9.6-0.4,12.9,0.5c5.3,1.4,10.1,4.4,12.6,8.1 c2.4,3.6,3.5,6.7,4.6,13.6c0.4,2.7,0.9,5.5,1,6.1c0.8,3.6,2.4,6.4,4.4,7.9c3.1,2.3,8.5,2.4,13.8,0.4c0.9-0.3,1.7-0.6,1.7-0.5 c0.2,0.2-2.5,2-4.3,2.9c-2.5,1.3-4.5,1.7-7.2,1.7c-4.8,0-8.9-2.5-12.2-7.5c-0.7-1-2.1-3.9-3.3-6.6c-3.5-8.1-5.3-10.5-9.4-13.2 c-3.6-2.3-8.2-2.8-11.7-1.1c-4.6,2.2-5.8,8.1-2.6,11.7c1.3,1.5,3.7,2.7,5.7,3c3.7,0.5,6.9-2.4,6.9-6.1c0-2.4-0.9-3.8-3.3-4.9 c-3.2-1.4-6.7,0.2-6.6,3.3c0,1.3,0.6,2.1,1.9,2.7c0.8,0.4,0.8,0.4,0.2,0.3c-2.9-0.6-3.6-4.2-1.3-6.5c2.8-2.8,8.7-1.6,10.7,2.3 c0.8,1.6,0.9,4.8,0.2,6.8c-1.7,4.4-6.5,6.7-11.4,5.4c-3.3-0.9-4.7-1.8-8.7-5.9c-7-7.2-9.7-8.6-19.7-10.1l-1.9-0.3L56,165.2z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M3.4,4.3c23.3,28.3,59.2,72.3,61,74.7c1.5,2,0.9,3.9-1.6,5.3c-1.4,0.8-4.3,1.6-5.7,1.6c-1.6,0-3.5-0.8-4.8-2.1 c-0.9-0.9-4.8-6.6-13.6-20.3c-6.7-10.5-12.4-19.2-12.5-19.3C25.8,44,25.8,44,38,65.8C45.7,79.5,48.2,84.4,48.2,85c0,1.3-0.4,2-2,3.8 c-2.7,3-3.9,6.4-4.8,13.5c-1,7.9-3.7,13.5-11.4,23c-4.5,5.6-5.2,6.6-6.3,8.9c-1.4,2.8-1.8,4.4-2,8c-0.2,3.8,0.2,6.2,1.3,9.8 c1,3.2,2.1,5.3,4.8,9.4c2.3,3.6,3.7,6.3,3.7,7.3c0,0.8,0.2,0.8,3.8,0c8.6-2,15.7-5.4,19.6-9.6c2.4-2.6,3-4,3-7.6 c0-2.3-0.1-2.8-0.7-4.2c-1-2.2-2.9-4-7-6.8c-5.4-3.7-7.7-6.7-8.3-10.7c-0.5-3.4,0.1-5.7,3.1-12c3.1-6.5,3.9-9.2,4.4-15.8 c0.3-4.2,0.8-5.9,2-7.2c1.3-1.4,2.4-1.9,5.5-2.3c5.1-0.7,8.4-2,11-4.5c2.3-2.1,3.3-4.2,3.4-7.3l0.1-2.3L70.1,77C65.4,71.6,0.3,0,0,0 C-0.1,0,1.5,1.9,3.4,4.3z M34.1,146.5c1.1-1.9,0.5-4.3-1.3-5.5c-1.7-1.1-4.3-0.6-4.3,0.9c0,0.4,0.2,0.8,0.8,1c0.9,0.5,1,1,0.3,2.1 c-0.7,1.1-0.7,2.1,0.2,2.8C31.2,148.9,33.1,148.3,34.1,146.5z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M74.6,93.9c-2.4,0.7-4.7,3.3-5.4,5.9c-0.4,1.6-0.2,4.5,0.5,5.4c1.1,1.4,2.1,1.8,4.9,1.8 c5.5,0,10.2-2.4,10.7-5.3c0.5-2.4-1.6-5.7-4.5-7.2C79.3,93.7,76.2,93.4,74.6,93.9z M81,98.9c0.8-1.2,0.5-2.5-1-3.4 c-2.7-1.7-6.8-0.3-6.8,2.3c0,1.3,2.1,2.7,4.1,2.7C78.6,100.5,80.4,99.7,81,98.9z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SwapCard — Real on-chain Uniswap V2 swap widget
   ══════════════════════════════════════════════════════════════════════ */
export default function SwapCard() {
  /* ── Wallet state ── */
  const [wallet, setWallet] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  /* ── Swap state ── */
  const [direction, setDirection] = useState<Direction>("ethToWojak");
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippage, setShowSlippage] = useState(false);

  /* ── Reserves (float — from /api/pool, human-readable units) ── */
  const [wojakReserve, setWojakReserve] = useState(0);
  const [ethReserve, setEthReserve] = useState(0);

  /* ── Balances (float, human-readable) ── */
  const [ethBalance, setEthBalance] = useState<number | null>(null);
  const [wojakBalance, setWojakBalance] = useState<number | null>(null);

  /* ── Token approval (WOJAK → ETH direction) ── */
  const [needsApproval, setNeedsApproval] = useState(false);

  /* ── Transaction state ── */
  const [status, setStatus] = useState<"idle" | "approving" | "swapping">("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState(false);

  /* ── Rolodex ticker state (unchanged from original) ── */
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [gasGwei, setGasGwei] = useState<number | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerKey, setTickerKey] = useState(0);
  const gasIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ════════════════════════════════════════════════════════════════════
     DATA FETCHING — /api/pool for prices + reserves (single call)
     ════════════════════════════════════════════════════════════════════ */
  const fetchPoolData = useCallback(() => {
    fetch("/api/pool")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        // Prices (for ticker)
        if (data.wojakPrice > 0 && data.ethPrice > 0) {
          setPrices({
            wojakPriceUsd: data.wojakPrice,
            wojakPriceEth: data.wojakPrice / data.ethPrice,
            ethPriceUsd: data.ethPrice,
          });
        }
        // Reserves (for quotes — already in human-readable float form)
        if (data.wojakReserve > 0) setWojakReserve(data.wojakReserve);
        if (data.ethReserve > 0) setEthReserve(data.ethReserve);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPoolData();
    const interval = setInterval(fetchPoolData, 15000);
    return () => clearInterval(interval);
  }, [fetchPoolData]);

  /* ── Gas price (separate endpoint, 45s interval) ── */
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
    gasIntervalRef.current = setInterval(fetchGas, 45000);
    return () => {
      if (gasIntervalRef.current) clearInterval(gasIntervalRef.current);
    };
  }, [fetchGas]);

  /* ── Ticker rotation ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((p) => (p + 1) % 3);
      setTickerKey((p) => p + 1);
    }, TICKER_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const getTickerContent = () => {
    switch (tickerIndex) {
      case 0: {
        const val = !prices
          ? "$—"
          : prices.wojakPriceUsd < 0.01
          ? `$${prices.wojakPriceUsd.toFixed(8)}`
          : `$${prices.wojakPriceUsd.toFixed(4)}`;
        return <>{val}</>;
      }
      case 1: {
        const val = !prices
          ? "—"
          : prices.wojakPriceEth < 0.0001
          ? prices.wojakPriceEth.toFixed(11)
          : prices.wojakPriceEth.toFixed(8);
        return (
          <>
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
        const val =
          gasGwei === null ? "—" : gasGwei < 1 ? gasGwei.toFixed(2) : String(Math.round(gasGwei));
        return (
          <>
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

  /* ════════════════════════════════════════════════════════════════════
     WALLET CONNECTION
     ════════════════════════════════════════════════════════════════════ */

  // Auto-reconnect if MetaMask already connected
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    (window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>)
      .then((accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          (window.ethereum!.request({ method: "eth_chainId" }) as Promise<string>).then((id) => {
            setChainId(parseInt(id, 16));
          });
        }
      })
      .catch(() => {});

    const handleAccounts = (accounts: unknown) => {
      const accts = accounts as string[];
      setWallet(accts.length > 0 ? accts[0] : null);
      setError(null);
      setTxHash(null);
      setTxSuccess(false);
    };
    const handleChain = (id: unknown) => {
      setChainId(parseInt(id as string, 16));
      setError(null);
    };

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccounts);
      window.ethereum?.removeListener("chainChanged", handleChain);
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      setWallet(accounts[0]);
      const id = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      setChainId(parseInt(id, 16));
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code === 4001) setError("Connection rejected");
      else setError("Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  const switchToMainnet = async () => {
    try {
      await window.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }],
      });
    } catch {}
  };

  /* ════════════════════════════════════════════════════════════════════
     BALANCES — via MetaMask provider (fast, no public RPC)
     ════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!wallet || !window.ethereum) {
      setEthBalance(null);
      setWojakBalance(null);
      return;
    }
    const fetchBal = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum!);
        const [eBal, wBal] = await Promise.all([
          provider.getBalance(wallet),
          new Contract(WOJAK, ERC20_ABI, provider).balanceOf(wallet),
        ]);
        setEthBalance(parseFloat(formatEther(eBal)));
        setWojakBalance(Math.floor(parseFloat(formatUnits(wBal, 18))));
      } catch {}
    };
    fetchBal();
    const interval = setInterval(fetchBal, 30000);
    return () => clearInterval(interval);
  }, [wallet]);

  /* ════════════════════════════════════════════════════════════════════
     APPROVAL CHECK (WOJAK → ETH direction) — via MetaMask provider
     ════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (direction !== "wojakToEth" || !wallet || !sellAmount || !window.ethereum) {
      setNeedsApproval(false);
      return;
    }
    const check = async () => {
      try {
        const raw = sellAmount.replace(/,/g, "");
        if (!raw || raw === "0") { setNeedsApproval(false); return; }
        const provider = new BrowserProvider(window.ethereum!);
        const token = new Contract(WOJAK, ERC20_ABI, provider);
        const allowance: bigint = await token.allowance(wallet, ROUTER);
        const amount = parseUnits(raw, 18);
        setNeedsApproval(allowance < amount);
      } catch {
        setNeedsApproval(true);
      }
    };
    check();
  }, [direction, wallet, sellAmount]);

  /* ════════════════════════════════════════════════════════════════════
     QUOTE CALCULATION — instant float math, no RPC needed
     ════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!sellAmount || wojakReserve <= 0 || ethReserve <= 0) {
      setBuyAmount("");
      return;
    }
    try {
      if (direction === "ethToWojak") {
        const ethIn = parseFloat(sellAmount);
        if (isNaN(ethIn) || ethIn <= 0) { setBuyAmount(""); return; }
        const tokensOut = getQuote(ethIn, ethReserve, wojakReserve);
        const whole = Math.floor(tokensOut);
        setBuyAmount(whole > 0 ? `~${whole.toLocaleString()}` : "~0");
      } else {
        const raw = sellAmount.replace(/,/g, "");
        if (!raw || raw === "0") { setBuyAmount(""); return; }
        const tokensIn = parseInt(raw);
        if (isNaN(tokensIn) || tokensIn <= 0) { setBuyAmount(""); return; }
        const ethOut = getQuote(tokensIn, wojakReserve, ethReserve);
        setBuyAmount(ethOut < 0.0001 && ethOut > 0 ? `~${ethOut.toExponential(2)}` : `~${ethOut.toFixed(4)}`);
      }
    } catch {
      setBuyAmount("");
    }
  }, [sellAmount, direction, wojakReserve, ethReserve]);

  /* ════════════════════════════════════════════════════════════════════
     APPROVE WOJAK
     ════════════════════════════════════════════════════════════════════ */
  const approveWojak = async () => {
    if (!wallet || !window.ethereum) return;
    setStatus("approving");
    setError(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new Contract(WOJAK, ERC20_ABI, signer);
      const tx = await token.approve(ROUTER, MaxUint256);
      await tx.wait();
      setNeedsApproval(false);
    } catch (err: unknown) {
      const e = err as { code?: string | number };
      if (e.code === "ACTION_REJECTED" || e.code === 4001) {
        setError("Approval rejected");
      } else {
        setError("Approval failed");
      }
    } finally {
      setStatus("idle");
    }
  };

  /* ════════════════════════════════════════════════════════════════════
     EXECUTE SWAP — uses float reserves for amountOutMin, ethers for tx
     ════════════════════════════════════════════════════════════════════ */
  const executeSwap = async () => {
    if (!wallet || !window.ethereum || !sellAmount) return;

    setStatus("swapping");
    setError(null);
    setTxHash(null);
    setTxSuccess(false);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const router = new Contract(ROUTER, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60; // 20 min
      const slippageMul = 1 - slippage / 100;

      if (direction === "ethToWojak") {
        const ethIn = parseFloat(sellAmount);
        // Balance check
        if (ethBalance !== null && ethIn > ethBalance) {
          setError("Insufficient ETH balance");
          setStatus("idle");
          return;
        }
        const amountIn = parseEther(sellAmount);
        const estimatedOut = getQuote(ethIn, ethReserve, wojakReserve);
        const minOut = Math.floor(estimatedOut * slippageMul);
        const amountOutMin = parseUnits(String(minOut), 18);

        const tx = await router.swapExactETHForTokens(
          amountOutMin,
          [WETH, WOJAK],
          wallet,
          deadline,
          { value: amountIn }
        );
        setTxHash(tx.hash);
        await tx.wait();
        setTxSuccess(true);
        setSellAmount("");
        setBuyAmount("");
      } else {
        const raw = sellAmount.replace(/,/g, "");
        const tokensIn = parseInt(raw);
        // Balance check
        if (wojakBalance !== null && tokensIn > wojakBalance) {
          setError("Insufficient WOJAK balance");
          setStatus("idle");
          return;
        }
        const amountIn = parseUnits(raw, 18);
        const estimatedOut = getQuote(tokensIn, wojakReserve, ethReserve);
        const minOut = estimatedOut * slippageMul;
        // Safely format ETH amount (avoid scientific notation)
        const minOutStr = minOut < 1e-15 ? "0" : minOut.toFixed(18);
        const amountOutMin = parseEther(minOutStr);

        const tx = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          [WOJAK, WETH],
          wallet,
          deadline
        );
        setTxHash(tx.hash);
        await tx.wait();
        setTxSuccess(true);
        setSellAmount("");
        setBuyAmount("");
      }

      // Refresh data after swap
      fetchPoolData();
    } catch (err: unknown) {
      const e = err as { code?: string | number; message?: string; reason?: string };
      if (e.code === "ACTION_REJECTED" || e.code === 4001) {
        setError("Transaction rejected");
      } else if (e.message?.includes("INSUFFICIENT_OUTPUT_AMOUNT")) {
        setError("Slippage exceeded — increase tolerance");
      } else {
        setError(e.reason || e.message?.slice(0, 80) || "Swap failed");
      }
    } finally {
      setStatus("idle");
    }
  };

  /* ════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
     ════════════════════════════════════════════════════════════════════ */
  const handleSellChange = (val: string) => {
    setError(null);
    setTxHash(null);
    setTxSuccess(false);
    if (direction === "ethToWojak") {
      if (val === "" || /^\d*\.?\d*$/.test(val)) setSellAmount(val);
    } else {
      const raw = val.replace(/,/g, "");
      if (raw === "" || /^\d*$/.test(raw)) {
        const n = parseInt(raw);
        setSellAmount(raw === "" || isNaN(n) ? "" : n.toLocaleString());
      }
    }
  };

  const switchDirection = () => {
    setDirection((d) => (d === "ethToWojak" ? "wojakToEth" : "ethToWojak"));
    setSellAmount("");
    setBuyAmount("");
    setError(null);
    setTxHash(null);
    setTxSuccess(false);
  };

  /* ════════════════════════════════════════════════════════════════════
     BUTTON STATE
     ════════════════════════════════════════════════════════════════════ */
  const getButtonState = (): { text: string; action: () => void; disabled: boolean } => {
    if (!wallet) return { text: "Connect Wallet", action: connectWallet, disabled: connecting };
    if (chainId !== MAINNET)
      return { text: "Switch to Ethereum", action: switchToMainnet, disabled: false };
    if (!sellAmount || parseFloat(sellAmount.replace(/,/g, "")) <= 0)
      return { text: "Enter amount", action: () => {}, disabled: true };
    if (status === "approving")
      return { text: "Approving...", action: () => {}, disabled: true };
    if (status === "swapping")
      return { text: "Swapping...", action: () => {}, disabled: true };
    if (direction === "wojakToEth" && needsApproval)
      return { text: "Approve WOJAK", action: approveWojak, disabled: false };
    return { text: "Swap", action: executeSwap, disabled: false };
  };

  const btn = getButtonState();

  /* ── Sell/Buy token labels ── */
  const sellToken = direction === "ethToWojak" ? "ETH" : "WOJAK";
  const buyToken = direction === "ethToWojak" ? "WOJAK" : "ETH";

  /* ── Formatted balance for sell side ── */
  const sellBalanceStr = (() => {
    if (!wallet) return null;
    if (direction === "ethToWojak") {
      if (ethBalance === null) return null;
      return ethBalance < 0.0001 ? "<0.0001" : ethBalance.toFixed(4);
    } else {
      if (wojakBalance === null) return null;
      return wojakBalance.toLocaleString();
    }
  })();

  /* ════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-4 sm:p-5 flex-1 flex flex-col">
        {/* ── Header with rolodex ticker (UNCHANGED) ── */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Swap</h3>
          <div className="relative h-6 overflow-hidden min-w-[130px]">
            <span
              key={tickerKey}
              className="text-sm font-bold font-mono text-[#00ff41] whitespace-nowrap animate-rolodex-up absolute right-0 top-0 flex items-center h-6 tracking-wide drop-shadow-[0_0_6px_rgba(0,255,65,0.3)]"
            >
              {getTickerContent()}
            </span>
          </div>
        </div>

        {/* ── Sell section ── */}
        <div className="bg-black/30 rounded-xl p-4 border border-wojak-border focus-within:border-[#00ff41]/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Sell</p>
            {sellBalanceStr !== null && (
              <p className="text-[10px] text-gray-500">
                Balance: <span className="text-gray-400">{sellBalanceStr}</span>
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              inputMode="decimal"
              value={sellAmount}
              onChange={(e) => handleSellChange(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-2xl font-medium text-white outline-none w-full cursor-text placeholder:text-gray-600 selection:bg-[#00ff41]/20"
            />
            <div className="flex items-center gap-2 bg-wojak-card px-3 py-1.5 rounded-full border border-wojak-border shrink-0">
              {sellToken === "ETH" ? (
                <div className="w-5 h-5 rounded-full bg-[#627eea] flex items-center justify-center">
                  <svg width="10" height="16" viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="#fff" fillOpacity="0.6" />
                    <path d="M127.962 0L0 212.32L127.962 287.959V154.158V0Z" fill="#fff" />
                    <path d="M127.961 312.187L126.386 314.107V412.306L127.961 416.905L255.999 236.585L127.961 312.187Z" fill="#fff" fillOpacity="0.6" />
                    <path d="M127.962 416.905V312.187L0 236.585L127.962 416.905Z" fill="#fff" />
                  </svg>
                </div>
              ) : (
                <img src="/images/whitewojakcoin.jpg" alt="WOJAK" loading="lazy" className="w-5 h-5 rounded-full object-cover" />
              )}
              <span className="text-sm font-semibold text-white">{sellToken}</span>
            </div>
          </div>
        </div>

        {/* ── Arrow divider (clickable — switches direction) ── */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={switchDirection}
            className="w-9 h-9 rounded-lg bg-wojak-card border border-wojak-border flex items-center justify-center hover:border-[#00ff41]/40 transition-colors"
            title="Switch direction"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </button>
        </div>

        {/* ── Buy section (estimated output, read-only) ── */}
        <div className="bg-black/30 rounded-xl p-4 border border-wojak-border">
          <p className="text-xs text-gray-500 mb-2">Buy (estimate)</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-2xl font-medium text-white/70 w-full truncate">
              {buyAmount || "0.0"}
            </span>
            <div className="flex items-center gap-2 bg-wojak-card px-3 py-1.5 rounded-full border border-wojak-border shrink-0">
              {buyToken === "ETH" ? (
                <div className="w-5 h-5 rounded-full bg-[#627eea] flex items-center justify-center">
                  <svg width="10" height="16" viewBox="0 0 256 417" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M127.961 0L125.166 9.5V285.168L127.961 287.958L255.923 212.32L127.961 0Z" fill="#fff" fillOpacity="0.6" />
                    <path d="M127.962 0L0 212.32L127.962 287.959V154.158V0Z" fill="#fff" />
                    <path d="M127.961 312.187L126.386 314.107V412.306L127.961 416.905L255.999 236.585L127.961 312.187Z" fill="#fff" fillOpacity="0.6" />
                    <path d="M127.962 416.905V312.187L0 236.585L127.962 416.905Z" fill="#fff" />
                  </svg>
                </div>
              ) : (
                <img src="/images/whitewojakcoin.jpg" alt="WOJAK" loading="lazy" className="w-5 h-5 rounded-full object-cover" />
              )}
              <span className="text-sm font-semibold text-white">{buyToken}</span>
            </div>
          </div>
        </div>

        {/* ── Slippage settings ── */}
        <div className="mt-2">
          <button
            onClick={() => setShowSlippage((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Slippage: {slippage}%
          </button>

          {showSlippage && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {[0.1, 0.5, 1.0].map((val) => (
                <button
                  key={val}
                  onClick={() => { setSlippage(val); setShowSlippage(false); }}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    slippage === val
                      ? "bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30"
                      : "bg-black/30 text-gray-400 border border-wojak-border hover:border-gray-500"
                  }`}
                >
                  {val}%
                </button>
              ))}
              <input
                type="text"
                inputMode="decimal"
                placeholder="Custom"
                value={![0.1, 0.5, 1.0].includes(slippage) ? String(slippage) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d*$/.test(v)) {
                    const n = parseFloat(v);
                    if (!isNaN(n) && n > 0 && n <= 50) setSlippage(n);
                  }
                }}
                className="w-16 px-2 py-1 rounded text-[11px] font-medium bg-black/30 text-gray-400 border border-wojak-border outline-none focus:border-[#00ff41]/40 placeholder:text-gray-600"
              />
            </div>
          )}
        </div>

        {/* ── Spacer (pushes button + footer to bottom for height alignment) ── */}
        <div className="flex-1 min-h-2" />

        {/* ── Error / Success / Tx hash messages ── */}
        {error && (
          <p className="text-xs text-red-400 text-center mb-2 px-1">{error}</p>
        )}
        {txSuccess && (
          <p className="text-xs text-wojak-green text-center mb-2">Swap successful!</p>
        )}
        {txHash && (
          <p className="text-center mb-2">
            <a
              href={`${ETHERSCAN_BASE_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-wojak-green hover:underline"
            >
              View on Etherscan
            </a>
          </p>
        )}

        {/* ── Swap button ── */}
        <button
          onClick={btn.action}
          disabled={btn.disabled}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors ${
            btn.disabled
              ? "bg-wojak-green/30 text-black/50 cursor-not-allowed"
              : "bg-wojak-green hover:bg-green-300 text-black cursor-pointer"
          }`}
        >
          {connecting ? "Connecting..." : btn.text}
        </button>

        {/* ── Powered by Uniswap footer ── */}
        <div className="flex items-center justify-center mt-3 gap-1.5">
          <UniswapLogo className="w-4 h-5" />
          <p className="text-xs text-gray-600">
            Powered by{" "}
            <a
              href={UNISWAP_POOL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wojak-green hover:underline transition-colors"
            >
              Uniswap
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
