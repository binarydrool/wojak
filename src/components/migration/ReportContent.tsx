import ComparisonTable from "./ComparisonTable";
import {
  OG_WOJAK_CONTRACT,
  CTO_CONTRACT,
  OG_UNISWAP_POOL,
  APPROVAL_CHECKER_URL,
  TWITTER_URL,
  CTO_TWITTER_URL,
  SITE_NAME,
  TELEGRAM_COMMUNITY_URL,
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
            { id: "what-is-happening", label: "What Happened" },
            { id: "comparison", label: "The Two Contracts \u2014 Side by Side" },
            { id: "red-flags", label: "Contract Design Concerns (0x8D)" },
            { id: "migration-mechanics", label: "The Swap Was Not Fair" },
            { id: "platform-attacks", label: "What They Did to the OG Token" },
            { id: "numbers", label: "The Numbers Don\u2019t Add Up" },
            { id: "og-strengths", label: "The OG Contract Is Flawless" },
            { id: "bigger-picture", label: "The Bigger Picture" },
            { id: "what-to-do", label: "What You Should Do" },
            { id: "contracts", label: "Contract Addresses & Links" },
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
            <h2 className="text-lg font-bold text-yellow-400 mb-3">TL;DR</h2>
            <p className="text-gray-200 font-medium leading-relaxed">
              A small group organized privately and, without the wider community&apos;s voice, moved forward with
              a migration from the original WOJAK contract (0x50) to a new token (0x8D) they control.
              We&apos;re talking about a community of over 19,000 holders who never got a say.
            </p>
            <p className="text-gray-200 font-medium leading-relaxed mt-3">
              The swap was NOT 1-to-1. Migrators lose{" "}
              <span className="text-red-400 font-bold">83.75% of their supply percentage</span>.
              If you held 1% of the original token, you do NOT get 1% of the new one &mdash; you&apos;d get
              roughly 0.1625%. Supply was inflated from 69.42B to 420.69T &mdash;{" "}
              a <span className="text-red-400 font-bold">6,000%+ dilution</span>.
            </p>
            <p className="text-gray-200 font-medium leading-relaxed mt-3">
              The new contract (0x8D) was deployed with blacklist, setRule, and trading control functions that were
              active before ownership was renounced &mdash; any settings or blacklisted wallets from that period
              are permanently locked in. The OG contract (0x50) is a clean ERC-20 that never had ANY admin
              functions. No blacklist. No trading controls. Nothing. $1M+ liquidity locked for 74+ years.
            </p>
            <p className="text-gray-200 font-medium leading-relaxed mt-3">
              If you held on a centralized exchange, you had zero say &mdash; the swap happened without your
              permission. 14,000+ holders have not migrated. This story is far from over.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 3. What Happened */}
      <SectionCard id="what-is-happening">
        <SectionHeading>What Happened</SectionHeading>
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>
            Someone from within the original community reached out to a builder group &mdash; or vice versa &mdash;
            about creating an entirely new WOJAK project under the same ticker but with a different contract
            address. These new builders, from what we understand, weren&apos;t original holders &mdash; but
            they&apos;ve been involved with other token launches.
          </p>
          <p>
            They organized privately and, without the wider community&apos;s voice, moved forward with a migration
            from the original 0x50 contract to their new 0x8D contract. This migration had a limited time window
            for on-chain holders &mdash; and was{" "}
            <span className="text-red-400 font-semibold">fully automated on centralized exchanges</span>.
          </p>
          <p>
            If you held tokens on a centralized exchange,{" "}
            <span className="text-white font-semibold">you had zero say</span>. The swap happened without your
            permission. If you were an OG on-chain holder who was skeptical, you probably felt the pressure of the
            deadline they set. Many OG holders were against this for a lot of reasons.
          </p>
        </div>
      </SectionCard>

      {/* 4. Side-by-Side Comparison Table */}
      <SectionCard id="comparison">
        <SectionHeading>The Two Contracts &mdash; Side by Side</SectionHeading>
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
                frozen &mdash; there is no way to remove them.
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
                &mdash; they cannot be removed even with ownership renounced.
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
            start &mdash; not made trustless after the fact.
          </p>
        </div>
      </SectionCard>

      {/* 6. The Swap Was Not Fair */}
      <SectionCard id="migration-mechanics">
        <SectionHeading>The Swap Was Not Fair</SectionHeading>
        <div className="space-y-4 text-gray-300 leading-relaxed mb-6">
          <p>
            Not only was this never agreed upon by the wider community &mdash; the new token&apos;s supply was
            inflated by over <span className="text-red-400 font-semibold">6,000%</span>. The original supply was
            69.42 billion. The new one? 420.69 trillion.
          </p>
          <p>
            The swap was NOT 1-to-1. Their offer was 1 old WOJAK for 958 new WOJAK &mdash; when a fair swap based
            on supply ratio should have been closer to{" "}
            <span className="text-white font-semibold">1 for 6,000</span>.
          </p>
          <p>
            If you held 1% of the original token, you do NOT get 1% of the new one. You&apos;d get roughly{" "}
            <span className="text-red-400 font-semibold">0.1625%</span> of the new supply.
          </p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-4 space-y-4">
          <p className="text-2xl sm:text-3xl font-bold text-red-400 text-center">
            83.75% reduction.
          </p>
          <p className="text-gray-300 text-center">
            You heard that right. <span className="text-red-400 font-bold">83.75%</span>.
            The swap rate led many OG holders to stand firm and stay in the original.
          </p>
        </div>
        <div className="mt-4 space-y-3">
          <p className="text-gray-300 leading-relaxed">
            Every migration is a sell order on the OG token. This is likely why OG market cap dropped from ~$29M
            to ~$2M. Whoever controls the new token&apos;s LP catches the buy pressure.
          </p>
          <p className="text-gray-300 leading-relaxed">
            If you held on a centralized exchange, the swap was{" "}
            <span className="text-red-400 font-semibold">fully automated</span> &mdash; you had zero say. It
            happened without your permission. MEXC and BitMart announced contract swaps, calling the OG
            &ldquo;former.&rdquo;
          </p>
        </div>
      </SectionCard>

      {/* 7. What They Did to the OG Token */}
      <SectionCard id="platform-attacks">
        <SectionHeading>What They Did to the OG Token</SectionHeading>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
          They didn&apos;t just launch a new token &mdash; they actively worked to bury the original.
        </p>
        <ul className="space-y-3">
          {[
            {
              platform: "Centralized Exchanges",
              detail: "Took over the ticker on MEXC and BitMart, effectively making OG WOJAK untradeable on those platforms. CEX holders were auto-swapped without consent.",
            },
            {
              platform: "DEX Screener",
              detail: "Listed warning banners stating the old token is dead.",
            },
            {
              platform: "Uniswap",
              detail: "Added malicious token warnings on the decentralized exchange to scare people away from trading OG.",
            },
            {
              platform: "Etherscan",
              detail: "Got OG WOJAK removed from wallet view. Submitted CTO update request, got OG logo/branding changed or removed.",
            },
            {
              platform: "CoinMarketCap",
              detail: "Listed the new 0x8D contract under the WOJAK name with their branding.",
            },
            {
              platform: "X/Twitter",
              detail: "migrate.wojakcto.com was flagged by Twitter safety as \"potentially spammy or unsafe.\"",
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
              OG has <span className="text-wojak-green font-semibold">$1M+ locked liquidity</span> for over 74
              years &mdash; locked until 2100.
            </>,
            <>
              OG has <span className="text-wojak-green font-semibold">100K+ transactions</span>. Battle-tested for 2+
              years.
            </>,
            <>
              Supply ballooned from 69.42B to 420.69T &mdash;{" "}
              <span className="text-red-400 font-semibold">6,000%+ dilution</span>.
            </>,
            <>
              1:958 swap ratio offered when fair ratio should have been ~1:6,000 &mdash;{" "}
              <span className="text-red-400 font-semibold">83.75% loss</span> for migrators.
            </>,
            <>
              CEX holders were auto-swapped{" "}
              <span className="text-red-400 font-semibold">without consent</span>.
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

      {/* 9. The OG Contract Is Flawless */}
      <SectionCard id="og-strengths" className="border-green-500/20">
        <SectionHeading>The OG Contract Is Flawless</SectionHeading>
        <p className="text-gray-300 leading-relaxed mb-4">
          Here&apos;s the reality. The original WOJAK token and its contract are flawless. One million dollars of
          locked liquidity for over 74 years. Contract renounced. No admin keys. No blacklist. Nothing.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Clean from Day One", icon: "shield" },
            { label: "Zero taxes", icon: "zap" },
            { label: "19,000+ holders", icon: "users" },
            { label: "$1M+ liquidity", icon: "dollar" },
            { label: "Clean ERC-20 code", icon: "code" },
            { label: "100K+ transactions", icon: "activity" },
            { label: "@Wojakcto on X", icon: "twitter" },
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
        <p className="text-gray-300 leading-relaxed">
          It may be a little harder to get your hands on OG WOJAK now, but you can easily copy and paste the
          contract address into Uniswap. Disregard banners claiming the OG is dead. It&apos;s not.
        </p>
      </SectionCard>

      {/* 10. The Bigger Picture */}
      <SectionCard id="bigger-picture">
        <SectionHeading>The Bigger Picture</SectionHeading>
        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>
            This isn&apos;t just about WOJAK. This is about a small group making decisions for thousands of
            people and walking away with the better end of the deal while the wider community absorbed the loss.
            That goes against everything crypto stands for.
          </p>
          <p className="text-white font-medium">
            One small group. One closed-door decision. Thousands of holders who never got a say.
          </p>
          <p>
            The community wasn&apos;t brought together &mdash; it was used as leverage.
          </p>
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg px-4 py-3 mt-2">
            <p className="text-gray-300 leading-relaxed">
              People have been coming into the{" "}
              <a href={TELEGRAM_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="text-wojak-green hover:underline">
                Telegram chat
              </a>{" "}
              explaining how they got burned holding on a centralized exchange, sold the new token for ETH, moved
              it off the exchange, and bought back the OG. If that&apos;s not a lesson in{" "}
              <span className="text-wojak-green font-semibold">&ldquo;not your keys, not your crypto&rdquo;</span>{" "}
              &mdash; we don&apos;t know what is.
            </p>
          </div>
          <p>
            The migration window has closed &mdash; but this story is far from over. There are probably thousands
            of holders who still have no idea what&apos;s going on. New people are coming into the chat every day
            asking questions. This isn&apos;t finished.
          </p>
        </div>
      </SectionCard>

      {/* 11. What You Should Do */}
      <SectionCard id="what-to-do" className="border-yellow-500/20">
        <SectionHeading>What You Should Do</SectionHeading>
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
                Copy and paste the contract address into Uniswap to trade OG WOJAK directly
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
                Spread this information to the community &mdash; thousands of holders still don&apos;t know what happened
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 12. Contract Addresses & Links Reference Table */}
      <SectionCard id="contracts">
        <SectionHeading>Contract Addresses &amp; Links</SectionHeading>
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
                    label: "wojakcto.com",
                    value: "wojakcto.com",
                    href: "https://wojakcto.com",
                    mono: false,
                  },
                  {
                    label: "wojakstats.xyz",
                    value: "wojakstats.xyz",
                    href: "https://wojakstats.xyz",
                    mono: false,
                  },
                  {
                    label: "wojakdao.xyz",
                    value: "wojakdao.xyz",
                    href: "https://wojakdao.xyz",
                    mono: false,
                  },
                  {
                    label: "OG X/Twitter",
                    value: "@Wojakcto",
                    href: TWITTER_URL,
                    mono: false,
                  },
                  {
                    label: "Telegram",
                    value: "OG WOJAK Community",
                    href: TELEGRAM_COMMUNITY_URL,
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

      {/* 13. DYOR Footer */}
      <div className="text-center py-6">
        <p className="text-gray-400 font-medium">
          DYOR. Verify everything on-chain.{" "}
          <span className="text-white">The blockchain doesn&apos;t lie.</span>
        </p>
      </div>
    </div>
  );
}
