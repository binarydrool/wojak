import ImageReel from "@/components/dashboard/ImageReel";
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

      {/* Section 2: Stats Row */}
      <HeroStats />

      {/* Section 3: Two-Column Layout — Chart + Right Sidebar */}
      <section className="w-full max-w-5xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: Chart with DEXscore integrated as footer */}
          <div>
            <ChartSection />
          </div>

          {/* Right: Swap Card + Price Stats */}
          <div className="flex flex-col gap-3 lg:gap-2 lg:justify-between">
            <SwapCard />
            <PriceStatsCard />
          </div>
        </div>
      </section>

      {/* Section 4: Contract Info */}
      <ContractInfo />
    </main>
  );
}
