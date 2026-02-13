import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import GameModal from "@/components/games/GameModal";
import { GameProvider } from "@/components/games/GameContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wojakstats.xyz"),
  title: "WOJAK Stats",
  description:
    "Live WOJAK token stats — price, market cap, TVL, volume, holders, and charts.",
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
  alternates: {
    canonical: "https://www.wojakstats.xyz",
  },
  openGraph: {
    title: "WOJAK Stats",
    description:
      "Live WOJAK token stats — price, market cap, TVL, volume, holders, and charts.",
    type: "website",
    url: "https://www.wojakstats.xyz",
    siteName: "WOJAK Stats",
    images: [{ url: "https://www.wojakstats.xyz/images/Wojak_black.png", width: 1200, height: 630, alt: "WOJAK Stats" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "WOJAK Stats",
    title: "WOJAK Stats",
    description:
      "Live WOJAK token stats — price, market cap, TVL, volume, holders, and charts.",
    images: ["https://www.wojakstats.xyz/images/Wojak_black.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-wojak-dark text-white`}>
        <GameProvider>
          <Navbar />
          <div className="pt-16 min-h-screen">{children}</div>
          <Footer />
          <GameModal />
        </GameProvider>
      </body>
    </html>
  );
}
