import ComparisonTable from "./ComparisonTable";
import {
  OG_WOJAK_CONTRACT,
  CTO_CONTRACT,
  OG_UNISWAP_POOL,
  APPROVAL_CHECKER_URL,
  TWITTER_URL,
  CTO_TWITTER_URL,
  SITE_NAME,
} from "@/lib/constants";

function SectionCard({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`bg-wojak-card border border-wojak-border rounded-2xl p-6 sm:p-8 scroll-mt-20 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
      {children}
    </h2>
  );
}

export default function ReportContent() {
  return (
    <div className="space-y-6">
      {/* 1. Page Title */}
      <div className="text-center mb-8">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
          WOJAK OG Community
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
          Migration Analysis Report
        </h1>
        <p className="text-gray-400">February 11, 2026</p>
        <p className="text-xs text-gray-600 mt-2">
          All data sourced from on-chain records, Etherscan, DexTools, and public announcements
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="bg-wojak-card border border-wojak-border rounded-2xl p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contents</h2>
        <ol className="columns-1 sm:columns-2 gap-x-8 space-y-1.5">
          {[
            { id: "tldr", label: "TL;DR" },
            { id: "what-is-happening", label: "What Is Happening" },
            { id: "comparison", label: "The Two Contracts — Side by Side" },
            { id: "red-flags", label: "Contract Design Concerns (0x8D)" },
            { id: "migration-mechanics", label: "How the Migration Works" },
            { id: "platform-attacks", label: "What They Have Done to the OG Token" },
            { id: "numbers", label: "The Numbers Don\u2019t Add Up" },
            { id: "og-strengths", label: "What the OG Contract Has Going For It" },
            { id: "what-to-do", label: "What You Should Do" },
            { id: "contracts", label: "Contract Addresses" },
          ].map((item, i) => (
            <li key={item.id} className="break-inside-avoid">
              <a
                href={`#${item.id}`}
                className="text-wojak-green hover:underline text-sm transition-colors"
              >
                {i + 1}. {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 2. TL;DR Summary */}
      <SectionCard id="tldr" className="border-yellow-500/30 bg-yellow-500/[0.03]">
        <div className="flex items-start gap-3">
          <span className="text-yellow-400 text-xl mt-0.5 shrink-0"><svg className="inline w-5 h-5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          <div>
            <h2 className="text-lg font-bold text-yellow-400 mb-2">TL;DR</h2>
            <p className="text-gray-200 font-medium leading-relaxed">
              A group operating as @wojakcto is running a hostile &ldquo;migration&rdquo; from the original WOJAK contract
              to a new token they control. Every migration is a sell order on the OG token — this is likely why market cap
              dropped from ~$29M to ~$2M. Both contracts are now renounced, but they are NOT the same: the new contract
              (0x8D) was deployed with blacklist, setRule, and trading control functions that were active before ownership
              was renounced — any settings or blacklisted wallets from that period are now permanently locked in. The OG
              contract (0x50) is a clean OpenZeppelin ERC-20 that never had ANY admin functions — no blacklist was ever
              possible, no trading controls ever existed. OG LP is locked until 2100. 14,000+ holders have not migrated.
              Do your own research and verify everything on-chain before taking any action.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 3. What Is Happening */}
      <SectionCard id="what-is-happening">
        <SectionHeading>What Is Happening</SectionHeading>
        <p className="text-gray-300 leading-relaxed">
          A group operating under{" "}
          <a href={CTO_TWITTER_URL} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
            @wojakcto
          </a>{" "}
          on X is running a &ldquo;migration&rdquo; from the original WOJAK contract (0x50) to a new token (0x8d). They
          claim the OG token is dead and everyone must migrate within a 2-week window via migrate.wojakcto.com at a 1:958
          swap ratio. This report breaks down why the OG community should be cautious, backed by on-chain facts.
        </p>
      </SectionCard>

      {/* 4. Side-by-Side Comparison Table */}
      <SectionCard id="comparison">
        <SectionHeading>The Two Contracts — Side by Side</SectionHeading>
        <ComparisonTable />
      </SectionCard>

      {/* 5. Contract Design Concerns (0x8D) */}
      <SectionCard id="red-flags" className="border-yellow-500/20">
        <SectionHeading>
          Contract Design Concerns{" "}
          <span className="text-yellow-400">(0x8D)</span>
        </SectionHeading>
        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
          Ownership of the new contract has been renounced (owner&nbsp;={" "}
          <code className="text-gray-400 bg-white/5 px-1 rounded text-xs">0x0</code>). However, the contract was
          originally deployed with the following owner-controlled functions. While these can no longer be called,
          their presence reveals the contract&apos;s design philosophy:
        </p>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="text-yellow-400 font-bold shrink-0">1.</span>
            <div>
              <code className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded text-sm">
                blacklist(address, bool)
              </code>
              <p className="text-gray-300 mt-1">
                This function allowed the owner to freeze any wallet. Now that ownership is renounced, no NEW wallets
                can be blacklisted. However, any wallets that WERE blacklisted before renouncing remain permanently
                frozen — there is no way to remove them.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400 font-bold shrink-0">2.</span>
            <div>
              <code className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded text-sm">
                setRule(bool, address, uint256, uint256)
              </code>
              <p className="text-gray-300 mt-1">
                This function allowed the owner to set trading limits, max/min holding amounts, and control trading
                conditions. These settings are now locked in whatever state they were in when ownership was renounced.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400 font-bold shrink-0">3.</span>
            <div>
              <code className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded text-sm">
                _beforeTokenTransfer override
              </code>
              <p className="text-gray-300 mt-1">
                Every transfer still checks the blacklist and trading rules. These checks are hardcoded and permanent
                — they cannot be removed even with ownership renounced.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-yellow-400 font-bold shrink-0">4.</span>
            <div>
              <code className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded text-sm">
                Ownership renounced to 0x0
              </code>
              <p className="text-gray-300 mt-1">
                Ownership has been renounced to{" "}
                <code className="text-gray-400 bg-white/5 px-1 rounded text-xs">0x0</code>. The onlyOwner functions
                (blacklist, setRule) can no longer be called by anyone.
              </p>
            </div>
          </li>
        </ol>
        <div className="mt-6 bg-green-500/5 border border-green-500/20 rounded-lg px-4 py-3">
          <p className="text-sm text-gray-300 leading-relaxed">
            The OG contract (0x50) was deployed as a clean ERC-20 with{" "}
            <span className="text-green-400 font-semibold">ZERO admin functions from day one</span>. No blacklist was
            ever possible. No trading controls were ever possible. The contract was designed to be trustless from the
            start — not made trustless after the fact.
          </p>
        </div>
      </SectionCard>

      {/* 6. How the Migration Works */}
      <SectionCard id="migration-mechanics">
        <SectionHeading>How the Migration Works — And Why It Hurts OG Holders</SectionHeading>
        <p className="text-gray-400 text-sm mb-4">
          The portal describes: &ldquo;Send, receive, swap, buy, and burn done automatically.&rdquo; Based on this, the
          most likely sequence:
        </p>
        <ol className="space-y-3 mb-6">
          <li className="flex gap-3 items-start">
            <span className="bg-red-500/20 text-red-400 font-bold rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm">
              1
            </span>
            <p className="text-gray-300">
              Your OG 0x50 tokens are <span className="text-red-400 font-semibold">SOLD on Uniswap for ETH</span> —
              direct sell pressure on OG.
            </p>
          </li>
          <li className="flex gap-3 items-start">
            <span className="bg-red-500/20 text-red-400 font-bold rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm">
              2
            </span>
            <p className="text-gray-300">
              ETH is used to <span className="text-red-400 font-semibold">BUY new 0x8d tokens</span> — buy pressure on
              new token.
            </p>
          </li>
          <li className="flex gap-3 items-start">
            <span className="bg-red-500/20 text-red-400 font-bold rounded-full w-7 h-7 flex items-center justify-center shrink-0 text-sm">
              3
            </span>
            <p className="text-gray-300">
              New 0x8d tokens sent to your wallet. Some portion may be burned.
            </p>
          </li>
        </ol>
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 space-y-3">
          <p className="text-gray-200 font-medium">
            EVERY MIGRATION IS A SELL ORDER ON THE OG TOKEN.{" "}
            <span className="text-gray-400 font-normal">
              This is likely why OG market cap dropped from ~$29M to ~$2M. Whoever controls the new token&apos;s LP
              catches the buy pressure. Every migration enriches 0x8d LP holders at OG holders&apos; expense.
            </span>
          </p>
          <p className="text-red-400 text-sm font-medium">
            The migration portal does NOT disclose the migration contract address. Without it, nobody can verify what
            happens to your tokens. This alone is a massive red flag.
          </p>
        </div>
      </SectionCard>

      {/* 7. What They Have Done to the OG Token */}
      <SectionCard id="platform-attacks">
        <SectionHeading>What They Have Done to the OG Token</SectionHeading>
        <ul className="space-y-3">
          {[
            {
              platform: "Etherscan",
              detail: "Submitted CTO update request, got OG logo/branding changed or removed.",
            },
            {
              platform: "DEX Screener / DexTools",
              detail: "Spam/warning banner added to OG token's page, misleading migration notices.",
            },
            {
              platform: "CoinMarketCap",
              detail: "Listed new 0x8d contract under WOJAK name with their branding.",
            },
            {
              platform: "CEXs",
              detail:
                "MEXC (Feb 3) and BitMart (Feb 2) announced contract swaps, calling 0x50 \"former.\"",
            },
            {
              platform: "X/Twitter",
              detail: "migrate.wojakcto.com flagged by Twitter safety as \"potentially spammy or unsafe.\"",
            },
          ].map((item) => (
            <li key={item.platform} className="flex gap-3 items-start">
              <span className="text-red-400 mt-1 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </span>
              <p className="text-gray-300">
                <span className="text-white font-medium">{item.platform}:</span> {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* 8. The Numbers Don't Add Up */}
      <SectionCard id="numbers">
        <SectionHeading>The Numbers Don&apos;t Add Up</SectionHeading>
        <ul className="space-y-3">
          {[
            <>
              <span className="text-wojak-green font-semibold">14,000+ holders</span> have NOT migrated (19,000+ OG vs
              ~5,580 new).
            </>,
            <>
              OG has <span className="text-wojak-green font-semibold">$932K liquidity</span> vs new&apos;s $513K —
              nearly 2x more.
            </>,
            <>
              OG has <span className="text-wojak-green font-semibold">100K+ transactions</span>. Battle-tested for 2+
              years.
            </>,
            <>
              New token volatility is{" "}
              <span className="text-red-400 font-semibold">2.4x higher</span> (0.7371 vs 0.3066) — more speculative.
            </>,
            <>
              Supply ballooned from 69.42B to 420.69T —{" "}
              <span className="text-red-400 font-semibold">6,057x dilution</span>.
            </>,
          ].map((content, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="text-wojak-green mt-1 shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
              <p className="text-gray-300">{content}</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* 9. What the OG Contract Has Going For It */}
      <SectionCard id="og-strengths" className="border-green-500/20">
        <SectionHeading>What the OG Contract Has Going For It</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Clean from Day One", icon: "shield" },
            { label: "LP locked until 2100", icon: "lock" },
            { label: "Zero taxes", icon: "zap" },
            { label: "19,000+ holders", icon: "users" },
            { label: "~$1M liquidity", icon: "dollar" },
            { label: "Clean ERC-20 code", icon: "code" },
            { label: "100K+ transactions", icon: "activity" },
            { label: "@WojakToken on X", icon: "twitter" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-green-500/5 border border-green-500/15 rounded-xl px-3 py-3 text-center"
            >
              <div className="text-green-400 flex justify-center mb-2">
                {item.icon === "shield" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                )}
                {item.icon === "lock" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
                {item.icon === "zap" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                )}
                {item.icon === "users" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                )}
                {item.icon === "dollar" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                )}
                {item.icon === "code" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                )}
                {item.icon === "activity" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                )}
                {item.icon === "twitter" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                )}
              </div>
              <p className="text-green-400 text-xs sm:text-sm font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 10. What You Should Do */}
      <SectionCard id="what-to-do" className="border-yellow-500/20">
        <SectionHeading>What You Should Do</SectionHeading>
        <p className="text-gray-400 text-sm mb-4">
          We are not saying the new token is a scam. We are saying the OG token is fundamentally cleaner by design,
          and the migration creates unnecessary sell pressure on OG holders. Make informed decisions.
        </p>
        <div className="space-y-3">
          {/* DO NOT items — red/warning */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-red-400 font-bold text-lg shrink-0"><svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <p className="text-red-300 font-semibold">
                DO NOT connect your wallet to migrate.wojakcto.com
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-red-400 font-bold text-lg shrink-0"><svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <p className="text-red-300 font-semibold">
                DO NOT approve any unknown contracts to spend your WOJAK tokens
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-yellow-400 font-bold text-lg shrink-0"><svg className="inline w-5 h-5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
              <p className="text-gray-300">
                Already approved? Revoke immediately at{" "}
                <a
                  href={APPROVAL_CHECKER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:underline font-medium"
                >
                  etherscan.io/tokenapprovalchecker
                </a>
              </p>
            </div>
          </div>

          {/* Positive action items — green */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-green-400 font-bold text-lg shrink-0"><svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
              <p className="text-gray-300">
                Continue to hold OG WOJAK (
                <span className="font-mono text-xs text-green-400">
                  {OG_WOJAK_CONTRACT}
                </span>
                )
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-green-400 font-bold text-lg shrink-0"><svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
              <p className="text-gray-300">
                Report{" "}
                <a
                  href={CTO_TWITTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wojak-green hover:underline"
                >
                  @wojakcto
                </a>{" "}
                for misleading content
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-green-400 font-bold text-lg shrink-0"><svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
              <p className="text-gray-300">
                Contact CoinGecko, Etherscan, CMC to dispute CTO claims and restore OG branding
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-green-400 font-bold text-lg shrink-0"><svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
              <p className="text-gray-300">
                Spread this information to the community
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 11. Contract Addresses Reference Table */}
      <SectionCard id="contracts">
        <SectionHeading>Contract Addresses for Reference</SectionHeading>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[400px] px-4 sm:px-0">
            <table className="w-full">
              <tbody className="divide-y divide-wojak-border/50">
                {[
                  { label: "OG WOJAK", value: OG_WOJAK_CONTRACT, mono: true },
                  { label: "New wojak", value: CTO_CONTRACT, mono: true },
                  {
                    label: "OG Uniswap Pool",
                    value: `${OG_UNISWAP_POOL.slice(0, 6)}...${OG_UNISWAP_POOL.slice(-4)} (created April 17, 2023)`,
                    mono: false,
                  },
                  { label: "OG Website", value: SITE_NAME, mono: false },
                  {
                    label: "OG X/Twitter",
                    value: "@WojakToken",
                    href: TWITTER_URL,
                    mono: false,
                  },
                  { label: "CTO Website", value: "wojakcto.com", mono: false },
                  {
                    label: "CTO X/Twitter",
                    value: "@wojakcto",
                    href: CTO_TWITTER_URL,
                    mono: false,
                  },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-400 whitespace-nowrap">
                      {row.label}
                    </td>
                    <td className="py-3 text-sm text-gray-200">
                      {row.href ? (
                        <a
                          href={row.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-wojak-green hover:underline"
                        >
                          {row.value}
                        </a>
                      ) : (
                        <span className={row.mono ? "font-mono text-xs sm:text-sm break-all" : ""}>
                          {row.value}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {/* 12. DYOR Footer */}
      <div className="text-center py-6">
        <p className="text-gray-400 font-medium">
          DYOR. Verify everything on-chain.{" "}
          <span className="text-white">The blockchain doesn&apos;t lie.</span>
        </p>
      </div>
    </div>
  );
}
