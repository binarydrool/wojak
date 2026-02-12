import { ETHERSCAN_TOKEN_URL, OG_WOJAK_CONTRACT } from "@/lib/constants";

export default function ReadingEtherscan() {
  return (
    <section id="etherscan" className="scroll-mt-28">
      <div className="bg-wojak-card border border-wojak-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          Reading Etherscan
        </h2>

        <div className="text-gray-300 leading-relaxed space-y-5">
          <p>
            Etherscan is the blockchain explorer for Ethereum. It lets you look up any wallet,
            transaction, or smart contract — everything that happens on Ethereum is public and
            verifiable. Think of it as the &quot;Google&quot; for the blockchain.
          </p>

          <h3 className="text-white font-semibold text-lg pt-2">Looking Up a Token Contract</h3>
          <p>
            Go to{" "}
            <a
              href={ETHERSCAN_TOKEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wojak-green hover:underline"
            >
              etherscan.io
            </a>{" "}
            and paste a contract address in the search bar. For example, OG WOJAK&apos;s contract:{" "}
            <code className="text-wojak-green bg-white/5 px-2 py-0.5 rounded text-sm break-all">
              {OG_WOJAK_CONTRACT}
            </code>
          </p>
          <p>On the token page you&apos;ll see:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Total supply — how many tokens exist</li>
            <li>Holders — how many wallets hold this token</li>
            <li>Transfers — complete history of every transaction</li>
            <li>Contract — the actual smart contract code (if verified)</li>
          </ul>

          <h3 className="text-white font-semibold text-lg pt-2">Verifying a Transaction</h3>
          <p>
            Every transaction on Ethereum has a unique <strong className="text-white">transaction hash</strong>{" "}
            (TX hash). If someone says they sent you tokens, ask for the TX hash and look it up on
            Etherscan. You&apos;ll see:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Whether it succeeded or failed</li>
            <li>The exact amount transferred</li>
            <li>The sender and receiver addresses</li>
            <li>The gas fee paid</li>
            <li>The exact time it happened</li>
          </ul>

          <div className="bg-white/5 border border-wojak-border rounded-xl p-4 text-sm text-gray-400">
            If it&apos;s on Etherscan, it happened. If it&apos;s not on Etherscan, it didn&apos;t.
            Simple as that.
          </div>

          <h3 className="text-white font-semibold text-lg pt-2">Checking Token Approvals</h3>
          <p>
            On Etherscan, you can check what contracts you&apos;ve given permission to spend your
            tokens. Go to any token contract page &rarr; &quot;Token Approvals&quot; tab to see active
            approvals. If you see an approval you don&apos;t recognize, revoke it immediately (more on
            this in the{" "}
            <a href="#revoke-approvals" className="text-wojak-green hover:underline">
              Revoking Approvals
            </a>{" "}
            section below).
          </p>
        </div>
      </div>
    </section>
  );
}
