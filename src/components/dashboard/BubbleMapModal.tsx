"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ETHERSCAN_BASE_URL } from "@/lib/constants";

/* ── Types ── */

interface HolderEntry {
  address: string;
  balance: number;
  share: number;
}

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  address: string;
  balance: number;
  share: number;
  color: string;
  glowColor: string;
  targetX: number;
  targetY: number;
  opacity: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

/* ── Constants ── */

const GREEN_PALETTE = [
  "#00ff41",
  "#33ff66",
  "#00cc33",
  "#00e639",
  "#4dff7a",
  "#009926",
  "#006619",
];

const MIN_RADIUS = 8;
const MAX_RADIUS = 80;
const DAMPING = 0.92;
const ATTRACTION = 0.005;
const REPULSION = 1.2;
const SIM_STEPS = 200;

/* ── Helpers ── */

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatBalance(bal: number): string {
  if (bal >= 1e12) return `${(bal / 1e12).toFixed(2)}T`;
  if (bal >= 1e9) return `${(bal / 1e9).toFixed(2)}B`;
  if (bal >= 1e6) return `${(bal / 1e6).toFixed(2)}M`;
  if (bal >= 1e3) return `${(bal / 1e3).toFixed(1)}K`;
  return bal.toFixed(0);
}

function getBubbleColor(rank: number, total: number): { fill: string; glow: string } {
  // Brighter green for higher rank (larger holders)
  const t = total > 1 ? rank / (total - 1) : 0;
  if (t < 0.05) return { fill: "#00ff41", glow: "rgba(0,255,65,0.6)" };
  if (t < 0.15) return { fill: "#33ff66", glow: "rgba(51,255,102,0.5)" };
  if (t < 0.3) return { fill: "#00e639", glow: "rgba(0,230,57,0.4)" };
  if (t < 0.5) return { fill: "#00cc33", glow: "rgba(0,204,51,0.35)" };
  if (t < 0.7) return { fill: "#4dff7a", glow: "rgba(77,255,122,0.3)" };
  if (t < 0.85) return { fill: "#009926", glow: "rgba(0,153,38,0.25)" };
  return { fill: "#006619", glow: "rgba(0,102,25,0.2)" };
}

function scaleRadius(share: number, maxShare: number): number {
  if (maxShare <= 0) return MIN_RADIUS;
  const t = Math.sqrt(share / maxShare);
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
}

/* ── Force simulation ── */

function createBubbles(
  holders: HolderEntry[],
  cx: number,
  cy: number
): Bubble[] {
  const maxShare = Math.max(...holders.map((h) => h.share), 0.001);

  return holders.map((h, i) => {
    const r = scaleRadius(h.share, maxShare);
    const { fill, glow } = getBubbleColor(i, holders.length);
    // Start in a large ring around center
    const angle = (i / holders.length) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 150 + Math.random() * 250;

    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      r,
      address: h.address,
      balance: h.balance,
      share: h.share,
      color: fill,
      glowColor: glow,
      targetX: cx,
      targetY: cy,
      opacity: 0,
    };
  });
}

function runSimulation(bubbles: Bubble[], steps: number): void {
  for (let step = 0; step < steps; step++) {
    // Fade in during first half of simulation
    const fadeT = Math.min(1, (step / steps) * 3);

    for (let i = 0; i < bubbles.length; i++) {
      const a = bubbles[i];
      a.opacity = Math.min(1, fadeT);

      // Attract to center
      const dx = a.targetX - a.x;
      const dy = a.targetY - a.y;
      a.vx += dx * ATTRACTION;
      a.vy += dy * ATTRACTION;

      // Repel from other bubbles
      for (let j = i + 1; j < bubbles.length; j++) {
        const b = bubbles[j];
        const ddx = a.x - b.x;
        const ddy = a.y - b.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        const minDist = a.r + b.r + 3;

        if (dist < minDist) {
          const force = ((minDist - dist) / dist) * REPULSION;
          const fx = ddx * force;
          const fy = ddy * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // Apply velocity with damping
      a.vx *= DAMPING;
      a.vy *= DAMPING;
      a.x += a.vx;
      a.y += a.vy;
    }
  }

  // Ensure all fully visible after simulation
  for (const b of bubbles) b.opacity = 1;
}

/* ── Canvas rendering ── */

function drawBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  transform: Transform,
  hoveredIdx: number | null,
  highlightIdx: number | null,
  dpr: number
) {
  const { x: tx, y: ty, scale } = transform;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);

  ctx.save();
  ctx.translate(tx, ty);
  ctx.scale(scale, scale);

  // Draw bubbles back-to-front (smallest last = on top)
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    if (b.opacity <= 0) continue;

    const isHovered = i === hoveredIdx;
    const isHighlighted = i === highlightIdx;
    const r = isHovered ? b.r * 1.08 : b.r;

    // Glow
    ctx.save();
    ctx.globalAlpha = b.opacity * (isHovered ? 0.8 : isHighlighted ? 0.9 : 0.4);
    ctx.shadowColor = isHighlighted ? "#ffffff" : b.glowColor;
    ctx.shadowBlur = isHovered ? 25 : isHighlighted ? 30 : 15;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.restore();

    // Main fill
    ctx.save();
    ctx.globalAlpha = b.opacity * (isHovered ? 1 : 0.85);
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);

    // Gradient fill
    const grad = ctx.createRadialGradient(
      b.x - r * 0.3,
      b.y - r * 0.3,
      r * 0.1,
      b.x,
      b.y,
      r
    );
    grad.addColorStop(0, isHighlighted ? "#ffffff" : lightenColor(b.color, 40));
    grad.addColorStop(0.7, b.color);
    grad.addColorStop(1, darkenColor(b.color, 30));
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    if (isHovered || isHighlighted) {
      ctx.strokeStyle = isHighlighted ? "#ffffff" : "#00ff41";
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    }
    ctx.restore();

    // Label for larger bubbles
    if (r * scale > 22) {
      ctx.save();
      ctx.globalAlpha = b.opacity * 0.9;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fontSize = Math.max(8, Math.min(14, r * 0.35));
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillText(truncateAddress(b.address), b.x, b.y - fontSize * 0.4);
      ctx.font = `${fontSize * 0.85}px monospace`;
      ctx.fillText(`${b.share.toFixed(2)}%`, b.x, b.y + fontSize * 0.6);
      ctx.restore();
    }
  }

  ctx.restore();
  ctx.restore();
}

function lightenColor(hex: string, amt: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amt: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return `rgb(${r},${g},${b})`;
}

/* ── Hit detection ── */

function findBubbleAt(
  bubbles: Bubble[],
  canvasX: number,
  canvasY: number,
  transform: Transform
): number | null {
  // Convert canvas coords to world coords
  const wx = (canvasX - transform.x) / transform.scale;
  const wy = (canvasY - transform.y) / transform.scale;

  // Check front-to-back (smallest bubbles are on top visually)
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    const dx = wx - b.x;
    const dy = wy - b.y;
    if (dx * dx + dy * dy <= b.r * b.r) return i;
  }
  return null;
}

/* ── Main Component ── */

export default function BubbleMapModal({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 });
  const animFrameRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistRef = useRef(0);
  const hoveredRef = useRef<number | null>(null);
  const highlightRef = useRef<number | null>(null);

  const [holders, setHolders] = useState<HolderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [holderCount, setHolderCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    bubble: Bubble;
  } | null>(null);
  const [animStep, setAnimStep] = useState(0);

  // Fetch holder data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [listRes, countRes] = await Promise.all([
          fetch("/api/holders/list"),
          fetch("/api/holders"),
        ]);

        if (!cancelled && listRes.ok) {
          const data = await listRes.json();
          setHolders(data.holders || []);
        }

        if (!cancelled && countRes.ok) {
          const cData = await countRes.json();
          if (cData.holders) setHolderCount(cData.holders);
        }
      } catch {
        // Silent fail — will show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize simulation when holders arrive
  useEffect(() => {
    if (holders.length === 0 || !canvasRef.current || !containerRef.current)
      return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const cx = w / 2;
    const cy = h / 2;

    const bubbles = createBubbles(holders, cx, cy);
    bubblesRef.current = bubbles;
    transformRef.current = { x: 0, y: 0, scale: 1 };

    // Animate the simulation progressively
    let step = 0;
    const stepsPerFrame = 5;
    const totalSteps = SIM_STEPS;

    function animate() {
      if (step < totalSteps) {
        // Run a few simulation steps
        const end = Math.min(step + stepsPerFrame, totalSteps);
        for (let s = step; s < end; s++) {
          const fadeT = Math.min(1, (s / totalSteps) * 3);
          for (let i = 0; i < bubbles.length; i++) {
            const a = bubbles[i];
            a.opacity = Math.min(1, fadeT);
            const dx = a.targetX - a.x;
            const dy = a.targetY - a.y;
            a.vx += dx * ATTRACTION;
            a.vy += dy * ATTRACTION;
            for (let j = i + 1; j < bubbles.length; j++) {
              const b = bubbles[j];
              const ddx = a.x - b.x;
              const ddy = a.y - b.y;
              const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
              const minDist = a.r + b.r + 3;
              if (dist < minDist) {
                const force = ((minDist - dist) / dist) * REPULSION;
                const fx = ddx * force;
                const fy = ddy * force;
                a.vx += fx;
                a.vy += fy;
                b.vx -= fx;
                b.vy -= fy;
              }
            }
            a.vx *= DAMPING;
            a.vy *= DAMPING;
            a.x += a.vx;
            a.y += a.vy;
          }
        }
        step = end;
        setAnimStep(step);
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawBubbles(
          ctx,
          bubbles,
          transformRef.current,
          hoveredRef.current,
          highlightRef.current,
          dpr
        );
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [holders]);

  // Redraw on tooltip/highlight change
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    drawBubbles(
      ctx,
      bubblesRef.current,
      transformRef.current,
      hoveredRef.current,
      highlightRef.current,
      dpr
    );
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  /* ── Mouse/Touch Handlers ── */

  const getCanvasPos = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    []
  );

  // Mouse move — hover detection
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getCanvasPos(e.clientX, e.clientY);

      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        setTooltip(null);
        redraw();
        return;
      }

      const idx = findBubbleAt(
        bubblesRef.current,
        pos.x,
        pos.y,
        transformRef.current
      );
      hoveredRef.current = idx;

      if (idx !== null) {
        const b = bubblesRef.current[idx];
        setTooltip({ x: e.clientX, y: e.clientY, bubble: b });
      } else {
        setTooltip(null);
      }

      redraw();
    },
    [getCanvasPos, redraw]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const pos = getCanvasPos(e.clientX, e.clientY);
      const idx = findBubbleAt(
        bubblesRef.current,
        pos.x,
        pos.y,
        transformRef.current
      );

      if (idx !== null) {
        // Clicked on a bubble — open etherscan in new tab
        const b = bubblesRef.current[idx];
        window.open(
          `${ETHERSCAN_BASE_URL}/address/${b.address}`,
          "_blank",
          "noopener,noreferrer"
        );
        isDraggingRef.current = false;
      }
    },
    [getCanvasPos]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    hoveredRef.current = null;
    setTooltip(null);
    redraw();
  }, [redraw]);

  // Scroll to zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const pos = getCanvasPos(e.clientX, e.clientY);
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const t = transformRef.current;
      const newScale = Math.min(5, Math.max(0.2, t.scale * delta));

      // Zoom toward cursor
      const wx = (pos.x - t.x) / t.scale;
      const wy = (pos.y - t.y) / t.scale;
      t.scale = newScale;
      t.x = pos.x - wx * newScale;
      t.y = pos.y - wy * newScale;

      redraw();
    },
    [getCanvasPos, redraw]
  );

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy);
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDraggingRef.current) {
        const dx = e.touches[0].clientX - dragStartRef.current.x;
        const dy = e.touches[0].clientY - dragStartRef.current.y;
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        redraw();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistRef.current > 0) {
          const delta = dist / lastTouchDistRef.current;
          const t = transformRef.current;
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const cx = midX - rect.left;
            const cy = midY - rect.top;
            const newScale = Math.min(5, Math.max(0.2, t.scale * delta));
            const wx = (cx - t.x) / t.scale;
            const wy = (cy - t.y) / t.scale;
            t.scale = newScale;
            t.x = cx - wx * newScale;
            t.y = cy - wy * newScale;
          }
        }

        lastTouchDistRef.current = dist;
        redraw();
      }
    },
    [redraw]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 0) {
        // Check if it was a tap (not a drag)
        if (isDraggingRef.current && e.changedTouches.length === 1) {
          const touch = e.changedTouches[0];
          const pos = getCanvasPos(touch.clientX, touch.clientY);
          const idx = findBubbleAt(
            bubblesRef.current,
            pos.x,
            pos.y,
            transformRef.current
          );

          if (idx !== null) {
            const b = bubblesRef.current[idx];
            // Show tooltip on tap for mobile
            setTooltip({ x: touch.clientX, y: touch.clientY, bubble: b });
          } else {
            setTooltip(null);
          }
        }
        isDraggingRef.current = false;
        lastTouchDistRef.current = 0;
      }
    },
    [getCanvasPos]
  );

  // Search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const q = query.toLowerCase().trim();

      if (!q) {
        highlightRef.current = null;
        redraw();
        return;
      }

      const idx = bubblesRef.current.findIndex((b) =>
        b.address.toLowerCase().includes(q)
      );

      if (idx !== -1) {
        highlightRef.current = idx;
        const b = bubblesRef.current[idx];
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          // Center on the found bubble
          transformRef.current = {
            x: rect.width / 2 - b.x * 2,
            y: rect.height / 2 - b.y * 2,
            scale: 2,
          };
        }
      } else {
        highlightRef.current = null;
      }

      redraw();
    },
    [redraw]
  );

  // Reset zoom
  const resetZoom = useCallback(() => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
    highlightRef.current = null;
    setSearchQuery("");
    redraw();
  }, [redraw]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-[95vw] h-[90vh] max-w-[1400px] mx-4 bg-wojak-dark rounded-2xl border border-wojak-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-wojak-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Bubble Map</h2>
            {holderCount && (
              <span className="text-xs text-gray-400 bg-wojak-border px-2 py-0.5 rounded-full">
                {holderCount.toLocaleString()} holders
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close bubble map"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-wojak-border shrink-0 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[400px]">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search wallet address..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-wojak-border rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-wojak-green/50"
            />
          </div>

          {/* Reset zoom button */}
          <button
            onClick={resetZoom}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-wojak-border rounded-lg text-xs text-gray-400 hover:text-white hover:border-wojak-green/50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset View
          </button>

          {/* Zoom info */}
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            Scroll to zoom · Drag to pan
          </span>
        </div>

        {/* Canvas container */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-2 border-wojak-green border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading holder data...</p>
            </div>
          ) : holders.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-gray-400">
                Unable to load holder data
              </p>
              <p className="text-xs text-gray-500">
                Try refreshing the page
              </p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-[10000] pointer-events-none"
              style={{
                left: Math.min(tooltip.x + 12, window.innerWidth - 280),
                top: Math.max(tooltip.y - 10, 10),
              }}
            >
              <div className="bg-black/95 border border-wojak-green/40 rounded-lg p-3 shadow-lg shadow-black/50 max-w-[260px]">
                <p className="text-xs font-mono text-wojak-green mb-1.5 break-all">
                  {tooltip.bubble.address}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Balance:</span>
                    <span className="text-white font-medium">
                      {formatBalance(tooltip.bubble.balance)} WOJAK
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Supply:</span>
                    <span className="text-white font-medium">
                      {tooltip.bubble.share.toFixed(4)}%
                    </span>
                  </div>
                </div>
                <a
                  href={`${ETHERSCAN_BASE_URL}/address/${tooltip.bubble.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto inline-flex items-center gap-1 mt-2 text-[10px] text-wojak-green hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View on Etherscan
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer legend */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-wojak-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Size = Token Balance
            </span>
            <div className="flex items-center gap-1">
              {GREEN_PALETTE.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: c, opacity: 1 - i * 0.15 }}
                />
              ))}
              <span className="text-[10px] text-gray-500 ml-1">
                Larger → Smaller
              </span>
            </div>
          </div>
          <span className="text-[10px] text-gray-500">
            {holders.length} top holders shown
          </span>
        </div>
      </div>
    </div>
  );
}
