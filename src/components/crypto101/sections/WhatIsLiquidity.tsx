import { LP_LOCK_EXPIRY } from "@/lib/constants";

export default function WhatIsLiquidity() {
  return (
    <section id="liquidity" className="scroll-mt-28">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          What is Liquidity?
        </h2>

        <div className="text-gray-300 leading-relaxed space-y-5">
          <p>
            If you&apos;ve seen terms like &quot;liquidity pool,&quot; &quot;LP,&quot; or
            &quot;TVL&quot; floating around and had no idea what they meant — this section is for you.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">Liquidity Pools — Explained Simply</h3>
          <p>
            On a regular exchange like Coinbase, there&apos;s a company matching buyers and sellers.
            On a DEX, there&apos;s no company — instead, there are <strong className="text-white">liquidity
            pools</strong>.
          </p>
          <p>
            A liquidity pool is just a big pot of two tokens locked in a smart contract. For WOJAK,
            the pool holds ETH and WOJAK. When you swap ETH for WOJAK, you&apos;re trading against
            this pool. The pool always has both tokens available so you can trade any time.
          </p>
          <p>
            People who add tokens to the pool are called <strong className="text-white">liquidity
            providers</strong> (LPs). In return, they earn a small fee from every trade that uses the pool.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">Why Locked LP Matters</h3>
          <p>
            Here&apos;s where it gets important for your safety. If the person who created the liquidity
            pool can <em>remove</em> all the tokens from the pool at any time, that&apos;s called a{" "}
            <strong className="text-white">&quot;rug pull&quot;</strong> — they drain the pool, the token
            crashes to zero, and everyone loses their money.
          </p>
          <div className="bg-wojak-green/10 border border-wojak-green/30 rounded-xl p-4">
            <p className="text-wojak-green font-semibold mb-1"><svg className="inline w-4 h-4 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> OG WOJAK&apos;s LP is locked</p>
            <p className="text-sm">
              The OG WOJAK liquidity pool is locked until <strong>{LP_LOCK_EXPIRY}</strong>.
              That means nobody — not even the original deployer — can remove the liquidity.
              The pool is there to stay. This is one of the most important safety features a token
              can have.
            </p>
          </div>

          <h3 className="text-white font-semibold text-lg pt-2">What&apos;s TVL?</h3>
          <p>
            <strong className="text-white">TVL</strong> stands for &quot;Total Value Locked.&quot;
            It&apos;s the total dollar value of all the tokens sitting in the liquidity pool. Higher
            TVL generally means:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>More stable trading — big buys/sells won&apos;t move the price as much</li>
            <li>Less slippage when you swap</li>
            <li>More confidence that the project has real backing</li>
          </ul>

          <div className="bg-white/5 border border-wojak-border rounded-xl p-4 text-sm text-gray-400">
            When evaluating a token, always check if the LP is locked and what the TVL is. A token with
            no locked LP and low TVL is a major red flag.
          </div>
        </div>
      </div>
    </section>
  );
}
