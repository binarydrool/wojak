export default function WhatIsAWallet() {
  return (
    <section id="wallets" className="scroll-mt-28">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          What is a Wallet?
        </h2>

        <div className="text-gray-300 leading-relaxed space-y-5">
          <p>
            A crypto wallet is basically your personal account on the blockchain. Think of it like a
            digital bank account — except <strong className="text-white">you</strong> control it, not a bank. Nobody can
            freeze it, nobody can shut it down. It&apos;s yours.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">MetaMask — The Most Popular Wallet</h3>
          <p>
            MetaMask is a browser extension (Chrome, Firefox, Brave) and mobile app that lets you
            interact with Ethereum. To set it up:
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>Go to <span className="text-wojak-green">metamask.io</span> and install the browser extension</li>
            <li>Click &quot;Create a New Wallet&quot;</li>
            <li>Set a strong password</li>
            <li>Write down your 12-word seed phrase on paper (more on this in the next section)</li>
            <li>Confirm the seed phrase — and you&apos;re in!</li>
          </ol>

          <h3 className="text-white font-semibold text-lg pt-2">Your Wallet Address</h3>
          <p>
            Once your wallet is set up, you&apos;ll get a public address that looks something like:{" "}
            <code className="text-wojak-green bg-white/5 px-2 py-0.5 rounded text-sm">
              0x5026F006...9aaB
            </code>
          </p>
          <p>
            This is like your email address — you can share it with anyone so they can send you crypto.
            It&apos;s completely safe to share your public address.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">Hot Wallets vs Cold Wallets</h3>
          <ul className="space-y-2">
            <li>
              <strong className="text-white">Hot wallet</strong> — Connected to the internet (like
              MetaMask). Great for everyday use, buying and swapping tokens. Convenient but slightly
              more vulnerable since it&apos;s online.
            </li>
            <li>
              <strong className="text-white">Cold wallet</strong> — A physical hardware device (like
              Ledger or Trezor) that stores your keys offline. Best for long-term storage of large
              amounts. Think of it like a safe.
            </li>
          </ul>

          <div className="bg-white/5 border border-wojak-border rounded-xl p-4 text-sm text-gray-400">
            For most people starting out, MetaMask is all you need. Consider getting a cold wallet
            later if you&apos;re holding significant value.
          </div>
        </div>
      </div>
    </section>
  );
}
