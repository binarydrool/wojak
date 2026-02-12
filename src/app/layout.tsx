import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import GameModal from "@/components/games/GameModal";
import { GameProvider } from "@/components/games/GameContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WOJAK",
  description:
    "The official community website for the original WOJAK token on Ethereum. Dashboard, swap, education, and games for 19,000+ OG holders.",
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
  openGraph: {
    title: "WOJAK — The OG Since April 2023",
    description:
      "The official community website for the original WOJAK token on Ethereum. Dashboard, swap, education, and games for 19,000+ OG holders.",
    type: "website",
    url: "https://wojak.io",
    siteName: "wojak.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "WOJAK — The OG Since April 2023",
    description:
      "The official community website for the original WOJAK token on Ethereum. Dashboard, swap, education, and games for 19,000+ OG holders.",
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
