"use client";

import { useEffect } from "react";
import { UNISWAP_POOL_URL } from "@/lib/constants";

interface LPGuideModalProps {
  onClose: () => void;
}

export default function LPGuideModal({ onClose }: LPGuideModalProps) {
  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[900px] max-h-[90vh] overflow-auto bg-wojak-dark rounded-2xl border border-wojak-border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-wojak-border bg-wojak-dark/95 backdrop-blur-sm rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">How to Become a Liquidity Provider</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close guide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Section 1: What is LP? */}
          <section>
            <h3 className="text-base font-semibold text-wojak-green mb-2">What is Liquidity Providing?</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Liquidity providing (LP) means depositing tokens into a trading pool so other people can swap between them. On decentralized exchanges like Uniswap, there is no order book &mdash; instead, trades happen against pools of tokens that liquidity providers have deposited. In return for providing this liquidity, you earn a share of the trading fees generated every time someone makes a swap through the pool.
            </p>
          </section>

          {/* Section 2: How does it work for WOJAK? */}
          <section>
            <h3 className="text-base font-semibold text-wojak-green mb-2">How Does It Work for WOJAK?</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              The WOJAK token trades on Uniswap V2 in a WOJAK/WETH pool. To become a liquidity provider, you deposit <strong className="text-white">equal value</strong> of both ETH and WOJAK into the pool. For example, if you want to provide $1,000 of liquidity, you would deposit $500 worth of ETH and $500 worth of WOJAK.
            </p>
          </section>

          {/* Section 3: What do you get? */}
          <section>
            <h3 className="text-base font-semibold text-wojak-green mb-2">What Do You Get?</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-wojak-green mt-0.5 shrink-0">&bull;</span>
                <span><strong className="text-white">LP tokens</strong> representing your share of the pool. These tokens are your receipt &mdash; you can redeem them at any time to withdraw your share of the pool&apos;s assets.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wojak-green mt-0.5 shrink-0">&bull;</span>
                <span><strong className="text-white">Trading fees</strong> &mdash; every time someone swaps WOJAK or ETH through the pool, a 0.3% fee is charged. This fee is distributed proportionally to all liquidity providers. The more of the pool you own, the more fees you earn.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wojak-green mt-0.5 shrink-0">&bull;</span>
                <span>Your fees compound automatically &mdash; they are added back into the pool, increasing the value of your LP tokens over time.</span>
              </li>
            </ul>
          </section>

          {/* Section 4: The Risks */}
          <section>
            <h3 className="text-base font-semibold text-red-400 mb-2">The Risks &mdash; Impermanent Loss</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              The main risk of providing liquidity is called <strong className="text-white">impermanent loss</strong>. This happens when the price of one token changes significantly relative to the other. The pool automatically rebalances, meaning you end up with more of the token that dropped in price and less of the one that increased.
            </p>
            <div className="bg-black/30 border border-wojak-border rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Example</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Say you deposit $500 of ETH + $500 of WOJAK ($1,000 total). If WOJAK price doubles relative to ETH, the pool rebalances. When you withdraw, you might have $1,300 worth of assets &mdash; but if you had simply held both tokens without providing liquidity, you&apos;d have $1,500. The $200 difference is your impermanent loss. It&apos;s called &ldquo;impermanent&rdquo; because if the price returns to the original ratio, the loss disappears.
              </p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mt-3">
              The trading fees you earn can offset impermanent loss, but in volatile markets the loss can exceed the fees. This is why it&apos;s important to understand this risk before committing.
            </p>
          </section>

          {/* Section 5: Current Pool Stats */}
          <section>
            <h3 className="text-base font-semibold text-wojak-green mb-2">Current Pool Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 border border-wojak-border rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">TVL</p>
                <p className="text-lg font-bold text-white">$951K</p>
              </div>
              <div className="bg-black/20 border border-wojak-border rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">APR</p>
                <p className="text-lg font-bold text-wojak-green">18.81%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Stats are approximate and change with market conditions. Always verify current data on-chain.
            </p>
          </section>

          {/* Section 6: Step by Step */}
          <section>
            <h3 className="text-base font-semibold text-wojak-green mb-2">Step-by-Step Guide</h3>
            <ol className="text-sm text-gray-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-wojak-green/20 text-wojak-green text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span><strong className="text-white">Get ETH and WOJAK in your wallet.</strong> You need equal dollar value of both. Buy WOJAK using the swap widget on our dashboard or on any DEX.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-wojak-green/20 text-wojak-green text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>
                  <strong className="text-white">Go to the Uniswap pool page.</strong>{" "}
                  <a href={UNISWAP_POOL_URL} target="_blank" rel="noopener noreferrer" className="text-wojak-green hover:underline">
                    Open WOJAK/WETH pool
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-wojak-green/20 text-wojak-green text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span><strong className="text-white">Click &ldquo;Add Liquidity&rdquo;</strong> and connect your wallet.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-wojak-green/20 text-wojak-green text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">4</span>
                <span><strong className="text-white">Set your amounts.</strong> Enter how much ETH or WOJAK you want to deposit. The other side will auto-fill to match the current pool ratio.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-wojak-green/20 text-wojak-green text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">5</span>
                <span><strong className="text-white">Approve and confirm.</strong> You&apos;ll first approve the WOJAK token spend, then confirm the liquidity deposit. Both are on-chain transactions that cost gas.</span>
              </li>
            </ol>
          </section>

          {/* Disclaimer */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-300 leading-relaxed">
              <strong>Risk Warning:</strong> Providing liquidity carries real risks. Understand impermanent loss before committing funds. Past APR does not guarantee future returns. Never deposit more than you can afford to lose. This is not financial advice &mdash; always do your own research.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
