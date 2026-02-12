export default function TokenSafety() {
  return (
    <section id="token-safety" className="scroll-mt-28">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          Token Safety Basics
        </h2>

        <div className="text-gray-300 leading-relaxed space-y-5">
          <p>
            Crypto is full of scams. That&apos;s not to scare you — it&apos;s just the reality. The
            good news is most scams follow the same patterns, and once you know what to look for,
            they&apos;re easy to spot.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">Red Flags to Watch For</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0 mt-0.5"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span>
                <strong className="text-white">Contract is NOT renounced</strong> — If the deployer
                still has admin/owner access, they can change the rules at any time: add taxes, freeze
                your tokens, blacklist your wallet, or mint unlimited new tokens.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0 mt-0.5"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span>
                <strong className="text-white">LP is not locked</strong> — If the liquidity isn&apos;t
                locked, the creator can pull all the liquidity and leave you holding a worthless token.
                Classic rug pull.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0 mt-0.5"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span>
                <strong className="text-white">Blacklist or freeze functions</strong> — If the contract
                has functions like <code className="text-red-400 bg-white/5 px-1.5 py-0.5 rounded text-sm">blacklist()</code>,{" "}
                <code className="text-red-400 bg-white/5 px-1.5 py-0.5 rounded text-sm">setRule()</code>, or{" "}
                <code className="text-red-400 bg-white/5 px-1.5 py-0.5 rounded text-sm">pause()</code>,
                the owner can control who can trade and how. Huge red flag.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0 mt-0.5"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span>
                <strong className="text-white">Unrealistic promises</strong> — &quot;100x
                guaranteed,&quot; &quot;the next Bitcoin,&quot; &quot;guaranteed airdrop if you
                connect wallet&quot; — all scam signals.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0 mt-0.5"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span>
                <strong className="text-white">Pressure to act fast</strong> — Scammers create urgency.
                &quot;Migrate NOW or lose your tokens!&quot; Legitimate projects give you time and
                information.
              </span>
            </li>
          </ul>

          <h3 className="text-white font-semibold text-lg pt-2">What &quot;Renounced Contract&quot; Means</h3>
          <p>
            When a contract is <strong className="text-white">renounced</strong>, the deployer has
            permanently given up all admin/owner privileges. The contract code becomes immutable —
            no one can change the rules, add taxes, blacklist wallets, or mint new tokens. It runs
            exactly as written, forever.
          </p>
          <div className="bg-wojak-green/10 border border-wojak-green/30 rounded-xl p-4 text-sm">
            <p>
              <strong className="text-wojak-green">OG WOJAK&apos;s contract is fully renounced.</strong>{" "}
              Zero admin functions. Zero taxes. Zero blacklisting. It&apos;s a clean ERC-20 token
              that can&apos;t be tampered with. You can verify this on Etherscan by reading the
              contract code.
            </p>
          </div>

          <h3 className="text-white font-semibold text-lg pt-2">Putting It Into Practice</h3>
          <p>
            Before buying any token, always check the contract on Etherscan. Look for renounced
            ownership, locked liquidity, and a clean ERC-20 implementation with no hidden functions.
            If the contract has blacklist, pause, or mint functions that are still controlled by
            an owner — walk away.
          </p>
        </div>
      </div>
    </section>
  );
}
