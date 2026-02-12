import { COW_SWAP_URL } from "@/lib/constants";

export default function HowToSwap() {
  return (
    <section id="swap-tokens" className="scroll-mt-28">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          How to Swap Tokens
        </h2>

        <div className="text-gray-300 leading-relaxed space-y-5">
          <p>
            Now that you have ETH in your wallet, you can swap it for tokens like WOJAK. You do this
            on a <strong className="text-white">DEX</strong> (decentralized exchange) — a platform that
            lets you trade tokens directly from your wallet, without signing up for anything.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">What&apos;s a DEX?</h3>
          <p>
            Unlike Coinbase or Binance (which are centralized), a DEX runs entirely on smart contracts.
            You connect your wallet, pick what you want to swap, approve the transaction, and it happens
            on-chain. No middleman, no account needed. Popular DEXs include Uniswap, CoW Swap, and
            SushiSwap.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">How to Swap on CoW Swap</h3>
          <p>
            We have a{" "}
            <a href="/#swap" className="text-wojak-green hover:underline">
              swap card right on our dashboard
            </a>{" "}
            — it&apos;s the easiest way to buy WOJAK. Or you can go directly to{" "}
            <a
              href={COW_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wojak-green hover:underline"
            >
              CoW Swap
            </a>
            . Here&apos;s how:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>Connect your MetaMask wallet</li>
            <li>Set &quot;Sell&quot; to ETH</li>
            <li>Set &quot;Buy&quot; to WOJAK (the contract address will be pre-filled on our widget)</li>
            <li>Enter the amount of ETH you want to swap</li>
            <li>Review the price and click &quot;Swap&quot;</li>
            <li>Confirm the transaction in MetaMask</li>
          </ol>

          <h3 className="text-white font-semibold text-lg pt-2">What&apos;s Slippage?</h3>
          <p>
            Slippage is the difference between the price you expect and the price you actually get.
            Crypto prices can move between when you submit a swap and when it executes. Setting slippage
            to 1-3% is usually fine. If you set it too low, the swap might fail. If you set it too
            high, you might get a worse price.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">MEV Protection — Why We Use CoW Swap</h3>
          <div className="bg-wojak-green/10 border border-wojak-green/30 rounded-xl p-4">
            <p className="text-wojak-green font-semibold mb-1"><svg className="inline w-4 h-4 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> MEV Protected</p>
            <p className="text-sm">
              MEV (Maximal Extractable Value) attacks — also called &quot;sandwich attacks&quot; —
              happen when bots see your pending swap and front-run it to profit at your expense.
              CoW Swap batches trades off-chain and settles them together, so bots can&apos;t see
              or front-run your trade. That&apos;s why we recommend it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
