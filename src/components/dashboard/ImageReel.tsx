"use client";

import { useState, useEffect } from "react";

const IMAGES = Array.from({ length: 10 }, (_, i) => `/images/${i + 1}.jpg`);

const SUBTITLES = ["Since April 2023", "If it ain't broke, don't fix it."];

export default function ImageReel() {
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setSubtitleIndex((prev) => (prev + 1) % 2);
        setVisible(true);
      }, 400);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-wojak-dark">
      {/* Overlay text — centered on top of the reel */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        {/* ETH Diamond Logo */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 256 417"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-2 sm:w-[45px] sm:h-[45px] md:w-[50px] md:h-[50px] drop-shadow-lg"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}
        >
          <polygon fill="white" points="127.9611 0 125.1661 9.5 125.1661 285.168 127.9611 287.958 255.9231 212.32" />
          <polygon fill="rgba(255,255,255,0.8)" points="127.962 0 0 212.32 127.962 287.959 127.962 154.158" />
          <polygon fill="white" points="127.9611 312.1866 126.3861 314.1066 126.3861 412.3056 127.9611 416.9066 255.9991 236.5866" />
          <polygon fill="rgba(255,255,255,0.8)" points="127.962 416.9052 127.962 312.1852 0 236.5852" />
          <polygon fill="rgba(255,255,255,0.6)" points="127.9611 287.9577 255.9211 212.3207 127.9611 154.1587" />
          <polygon fill="rgba(255,255,255,0.4)" points="0.0009 212.3207 127.9609 287.9577 127.9609 154.1587" />
        </svg>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-center animate-title-shine">
          The One True WOJAK
        </h1>
        <p
          className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-200 mt-2"
          style={{
            textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.4s ease-in-out",
          }}
        >
          {SUBTITLES[subtitleIndex]}
        </p>
      </div>

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-t from-black/70 via-black/30 to-black/40 pointer-events-none" />

      {/* Scrolling reel track — NO lazy loading so all images are ready for seamless loop */}
      <div className="flex animate-scroll-reel" style={{ willChange: "transform" }}>
        {/* First set */}
        {IMAGES.map((src, i) => (
          <img
            key={`a-${i}`}
            src={src}
            alt={`WOJAK community ${i + 1}`}
            className="h-[150px] sm:h-[175px] md:h-[200px] w-auto object-cover flex-shrink-0"
          />
        ))}
        {/* Duplicate set for seamless loop */}
        {IMAGES.map((src, i) => (
          <img
            key={`b-${i}`}
            src={src}
            alt=""
            aria-hidden="true"
            className="h-[150px] sm:h-[175px] md:h-[200px] w-auto object-cover flex-shrink-0"
          />
        ))}
      </div>
    </section>
  );
}
