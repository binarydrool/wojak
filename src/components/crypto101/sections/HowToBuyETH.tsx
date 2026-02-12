export default function HowToBuyETH() {
  return (
    <section id="buy-eth" className="scroll-mt-28">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          How to Buy ETH
        </h2>

        <div className="text-gray-300 leading-relaxed space-y-5">
          <p>
            Before you can buy any token on Ethereum (including WOJAK), you need ETH in your wallet.
            ETH is the native currency of the Ethereum network — you use it to pay for transactions
            and to swap for other tokens.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">On-Ramp Options (Buying ETH with Real Money)</h3>
          <p>These services let you buy ETH with a debit card, bank transfer, or Apple Pay:</p>
          <ul className="space-y-2">
            <li>
              <strong className="text-white">Coinbase</strong> — One of the most popular and
              beginner-friendly exchanges. Create an account, verify your identity, and buy ETH
              directly. Then send it to your MetaMask wallet.
            </li>
            <li>
              <strong className="text-white">MoonPay</strong> — Built into many wallets and apps. You
              can buy ETH with a card and have it sent straight to your wallet address.
            </li>
            <li>
              <strong className="text-white">Transak / Ramp</strong> — Similar to MoonPay. Some
              wallets have these built in as &quot;Buy&quot; options.
            </li>
            <li>
              <strong className="text-white">MetaMask Buy</strong> — MetaMask itself has a
              &quot;Buy&quot; button that connects you to on-ramp providers. Easiest way if
              you&apos;re already in MetaMask.
            </li>
          </ul>

          <h3 className="text-white font-semibold text-lg pt-2">Sending ETH from an Exchange to MetaMask</h3>
          <p>If you bought ETH on Coinbase (or any exchange):</p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>Open MetaMask and copy your wallet address (click your address at the top)</li>
            <li>Go to Coinbase &rarr; Send/Withdraw</li>
            <li>Paste your MetaMask wallet address</li>
            <li>Choose the amount of ETH to send</li>
            <li>Make sure the network is <strong className="text-white">Ethereum (ERC-20)</strong> — not
              Polygon, Arbitrum, or any other network</li>
            <li>Confirm and wait a minute or two for the transaction to complete</li>
          </ol>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm">
            <p className="text-yellow-400 font-semibold mb-1"><svg className="inline w-4 h-4 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Important</p>
            <p>
              Always double-check the wallet address before sending. Crypto transactions are
              irreversible — if you send to the wrong address, it&apos;s gone. Start with a small test
              amount first.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
