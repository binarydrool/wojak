"use client";

import { useEffect, useState, useRef } from "react";
import WhatIsAWallet from "@/components/crypto101/sections/WhatIsAWallet";
import PrivateKeys from "@/components/crypto101/sections/PrivateKeys";
import HowToBuyETH from "@/components/crypto101/sections/HowToBuyETH";
import HowToSwap from "@/components/crypto101/sections/HowToSwap";
import ReadingEtherscan from "@/components/crypto101/sections/ReadingEtherscan";
import WhatIsLiquidity from "@/components/crypto101/sections/WhatIsLiquidity";
import TokenSafety from "@/components/crypto101/sections/TokenSafety";
import RevokingApprovals from "@/components/crypto101/sections/RevokingApprovals";

const NAV_ITEMS = [
  { label: "Wallets", id: "wallets" },
  { label: "Private Keys", id: "private-keys" },
  { label: "Buy ETH", id: "buy-eth" },
  { label: "Swap Tokens", id: "swap-tokens" },
  { label: "Etherscan", id: "etherscan" },
  { label: "Liquidity", id: "liquidity" },
  { label: "Token Safety", id: "token-safety" },
  { label: "Revoke Approvals", id: "revoke-approvals" },
];

export default function Crypto101Page() {
  const [activeSection, setActiveSection] = useState("wallets");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionEls = NAV_ITEMS.map((item) =>
      document.getElementById(item.id)
    ).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-scroll nav to keep active item visible
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector(`[data-section="${activeSection}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeSection]);

  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen">
      {/* Page title */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Crypto 101
          </h1>
          <p className="text-gray-400 text-lg">
            Everything you need to know to navigate crypto safely.
          </p>
        </div>
      </div>

      {/* Sticky section nav */}
      <div className="sticky top-16 z-40 bg-wojak-dark/95 backdrop-blur-sm border-b border-wojak-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            ref={navRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide py-3"
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                data-section={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  activeSection === item.id
                    ? "bg-wojak-green/15 text-wojak-green"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <WhatIsAWallet />
        <PrivateKeys />
        <HowToBuyETH />
        <HowToSwap />
        <ReadingEtherscan />
        <WhatIsLiquidity />
        <TokenSafety />
        <RevokingApprovals />
      </div>
    </main>
  );
}
