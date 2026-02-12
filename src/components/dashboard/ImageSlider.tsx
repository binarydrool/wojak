"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const SLIDE_COUNT = 10;
const INTERVAL_MS = 5000;

const images = Array.from({ length: SLIDE_COUNT }, (_, i) => `/images/${i + 1}.jpg`);

export default function ImageSlider() {
  const [current, setCurrent] = useState(0);

  const advance = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDE_COUNT);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <section className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] overflow-hidden bg-wojak-dark">
      {/* Slides */}
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt={`WOJAK community image ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

      {/* Overlay text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white text-center drop-shadow-lg">
          The OG WOJAK
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-200 mt-2 drop-shadow-md">
          Since April 2023
        </p>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === current
                ? "bg-wojak-green scale-110"
                : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
