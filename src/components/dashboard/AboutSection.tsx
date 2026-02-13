"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TELEGRAM_COMMUNITY_URL, X_URL, ETHERSCAN_TOKEN_URL } from "@/lib/constants";

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

function EtherscanIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 123 123" fill="currentColor" className={className}>
      <path d="M25.79 58.4149c0-1.36.458-2.67 1.519-3.638.53-.48 1.1-.858 1.73-1.116.628-.258 1.3-.389 1.98-.386l8.59.028c1.37 0 2.683.544 3.652 1.513.968.968 1.512 2.282 1.512 3.651v32.48c.967-.287 2.209-.593 3.568-.913.944-.222 1.785-.756 2.387-1.516.603-.76.93-1.701.93-2.671V45.541c0-1.37.544-2.683 1.512-3.652.969-.968 2.282-1.512 3.652-1.513h8.607c1.37 0 2.683.544 3.652 1.513.968.968 1.512 2.282 1.512 3.652v37.393s2.155-.872 4.254-1.758c.78-.33 1.445-.882 1.913-1.587.469-.706.718-1.533.719-2.38V32.631c0-1.37.544-2.683 1.512-3.651.968-.969 2.282-1.513 3.651-1.513h8.607c1.37 0 2.683.544 3.652 1.513.968.968 1.512 2.281 1.512 3.651v36.709c7.462-5.408 15.024-11.912 21.025-19.733.871-1.135 1.447-2.468 1.677-3.88.23-1.412.107-2.859-.358-4.212-2.778-7.992-7.193-15.317-12.964-21.504-5.771-6.188-12.77-11.103-20.55-14.43C77.416 2.253 69.028.586 60.567.686c-8.46.1-16.807 1.966-24.505 5.478-7.698 3.511-14.579 8.591-20.201 14.914-5.622 6.323-9.863 13.75-12.45 21.806C.824 50.94-.053 59.447.837 67.862c.89 8.414 3.526 16.55 7.74 23.887.734 1.265 1.814 2.295 3.113 2.969 1.3.673 2.764.961 4.221.831 1.628-.143 3.655-.346 6.065-.629 1.05-.12 2.018-.62 2.722-1.407.703-.788 1.093-1.806 1.093-2.862V58.415z" />
      <path d="M25.602 110.51c9.072 6.6 19.794 10.562 30.978 11.447 11.185.884 22.396-1.342 32.393-6.434 9.998-5.092 18.391-12.85 24.253-22.416 5.861-9.567 8.962-20.568 8.959-32.787 0-1.4-.065-2.785-.158-4.162C99.808 90.296 58.783 105.788 25.604 110.505" />
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
                <a
                  href={ETHERSCAN_TOKEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#00ff41] transition-colors duration-200"
                  aria-label="Etherscan"
                >
                  <EtherscanIcon className="w-5 h-5 sm:w-6 sm:h-6" />
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
