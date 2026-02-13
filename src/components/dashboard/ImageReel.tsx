"use client";

import { useRef, useEffect, useState } from "react";

const IMAGES = Array.from({ length: 10 }, (_, i) => `/images/${i + 1}.jpg`);
const SCROLL_SPEED = 25; // pixels per second — very gentle drift

export default function ImageReel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [imageCount, setImageCount] = useState(30); // start generous, recalculate after load

  // Build image array — repeat IMAGES enough times to fill viewport + buffers
  const allImages = Array.from({ length: imageCount }, (_, i) => IMAGES[i % IMAGES.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let running = true;
    let animFrame = 0;
    let lastTime = 0;
    let positions: number[] = [];
    let widths: number[] = [];
    let initialized = false;

    const initialize = () => {
      const imgs = imgRefs.current.filter(Boolean) as HTMLImageElement[];
      if (imgs.length === 0) return;

      const containerWidth = container.offsetWidth;

      // Measure all image widths
      widths = imgs.map((img) => img.offsetWidth);

      // Calculate how many images needed: fill viewport + 2 full images as buffer each side
      const avgWidth = widths.reduce((s, w) => s + w, 0) / widths.length;
      const neededCount = Math.ceil(containerWidth / avgWidth) + 4; // +4 for buffers

      if (imgs.length < neededCount) {
        // Need more images — update state to re-render with more
        setImageCount(neededCount + 4);
        return;
      }

      // Tile images from off-screen left to beyond the right edge
      // Start far enough left that the leftmost image is fully off-screen
      let x = -(avgWidth * 2); // start 2 images off-screen left
      positions = [];
      for (let i = 0; i < imgs.length; i++) {
        positions[i] = x;
        x += widths[i];
      }

      // Apply initial positions
      for (let i = 0; i < imgs.length; i++) {
        imgs[i].style.transform = `translateX(${positions[i]}px)`;
      }

      initialized = true;
    };

    const animate = (time: number) => {
      if (!running) return;

      if (lastTime === 0) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const cappedDt = Math.min(dt, 0.1);
      const dx = SCROLL_SPEED * cappedDt;
      const containerWidth = container.offsetWidth;
      const imgs = imgRefs.current.filter(Boolean) as HTMLImageElement[];

      // Move all images to the right
      for (let i = 0; i < positions.length; i++) {
        positions[i] += dx;
      }

      // Recycle any image whose LEFT edge has passed the container's right edge
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] >= containerWidth) {
          // Find the leftmost image position
          let leftmost = Infinity;
          let leftIdx = 0;
          for (let j = 0; j < positions.length; j++) {
            if (j !== i && positions[j] < leftmost) {
              leftmost = positions[j];
              leftIdx = j;
            }
          }
          // Place this image immediately to the left of the leftmost image — zero gap
          positions[i] = leftmost - widths[i];
        }
      }

      // Apply transforms
      for (let i = 0; i < imgs.length && i < positions.length; i++) {
        imgs[i].style.transform = `translateX(${positions[i]}px)`;
      }

      animFrame = requestAnimationFrame(animate);
    };

    // Wait for all images to load before measuring
    const checkLoaded = () => {
      if (!running) return;
      const imgs = imgRefs.current.filter(Boolean) as HTMLImageElement[];
      const allLoaded = imgs.length > 0 && imgs.every(
        (img) => img.complete && img.naturalWidth > 0
      );
      if (allLoaded) {
        initialize();
        if (initialized) {
          animFrame = requestAnimationFrame(animate);
        }
      } else {
        requestAnimationFrame(checkLoaded);
      }
    };

    checkLoaded();

    // Handle resize — reinitialize positions
    const handleResize = () => {
      if (!running) return;
      const imgs = imgRefs.current.filter(Boolean) as HTMLImageElement[];
      if (imgs.length === 0) return;
      initialized = false;
      lastTime = 0;
      cancelAnimationFrame(animFrame);
      initialize();
      if (initialized) {
        animFrame = requestAnimationFrame(animate);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      running = false;
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, [imageCount]);

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
        <div className="relative mt-2">
          {/* Invisible spacer — sized to the longer phrase to prevent layout shift */}
          <p className="text-lg sm:text-xl md:text-2xl font-semibold invisible" aria-hidden="true">
            The most recognized face on the internet.
          </p>
          <p
            className="absolute top-0 left-0 right-0 text-lg sm:text-xl md:text-2xl font-semibold text-gray-200 text-center animate-subtitle-fade-1"
            style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}
          >
            I know that feel, bro.
          </p>
          <p
            className="absolute top-0 left-0 right-0 text-lg sm:text-xl md:text-2xl font-semibold text-gray-200 text-center animate-subtitle-fade-2"
            style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}
          >
            The most recognized face on the internet.
          </p>
        </div>
      </div>

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-t from-black/70 via-black/30 to-black/40 pointer-events-none" />

      {/* Image conveyor belt — each image positioned individually */}
      <div
        ref={containerRef}
        className="relative h-[150px] sm:h-[175px] md:h-[200px] w-full"
      >
        {allImages.map((src, i) => (
          <img
            key={`reel-${i}`}
            ref={(el) => {
              imgRefs.current[i] = el;
            }}
            src={src}
            alt={i < IMAGES.length ? `WOJAK community ${i + 1}` : ""}
            aria-hidden={i >= IMAGES.length ? true : undefined}
            className="absolute top-0 left-0 h-full w-auto object-cover"
          />
        ))}
      </div>
    </section>
  );
}
