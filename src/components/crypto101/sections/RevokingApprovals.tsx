import { APPROVAL_CHECKER_URL } from "@/lib/constants";

export default function RevokingApprovals() {
  return (
    <section id="revoke-approvals" className="scroll-mt-28">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          Revoking Approvals
        </h2>

        <div className="text-gray-300 leading-relaxed space-y-5">
          <p>
            When you use a DEX or interact with a smart contract, you often have to &quot;approve&quot;
            it to spend your tokens. This is a normal part of using DeFi — but these approvals can be
            dangerous if you&apos;re not careful.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">What Are Token Approvals?</h3>
          <p>
            An approval is a permission you give to a smart contract, saying: &quot;Hey, you&apos;re
            allowed to move up to X amount of this token from my wallet.&quot; Most dApps ask for
            &quot;unlimited&quot; approval so you don&apos;t have to re-approve every time you trade.
          </p>
          <p>
            The problem? That approval stays active even after you&apos;re done using the dApp. If
            that contract ever gets hacked — or if it was malicious in the first place — it can drain
            the approved tokens from your wallet without any further permission from you.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">Why They Can Be Dangerous</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span>A scam token or malicious dApp you connected to still has approval to drain your tokens</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span>A legitimate dApp you used in the past gets exploited, and the hacker uses your old approval</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 shrink-0"><svg className="inline w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span>Unlimited approvals mean the contract can take ALL of that token, not just the amount you traded</span>
            </li>
          </ul>

          <h3 className="text-white font-semibold text-lg pt-2">How to Check & Revoke Approvals</h3>
          <p>Etherscan has a free tool for this. Here&apos;s how to use it:</p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              Go to{" "}
              <a
                href={APPROVAL_CHECKER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-wojak-green hover:underline"
              >
                etherscan.io/tokenapprovalchecker
              </a>
            </li>
            <li>Connect your wallet or paste your wallet address</li>
            <li>You&apos;ll see a list of every token approval you&apos;ve ever given</li>
            <li>Look for anything suspicious — contracts you don&apos;t recognize, unlimited approvals to unknown addresses</li>
            <li>Click &quot;Revoke&quot; next to any approval you want to remove</li>
            <li>Confirm the transaction in MetaMask (revoking costs a small gas fee)</li>
          </ol>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm">
            <p className="text-yellow-400 font-semibold mb-1"><svg className="inline w-4 h-4 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v1"/><path d="M12 7a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V16h-4v-1.6C8.8 13.8 8 12.5 8 11a4 4 0 0 1 4-4z"/></svg> Pro Tip</p>
            <p>
              Make it a habit to check your approvals regularly — once a month is a good cadence.
              After using a new dApp, go back and revoke the approval if you don&apos;t plan to use
              it again. It&apos;s one of the simplest things you can do to protect your wallet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
