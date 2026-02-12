export default function PrivateKeys() {
  return (
    <section id="private-keys" className="scroll-mt-28">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          Private Keys & Seed Phrases
        </h2>

        <div className="text-gray-300 leading-relaxed space-y-5">
          <p>
            Your private key is the master password to your wallet. Whoever has it has{" "}
            <strong className="text-white">full control</strong> of everything in that wallet. They can
            move all your tokens, drain your ETH — everything. Gone forever.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">What&apos;s a Seed Phrase?</h3>
          <p>
            When you created your MetaMask wallet, you were given 12 (or 24) random words. That&apos;s
            your seed phrase — it&apos;s basically your private key in human-readable form. Anyone with
            those words can recreate your entire wallet on any device.
          </p>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 font-bold text-base mb-2">
              <svg className="inline w-4 h-4 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> NEVER share your seed phrase or private key with ANYONE
            </p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-400 shrink-0"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
                No legitimate service will ever ask for your seed phrase
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 shrink-0"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
                MetaMask support will NEVER DM you asking for it
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 shrink-0"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
                Don&apos;t type it into any website — ever
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 shrink-0"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
                Don&apos;t store it in a text file, screenshot, or cloud storage
              </li>
            </ul>
          </div>

          <h3 className="text-white font-semibold text-lg pt-2">How to Back It Up Safely</h3>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>Write the 12 words down <strong className="text-white">on paper</strong> — by hand</li>
            <li>Double-check the order and spelling</li>
            <li>Store the paper somewhere safe and private (a safe, a lockbox, etc.)</li>
            <li>Consider making a second backup stored in a different physical location</li>
            <li>Never take a photo of it or save it digitally</li>
          </ol>

          <div className="bg-white/5 border border-wojak-border rounded-xl p-4 text-sm text-gray-400">
            If you lose your seed phrase and your device breaks, your wallet is gone forever. There is
            no &quot;forgot password&quot; button in crypto. You are your own bank — that means the
            security is on you.
          </div>
        </div>
      </div>
    </section>
  );
}
