"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TELEGRAM_COMMUNITY_URL, X_URL } from "@/lib/constants";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="w-full max-w-5xl mx-auto px-4 pt-4">
      <div
        ref={sectionRef}
        className={`transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
          {/* Left: Wojak image */}
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px]">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: "0 0 30px rgba(0, 255, 65, 0.15), 0 0 60px rgba(0, 255, 65, 0.05)",
                }}
              />
              <Image
                src="/images/Wojak_black.png"
                alt="WOJAK"
                width={180}
                height={180}
                className="rounded-full border-2 border-[#00ff41]/30 relative z-10"
                priority
              />
            </div>
          </div>

          {/* Right: Text content */}
          <div className="flex-1 min-w-0">
            {/* Heading with social icons */}
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                WOJAK
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href={TELEGRAM_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#00ff41] transition-colors duration-200"
                  aria-label="Telegram"
                >
                  <TelegramIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
                <a
                  href={X_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#00ff41] transition-colors duration-200"
                  aria-label="X (Twitter)"
                >
                  <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-sm text-gray-400 mb-3">
              The original and very first Wojak memecoin. Since April 2023.
            </p>

            {/* Paragraph */}
            <p className="text-sm leading-relaxed text-gray-300">
              Wojak. Feels Guy. The most recognized face on the internet. Born from meme culture,
              brought on-chain as the first community-led memecoin on Ethereum for the Wojak meme.
              Contract renounced. LP locked until 2100. 0% tax. 100% feels. We are all Wojak.
            </p>

            {/* Tagline on its own line */}
            <p className="mt-2 text-sm italic text-[#00ff41]/80">
              &ldquo;I know that feel, bro.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
