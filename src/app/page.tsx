import ImageReel from "@/components/dashboard/ImageReel";
import AboutSection from "@/components/dashboard/AboutSection";
import HeroStats from "@/components/dashboard/HeroStats";
import ChartSection from "@/components/dashboard/ChartSection";
import SwapCard from "@/components/dashboard/SwapCard";
import PriceStatsCard from "@/components/dashboard/PriceStatsCard";
import ContractInfo from "@/components/dashboard/ContractInfo";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Section 1: Image Reel Banner */}
      <ImageReel />

      {/* Section 2: About Strip */}
      <AboutSection />

      {/* Section 3: Stats Row */}
      <HeroStats />

      {/* Section 3: Two-Column Layout — Chart + Right Sidebar */}
      <section className="w-full max-w-5xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: Chart with DEXscore integrated as footer */}
          <div>
            <ChartSection />
          </div>

          {/* Right: Swap Card + Price Stats */}
          <div className="flex flex-col gap-3 lg:gap-2 lg:self-start">
            <SwapCard />
            <PriceStatsCard />
          </div>
        </div>
      </section>

      {/* Section 4: Contract Info */}
      <ContractInfo />

      {/* Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-8">
        <div className="border-t border-gray-800/60 pt-4">
          <p className="text-center text-[11px] leading-relaxed text-gray-600">
            WOJAK is a memecoin with no intrinsic value. No team. No roadmap. For entertainment only. DYOR — never invest more than you can afford to lose.{" "}
            <span className="italic text-[#00ff41]/70">We know that feel, bro.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
