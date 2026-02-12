"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Difficulty config ──

type Difficulty = "easy" | "medium" | "hard" | "expert";
type Equipment = "skis" | "snowboard";

interface DifficultyConfig {
  label: string;
  baseSpeed: number;
  maxSpeed: number;
  obstacleRate: number; // lower = more frequent
  obstacleGap: number; // minimum horizontal gap between obstacles
  bonusRate: number; // frames between bonus spawns
  pepeDistance: number; // meters before PEPE appears
  pepeSpeed: number; // PEPE chase speed multiplier
  pepeChaseDuration: number; // meters PEPE chases before giving up
  hasIcePatches: boolean;
  hasWindGusts: boolean;
  obstacleMovement: boolean; // obstacles shift slightly on expert
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    baseSpeed: 2.5,
    maxSpeed: 5,
    obstacleRate: 55,
    obstacleGap: 90,
    bonusRate: 240,
    pepeDistance: 3000,
    pepeSpeed: 0.6,
    pepeChaseDuration: 1500,
    hasIcePatches: false,
    hasWindGusts: false,
    obstacleMovement: false,
  },
  medium: {
    label: "Medium",
    baseSpeed: 3.5,
    maxSpeed: 6.5,
    obstacleRate: 40,
    obstacleGap: 70,
    bonusRate: 200,
    pepeDistance: 2000,
    pepeSpeed: 0.75,
    pepeChaseDuration: 1200,
    hasIcePatches: false,
    hasWindGusts: false,
    obstacleMovement: false,
  },
  hard: {
    label: "Hard",
    baseSpeed: 4.5,
    maxSpeed: 8,
    obstacleRate: 28,
    obstacleGap: 55,
    bonusRate: 180,
    pepeDistance: 1500,
    pepeSpeed: 0.88,
    pepeChaseDuration: 1000,
    hasIcePatches: true,
    hasWindGusts: false,
    obstacleMovement: false,
  },
  expert: {
    label: "Expert",
    baseSpeed: 5.5,
    maxSpeed: 9.5,
    obstacleRate: 20,
    obstacleGap: 45,
    bonusRate: 160,
    pepeDistance: 1000,
    pepeSpeed: 1.0,
    pepeChaseDuration: 800,
    hasIcePatches: true,
    hasWindGusts: true,
    obstacleMovement: true,
  },
};

// ── Canvas dimensions ──

const CANVAS_W = 480;
const CANVAS_H = 700;

// ── Player config ──

const HEAD_SIZE = 22;
const BODY_H = 20;
const PLAYER_TOTAL_H = HEAD_SIZE + BODY_H + 10; // head + body + equipment
const PLAYER_Y = 140;
const PLAYER_SPEED_SKIS = 4.5;
const PLAYER_SPEED_SNOWBOARD = 3.5;

// ── Images ──

const WOJAK_IMG = "/images/wojak.jpg";
const PEPE_IMG = "/images/pepe1.jpg";

// ── Colors ──

const GREEN = "#00ff41";
const BG_COLOR = "#0a0a0a";
const TREE_COLOR = "#005c1a";
const TREE_SNOW_COLOR = "#e8f0e8";
const ROCK_COLOR = "#2a2a2a";
const ICE_COLOR = "rgba(100, 180, 255, 0.25)";
const MOGUL_COLOR = "#1a1a1a";
const SNOW_DRIFT_COLOR = "#2a2a2a";
const RAMP_COLOR = "#00cc33";
const COIN_COLOR = "#ffd700";

// ── Types ──

type ObstacleType = "tree" | "rock" | "mogul" | "snowdrift" | "ice";
type BonusType = "speedboost" | "ramp" | "coin";

interface Obstacle {
  x: number;
  y: number;
  type: ObstacleType;
  width: number;
  height: number;
  wobbleOffset: number;
}

interface BonusItem {
  x: number;
  y: number;
  type: BonusType;
  width: number;
  height: number;
  collected: boolean;
}

interface SnowParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

interface CrashEffect {
  x: number;
  y: number;
  particles: { dx: number; dy: number; size: number; alpha: number }[];
  frame: number;
}

interface PepeState {
  active: boolean;
  y: number;
  x: number;
  chaseStartDistance: number;
  caught: boolean;
}

interface GameStateData {
  playerX: number;
  speed: number;
  distance: number;
  score: number;
  bestDistance: number;
  obstacles: Obstacle[];
  bonusItems: BonusItem[];
  snowParticles: SnowParticle[];
  trails: TrailPoint[];
  crashEffect: CrashEffect | null;
  pepe: PepeState;
  status: "idle" | "playing" | "crashed" | "gameover";
  frameCount: number;
  crashTimer: number;
  jumpTimer: number;
  jumpHeight: number;
  boostTimer: number;
  windGustX: number;
  windGustTimer: number;
  obstacleSpawnTimer: number;
  bonusSpawnTimer: number;
  slideTimer: number;
  slideDirection: number;
  pepeGlowPhase: number;
  lastPepeChaseEnd: number;
}

// ── Helpers ──

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createSnowParticles(count: number): SnowParticle[] {
  const particles: SnowParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: rand(1, 3),
      speed: rand(0.5, 2),
      opacity: rand(0.15, 0.5),
      drift: rand(-0.3, 0.3),
    });
  }
  return particles;
}

function createInitialState(bestDistance: number): GameStateData {
  return {
    playerX: CANVAS_W / 2,
    speed: 0,
    distance: 0,
    score: 0,
    bestDistance,
    obstacles: [],
    bonusItems: [],
    snowParticles: createSnowParticles(60),
    trails: [],
    crashEffect: null,
    pepe: { active: false, y: -100, x: CANVAS_W / 2, chaseStartDistance: 0, caught: false },
    status: "idle",
    frameCount: 0,
    crashTimer: 0,
    jumpTimer: 0,
    jumpHeight: 0,
    boostTimer: 0,
    windGustX: 0,
    windGustTimer: 0,
    obstacleSpawnTimer: 0,
    bonusSpawnTimer: 0,
    slideTimer: 0,
    slideDirection: 0,
    pepeGlowPhase: 0,
    lastPepeChaseEnd: 0,
  };
}

function spawnObstacle(cfg: DifficultyConfig, existing: Obstacle[]): Obstacle | null {
  const types: ObstacleType[] = ["tree", "tree", "tree", "rock", "rock", "mogul", "snowdrift"];
  if (cfg.hasIcePatches) types.push("ice", "ice");

  const type = types[Math.floor(Math.random() * types.length)];
  let w = 20,
    h = 20;

  switch (type) {
    case "tree":
      w = rand(24, 36);
      h = rand(40, 60);
      break;
    case "rock":
      w = rand(20, 35);
      h = rand(16, 26);
      break;
    case "mogul":
      w = rand(30, 45);
      h = rand(14, 22);
      break;
    case "snowdrift":
      w = rand(35, 55);
      h = rand(12, 20);
      break;
    case "ice":
      w = rand(50, 80);
      h = rand(20, 35);
      break;
  }

  const x = rand(30, CANVAS_W - 30 - w);

  for (const obs of existing) {
    if (obs.y > CANVAS_H - 100 && Math.abs(obs.x - x) < cfg.obstacleGap) {
      return null;
    }
  }

  return {
    x,
    y: CANVAS_H + 20,
    type,
    width: w,
    height: h,
    wobbleOffset: rand(-1, 1),
  };
}

function spawnBonusItem(): BonusItem {
  const types: BonusType[] = ["speedboost", "ramp", "coin", "coin", "coin"];
  const type = types[Math.floor(Math.random() * types.length)];
  let w = 20,
    h = 20;

  switch (type) {
    case "speedboost":
      w = 22;
      h = 22;
      break;
    case "ramp":
      w = 50;
      h = 20;
      break;
    case "coin":
      w = 18;
      h = 18;
      break;
  }

  return {
    x: rand(40, CANVAS_W - 40 - w),
    y: CANVAS_H + 20,
    type,
    width: w,
    height: h,
    collected: false,
  };
}

function getHitboxWidth(equipment: Equipment): number {
  return equipment === "skis" ? HEAD_SIZE * 1.0 : HEAD_SIZE * 1.4;
}

function getMoveSpeed(equipment: Equipment): number {
  return equipment === "skis" ? PLAYER_SPEED_SKIS : PLAYER_SPEED_SNOWBOARD;
}

// ── Draw head helper (shared by skier and snowboarder) ──

function drawWojakHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  headR: number,
  wojakImg: HTMLImageElement | null,
) {
  if (wojakImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, headR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(wojakImg, x - headR, y - headR, headR * 2, headR * 2);
    ctx.restore();

    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, headR, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(x, y, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("W", x, y);
  }
}

// ── Draw SKIER character ──

function drawSkier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wojakImg: HTMLImageElement | null,
  tiltAngle: number,
) {
  const headR = HEAD_SIZE / 2;
  const headCY = y;
  const neckY = headCY + headR;
  const bodyTopY = neckY + 2;
  const bodyBottomY = bodyTopY + BODY_H;
  const legLen = 8;
  const footY = bodyBottomY + legLen;

  ctx.save();
  ctx.translate(x, 0);

  // ── Body (jacket) ──
  ctx.fillStyle = "#1a6b1a";
  ctx.beginPath();
  ctx.moveTo(-6, bodyTopY);
  ctx.lineTo(6, bodyTopY);
  ctx.lineTo(8, bodyBottomY);
  ctx.lineTo(-8, bodyBottomY);
  ctx.closePath();
  ctx.fill();
  // Jacket highlight
  ctx.fillStyle = "#228b22";
  ctx.beginPath();
  ctx.moveTo(-4, bodyTopY + 2);
  ctx.lineTo(2, bodyTopY + 2);
  ctx.lineTo(3, bodyBottomY - 2);
  ctx.lineTo(-5, bodyBottomY - 2);
  ctx.closePath();
  ctx.fill();

  // ── Arms holding poles ──
  ctx.strokeStyle = "#1a6b1a";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, bodyTopY + 4);
  ctx.lineTo(-14, bodyTopY + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, bodyTopY + 4);
  ctx.lineTo(14, bodyTopY + 14);
  ctx.stroke();

  // ── Ski poles ──
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-14, bodyTopY + 14);
  ctx.lineTo(-12, footY + 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(14, bodyTopY + 14);
  ctx.lineTo(12, footY + 10);
  ctx.stroke();
  // Pole baskets
  ctx.fillStyle = "#666";
  ctx.beginPath();
  ctx.arc(-12, footY + 10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(12, footY + 10, 2, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs apart for skis ──
  ctx.strokeStyle = "#0d3d0d";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-4, bodyBottomY);
  ctx.lineTo(-5, footY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, bodyBottomY);
  ctx.lineTo(5, footY);
  ctx.stroke();

  // ── Two parallel skis ──
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-5, footY - 4);
  ctx.lineTo(-6 + tiltAngle * 2, footY + 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, footY - 4);
  ctx.lineTo(4 + tiltAngle * 2, footY + 12);
  ctx.stroke();
  // Ski tips (curved up)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6 + tiltAngle * 2, footY + 12);
  ctx.quadraticCurveTo(-7 + tiltAngle * 2, footY + 10, -6 + tiltAngle * 2, footY + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4 + tiltAngle * 2, footY + 12);
  ctx.quadraticCurveTo(3 + tiltAngle * 2, footY + 10, 4 + tiltAngle * 2, footY + 8);
  ctx.stroke();

  // ── Helmet ──
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, headCY - 2, headR + 1, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();

  // ── Head ──
  drawWojakHead(ctx, 0, headCY, headR, wojakImg);

  ctx.restore();
}

// ── Draw SNOWBOARDER character (distinctly different from skier) ──

function drawSnowboarder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wojakImg: HTMLImageElement | null,
  tiltAngle: number,
) {
  const headR = HEAD_SIZE / 2;
  const headCY = y;
  const neckY = headCY + headR;
  const bodyTopY = neckY + 2;
  const bodyBottomY = bodyTopY + BODY_H;
  const legLen = 6;
  const footY = bodyBottomY + legLen;

  ctx.save();
  ctx.translate(x, 0);

  // ── Body (hoodie - slightly wider, more relaxed) ──
  ctx.fillStyle = "#1a5c6b";
  ctx.beginPath();
  ctx.moveTo(-7, bodyTopY);
  ctx.lineTo(5, bodyTopY);
  ctx.lineTo(7, bodyBottomY);
  ctx.lineTo(-9, bodyBottomY);
  ctx.closePath();
  ctx.fill();
  // Hoodie highlight stripe
  ctx.fillStyle = "#228899";
  ctx.beginPath();
  ctx.moveTo(-5, bodyTopY + 2);
  ctx.lineTo(1, bodyTopY + 2);
  ctx.lineTo(2, bodyBottomY - 2);
  ctx.lineTo(-6, bodyBottomY - 2);
  ctx.closePath();
  ctx.fill();
  // Hood/collar line
  ctx.strokeStyle = "#1a5c6b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, bodyTopY, 6, 0, Math.PI);
  ctx.stroke();

  // ── Arms out for balance (no poles!) ──
  ctx.strokeStyle = "#1a5c6b";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  // Left arm - extended out and slightly back
  const armWave = Math.sin(tiltAngle * 2) * 3;
  ctx.beginPath();
  ctx.moveTo(-7, bodyTopY + 5);
  ctx.quadraticCurveTo(-14, bodyTopY + 2 + armWave, -20, bodyTopY + 8 + armWave);
  ctx.stroke();
  // Left glove
  ctx.fillStyle = "#0d3d4d";
  ctx.beginPath();
  ctx.arc(-20, bodyTopY + 8 + armWave, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Right arm - extended out and slightly forward
  ctx.strokeStyle = "#1a5c6b";
  ctx.beginPath();
  ctx.moveTo(5, bodyTopY + 5);
  ctx.quadraticCurveTo(12, bodyTopY + 2 - armWave, 18, bodyTopY + 8 - armWave);
  ctx.stroke();
  // Right glove
  ctx.fillStyle = "#0d3d4d";
  ctx.beginPath();
  ctx.arc(18, bodyTopY + 8 - armWave, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs together, knees bent ──
  ctx.strokeStyle = "#0d3d0d";
  ctx.lineWidth = 3.5;
  // Left leg (slight knee bend)
  ctx.beginPath();
  ctx.moveTo(-3, bodyBottomY);
  ctx.quadraticCurveTo(-5, bodyBottomY + legLen * 0.5, -3, footY);
  ctx.stroke();
  // Right leg
  ctx.beginPath();
  ctx.moveTo(2, bodyBottomY);
  ctx.quadraticCurveTo(0, bodyBottomY + legLen * 0.5, 2, footY);
  ctx.stroke();

  // ── Snowboard angled downhill ──
  const steerShift = tiltAngle * 3;
  const boardLen = 38;
  const boardW = 8;
  // Board tilts downhill (~35°) and shifts with steering
  const boardAngle = Math.PI * 0.2 + tiltAngle * 0.15; // base downhill tilt + steer
  const boardCX = steerShift * 0.5;
  const boardCY = footY + 4;

  ctx.save();
  ctx.translate(boardCX, boardCY);
  ctx.rotate(boardAngle);

  // Board shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.roundRect(-boardLen / 2, 2, boardLen, boardW + 1, boardW / 2);
  ctx.fill();

  // Board body
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.roundRect(-boardLen / 2, -boardW / 2, boardLen, boardW, boardW / 2);
  ctx.fill();

  // Board edge
  ctx.strokeStyle = "#00cc33";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-boardLen / 2, -boardW / 2, boardLen, boardW, boardW / 2);
  ctx.stroke();

  // Center stripe
  ctx.strokeStyle = "#00aa33";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-boardLen / 2 + 5, 0);
  ctx.lineTo(boardLen / 2 - 5, 0);
  ctx.stroke();

  // Bindings
  ctx.fillStyle = "#333";
  ctx.fillRect(-6, -boardW / 2 - 1, 4, boardW + 2);
  ctx.fillRect(3, -boardW / 2 - 1, 4, boardW + 2);

  // Nose/tail highlights
  ctx.fillStyle = "#00ff41";
  ctx.beginPath();
  ctx.arc(-boardLen / 2 + 3, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(boardLen / 2 - 3, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // ── Beanie (instead of helmet) ──
  ctx.fillStyle = "#1a5c6b";
  ctx.beginPath();
  ctx.arc(0, headCY - headR + 2, headR + 1, -Math.PI, 0);
  ctx.fill();
  // Beanie pom-pom
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(0, headCY - headR - 1, 3, 0, Math.PI * 2);
  ctx.fill();
  // Goggles on forehead
  ctx.strokeStyle = "#ff8800";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, headCY - 3, headR * 0.6, -Math.PI * 0.7, -Math.PI * 0.3);
  ctx.stroke();

  // ── Head ──
  drawWojakHead(ctx, 0, headCY, headR, wojakImg);

  ctx.restore();
}

// ── Main component ──

export default function SkiFree() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [equipment, setEquipment] = useState<Equipment>("skis");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameStateData>(createInitialState(0));
  const animRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const wojakImgRef = useRef<HTMLImageElement | null>(null);
  const pepeImgRef = useRef<HTMLImageElement | null>(null);
  const touchXRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const mouseXRef = useRef<number | null>(null);
  const equipmentRef = useRef<Equipment>(equipment);
  const difficultyRef = useRef<Difficulty>(difficulty);

  const [displayState, setDisplayState] = useState<{
    distance: number;
    speed: number;
    score: number;
    bestDistance: number;
    status: string;
  }>({ distance: 0, speed: 0, score: 0, bestDistance: 0, status: "idle" });

  const bestDistancesRef = useRef<Record<Difficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  });

  useEffect(() => {
    equipmentRef.current = equipment;
  }, [equipment]);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // Load images
  useEffect(() => {
    const wImg = new Image();
    wImg.src = WOJAK_IMG;
    wImg.onload = () => {
      wojakImgRef.current = wImg;
    };

    const pImg = new Image();
    pImg.src = PEPE_IMG;
    pImg.onload = () => {
      pepeImgRef.current = pImg;
    };
  }, []);

  // Reset game
  const resetGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff || difficulty;
      stateRef.current = createInitialState(bestDistancesRef.current[d]);
      setDisplayState({
        distance: 0,
        speed: 0,
        score: 0,
        bestDistance: bestDistancesRef.current[d],
        status: "idle",
      });
    },
    [difficulty]
  );

  // Handle difficulty change
  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      cancelAnimationFrame(animRef.current);
      resetGame(diff);
    },
    [resetGame]
  );

  // Handle equipment change — always allowed, resets to idle if mid-game
  const handleEquipmentChange = useCallback(
    (eq: Equipment) => {
      if (eq === equipmentRef.current) return;
      equipmentRef.current = eq;
      setEquipment(eq);
      // Reset to idle so player sees the new character
      const s = stateRef.current;
      if (s.status !== "idle") {
        const d = difficultyRef.current;
        Object.assign(s, createInitialState(bestDistancesRef.current[d]));
        setDisplayState({ distance: 0, speed: 0, score: 0, bestDistance: bestDistancesRef.current[d], status: "idle" });
      }
    },
    []
  );

  // Start the game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "idle") {
      s.status = "playing";
      s.speed = DIFFICULTIES[difficultyRef.current].baseSpeed;
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    } else if (s.status === "gameover") {
      resetGame();
      stateRef.current.status = "playing";
      stateRef.current.speed = DIFFICULTIES[difficultyRef.current].baseSpeed;
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    }
  }, [resetGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s", " "].includes(key)) {
        e.preventDefault();
      }
      keysRef.current.add(key);

      if (key === " " || key === "enter") {
        const s = stateRef.current;
        if (s.status !== "playing" && s.status !== "crashed") {
          startGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startGame]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      return (clientX - rect.left) * scaleX;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;

      if (s.status !== "playing" && s.status !== "crashed") {
        startGame();
        if (e.touches.length > 0) {
          touchXRef.current = getCanvasX(e.touches[0].clientX);
          touchStartXRef.current = getCanvasX(e.touches[0].clientX);
        }
        return;
      }

      if (e.touches.length > 0) {
        const x = getCanvasX(e.touches[0].clientX);
        touchXRef.current = x;
        touchStartXRef.current = x;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        touchXRef.current = getCanvasX(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      touchXRef.current = null;
      touchStartXRef.current = null;
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startGame]);

  // Mouse controls: move to steer, click to start
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      return (clientX - rect.left) * scaleX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = getCanvasX(e.clientX);
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.status !== "playing" && s.status !== "crashed") {
        startGame();
      }
    };

    const handleMouseLeave = () => {
      mouseXRef.current = null;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [startGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;
      const currentEquipment = equipmentRef.current;
      const currentCfg = DIFFICULTIES[difficultyRef.current];

      // ── Update logic ──
      if (s.status === "playing") {
        s.frameCount++;

        const moveSpeed = getMoveSpeed(currentEquipment);
        const hitboxW = getHitboxWidth(currentEquipment);
        const keys = keysRef.current;
        const moveLeft = keys.has("arrowleft") || keys.has("a");
        const moveRight = keys.has("arrowright") || keys.has("d");
        const speedUp = keys.has("arrowdown") || keys.has("s");
        const slowDown = keys.has("arrowup") || keys.has("w");

        // ── Speed control ──
        if (speedUp) {
          s.speed = Math.min(s.speed + 0.08, currentCfg.maxSpeed);
        } else if (slowDown) {
          s.speed = Math.max(s.speed - 0.1, currentCfg.baseSpeed * 0.5);
        } else {
          // Gradually return to base speed
          if (s.speed > currentCfg.baseSpeed) {
            s.speed -= 0.03;
          } else if (s.speed < currentCfg.baseSpeed) {
            s.speed += 0.04;
          }
        }

        // Speed boost effect
        if (s.boostTimer > 0) {
          s.boostTimer--;
          s.speed = Math.min(s.speed + 0.15, currentCfg.maxSpeed * 1.3);
        }

        // ── Player horizontal movement ──
        if (moveLeft) s.playerX -= moveSpeed;
        if (moveRight) s.playerX += moveSpeed;

        // Mouse movement: move player toward mouse X
        if (mouseXRef.current !== null) {
          const targetX = mouseXRef.current;
          const dx = targetX - s.playerX;
          if (Math.abs(dx) > 2) {
            s.playerX += Math.sign(dx) * Math.min(Math.abs(dx) * 0.15, moveSpeed * 1.5);
          }
        }

        // Touch movement
        if (touchXRef.current !== null && touchStartXRef.current !== null) {
          const dx = touchXRef.current - touchStartXRef.current;
          if (Math.abs(dx) > 5) {
            s.playerX += Math.sign(dx) * Math.min(Math.abs(dx) * 0.12, moveSpeed * 1.2);
          }
          // Tap left half = slow, right half = boost
          if (touchXRef.current < CANVAS_W * 0.3) {
            s.speed = Math.max(s.speed - 0.05, currentCfg.baseSpeed * 0.5);
          } else if (touchXRef.current > CANVAS_W * 0.7) {
            s.speed = Math.min(s.speed + 0.05, currentCfg.maxSpeed);
          }
        }

        // Ice slide effect
        if (s.slideTimer > 0) {
          s.slideTimer--;
          s.playerX += s.slideDirection * 2;
        }

        // Wind gust (Expert)
        if (currentCfg.hasWindGusts) {
          s.windGustTimer++;
          if (s.windGustTimer > 300) {
            s.windGustTimer = 0;
            s.windGustX = rand(-1.5, 1.5);
          }
          if (s.windGustX !== 0) {
            s.playerX += s.windGustX;
            s.windGustX *= 0.995;
            if (Math.abs(s.windGustX) < 0.05) s.windGustX = 0;
          }
        }

        // Clamp player
        s.playerX = Math.max(20, Math.min(CANVAS_W - 20, s.playerX));

        // ── Distance and score ──
        const distInc = s.speed * 0.5;
        s.distance += distInc;
        s.score += Math.floor(distInc);

        // ── Jump handling ──
        if (s.jumpTimer > 0) {
          s.jumpTimer--;
          const jumpProgress = s.jumpTimer / 40;
          s.jumpHeight = Math.sin(jumpProgress * Math.PI) * 50;
        } else {
          s.jumpHeight = 0;
        }

        // ── Trail ──
        if (s.jumpHeight < 5) {
          s.trails.push({ x: s.playerX, y: PLAYER_Y + PLAYER_TOTAL_H / 2 + 5, age: 0 });
        }
        for (const t of s.trails) t.age++;
        s.trails = s.trails.filter((t) => t.age < 30);

        // ── Spawn obstacles ──
        s.obstacleSpawnTimer++;
        if (s.obstacleSpawnTimer >= currentCfg.obstacleRate) {
          s.obstacleSpawnTimer = 0;
          const obs = spawnObstacle(currentCfg, s.obstacles);
          if (obs) s.obstacles.push(obs);
        }

        // ── Spawn bonuses ──
        s.bonusSpawnTimer++;
        if (s.bonusSpawnTimer >= currentCfg.bonusRate) {
          s.bonusSpawnTimer = 0;
          s.bonusItems.push(spawnBonusItem());
        }

        // ── Move obstacles upward ──
        for (const obs of s.obstacles) {
          obs.y -= s.speed;
          if (currentCfg.obstacleMovement) {
            obs.x += Math.sin(s.frameCount * 0.02 + obs.wobbleOffset) * 0.3;
          }
        }
        s.obstacles = s.obstacles.filter((obs) => obs.y + obs.height > -20);

        // ── Move bonus items ──
        for (const item of s.bonusItems) {
          item.y -= s.speed;
        }
        s.bonusItems = s.bonusItems.filter((item) => item.y + item.height > -20 && !item.collected);

        // ── Collision: player vs obstacles (skip if jumping) ──
        if (s.jumpHeight < 15) {
          const px = s.playerX;
          const py = PLAYER_Y + BODY_H / 2;
          const phw = hitboxW / 2;
          const phh = PLAYER_TOTAL_H / 2;

          for (const obs of s.obstacles) {
            const ox = obs.x + obs.width / 2;
            const oy = obs.y + obs.height / 2;
            const ohw = obs.width / 2;
            const ohh = obs.height / 2;

            if (
              px + phw > ox - ohw &&
              px - phw < ox + ohw &&
              py + phh > oy - ohh &&
              py - phh < oy + ohh
            ) {
              if (obs.type === "ice") {
                s.slideTimer = 30;
                s.slideDirection = s.playerX > CANVAS_W / 2 ? 1 : -1;
              } else {
                s.status = "crashed";
                s.crashTimer = 60;
                s.speed *= 0.3;
                s.crashEffect = {
                  x: s.playerX,
                  y: PLAYER_Y,
                  particles: Array.from({ length: 12 }, () => ({
                    dx: rand(-3, 3),
                    dy: rand(-4, 2),
                    size: rand(2, 5),
                    alpha: 1,
                  })),
                  frame: 0,
                };
                break;
              }
            }
          }
        }

        // ── Collision: player vs bonus items ──
        for (const item of s.bonusItems) {
          if (item.collected) continue;
          const ix = item.x + item.width / 2;
          const iy = item.y + item.height / 2;
          const dist = Math.sqrt((s.playerX - ix) ** 2 + (PLAYER_Y - iy) ** 2);

          if (dist < HEAD_SIZE / 2 + item.width / 2 + 8) {
            item.collected = true;
            switch (item.type) {
              case "speedboost":
                s.boostTimer = 90;
                break;
              case "ramp":
                s.jumpTimer = 40;
                break;
              case "coin":
                s.score += 200;
                break;
            }
          }
        }

        // ── PEPE chase logic ──
        const meterDistance = Math.floor(s.distance / 10);
        if (
          !s.pepe.active &&
          !s.pepe.caught &&
          meterDistance >= currentCfg.pepeDistance &&
          meterDistance - s.lastPepeChaseEnd > currentCfg.pepeChaseDuration * 0.5
        ) {
          s.pepe.active = true;
          s.pepe.y = CANVAS_H + 80;
          s.pepe.x = CANVAS_W / 2;
          s.pepe.chaseStartDistance = s.distance;
        }

        if (s.pepe.active) {
          s.pepeGlowPhase += 0.05;

          const pepeTargetY = PLAYER_Y + 80;
          const catchSpeed = currentCfg.pepeSpeed * (1 + (s.speed < currentCfg.baseSpeed ? 0.5 : 0));
          s.pepe.y -= s.speed + catchSpeed;
          if (s.pepe.y < pepeTargetY) {
            s.pepe.y += catchSpeed * 0.3;
          }

          const pepeDx = s.playerX - s.pepe.x;
          s.pepe.x += pepeDx * 0.03;

          const pepeDist = Math.sqrt(
            (s.playerX - s.pepe.x) ** 2 + (PLAYER_Y - s.pepe.y) ** 2
          );
          if (pepeDist < HEAD_SIZE / 2 + 35) {
            s.pepe.caught = true;
            s.pepe.active = false;
            s.status = "gameover";
            if (meterDistance > bestDistancesRef.current[difficultyRef.current]) {
              bestDistancesRef.current[difficultyRef.current] = meterDistance;
            }
            s.bestDistance = bestDistancesRef.current[difficultyRef.current];
            setDisplayState({
              distance: meterDistance,
              speed: Math.round(s.speed * 10),
              score: s.score,
              bestDistance: s.bestDistance,
              status: "gameover",
            });
          }

          const chaseDistance = (s.distance - s.pepe.chaseStartDistance) / 10;
          if (chaseDistance > currentCfg.pepeChaseDuration) {
            s.pepe.active = false;
            s.pepe.y = CANVAS_H + 100;
            s.lastPepeChaseEnd = meterDistance;
          }
        }

        // ── Snow particles ──
        for (const p of s.snowParticles) {
          p.y -= s.speed * 0.3;
          p.x += p.drift;
          if (p.y < -5) {
            p.y = CANVAS_H + 5;
            p.x = Math.random() * CANVAS_W;
          }
          if (p.x < 0) p.x = CANVAS_W;
          if (p.x > CANVAS_W) p.x = 0;
        }

        // Update display
        if (s.frameCount % 3 === 0) {
          setDisplayState({
            distance: meterDistance,
            speed: Math.round(s.speed * 10),
            score: s.score,
            bestDistance: bestDistancesRef.current[difficultyRef.current],
            status: "playing",
          });
        }
      }

      // ── Crash recovery ──
      if (s.status === "crashed") {
        s.crashTimer--;
        s.frameCount++;

        s.distance += s.speed * 0.3;
        for (const obs of s.obstacles) obs.y -= s.speed * 0.3;
        for (const item of s.bonusItems) item.y -= s.speed * 0.3;
        s.obstacles = s.obstacles.filter((obs) => obs.y + obs.height > -20);

        if (s.crashEffect) {
          s.crashEffect.frame++;
          for (const p of s.crashEffect.particles) {
            p.dy += 0.1;
            p.alpha -= 0.02;
          }
        }

        for (const p of s.snowParticles) {
          p.y -= s.speed * 0.15;
          if (p.y < -5) {
            p.y = CANVAS_H + 5;
            p.x = Math.random() * CANVAS_W;
          }
        }

        if (s.crashTimer <= 0) {
          s.status = "playing";
          s.crashEffect = null;
          s.speed = DIFFICULTIES[difficultyRef.current].baseSpeed * 0.7;
          setDisplayState((prev) => ({ ...prev, status: "playing" }));
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background - dark snow slope
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bgGrad.addColorStop(0, "#0d0d0d");
      bgGrad.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle slope texture lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 1;
      const texOffset = (s.frameCount * 0.5) % 40;
      for (let ty = -40 + texOffset; ty < CANVAS_H + 40; ty += 40) {
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(CANVAS_W, ty + 10);
        ctx.stroke();
      }

      // ── Draw trails ──
      const currentEq = equipmentRef.current;
      if (currentEq === "skis") {
        for (const t of s.trails) {
          const alpha = Math.max(0, 1 - t.age / 30);
          ctx.strokeStyle = `rgba(0, 255, 65, ${alpha * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(t.x - 5, t.y + t.age * s.speed * 0.06);
          ctx.lineTo(t.x - 5, t.y + t.age * s.speed * 0.06 + 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(t.x + 5, t.y + t.age * s.speed * 0.06);
          ctx.lineTo(t.x + 5, t.y + t.age * s.speed * 0.06 + 3);
          ctx.stroke();
        }
      } else {
        for (const t of s.trails) {
          const alpha = Math.max(0, 1 - t.age / 30);
          ctx.strokeStyle = `rgba(0, 255, 65, ${alpha * 0.5})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(t.x, t.y + t.age * s.speed * 0.06);
          ctx.lineTo(t.x, t.y + t.age * s.speed * 0.06 + 3);
          ctx.stroke();
        }
      }

      // ── Draw obstacles ──
      for (const obs of s.obstacles) {
        switch (obs.type) {
          case "tree": {
            const cx = obs.x + obs.width / 2;
            const baseY = obs.y + obs.height;

            // Trunk
            ctx.fillStyle = "#2d1a00";
            ctx.fillRect(cx - 3, baseY - 10, 6, 10);

            // Tree body (triangle)
            ctx.fillStyle = TREE_COLOR;
            ctx.beginPath();
            ctx.moveTo(cx, obs.y);
            ctx.lineTo(obs.x, baseY - 8);
            ctx.lineTo(obs.x + obs.width, baseY - 8);
            ctx.closePath();
            ctx.fill();

            // Snow on tree (white)
            ctx.fillStyle = TREE_SNOW_COLOR;
            ctx.globalAlpha = 0.8;
            // Top snow cap
            ctx.beginPath();
            ctx.moveTo(cx, obs.y - 2);
            ctx.lineTo(cx - obs.width * 0.3, obs.y + obs.height * 0.2);
            ctx.lineTo(cx + obs.width * 0.3, obs.y + obs.height * 0.2);
            ctx.closePath();
            ctx.fill();
            // Mid snow shelf
            ctx.beginPath();
            ctx.moveTo(cx - obs.width * 0.1, obs.y + obs.height * 0.35);
            ctx.lineTo(cx - obs.width * 0.4, obs.y + obs.height * 0.45);
            ctx.lineTo(cx + obs.width * 0.15, obs.y + obs.height * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            break;
          }
          case "rock": {
            ctx.fillStyle = ROCK_COLOR;
            ctx.beginPath();
            const rx = obs.x;
            const ry = obs.y;
            ctx.moveTo(rx + obs.width * 0.2, ry + obs.height);
            ctx.lineTo(rx, ry + obs.height * 0.5);
            ctx.lineTo(rx + obs.width * 0.3, ry);
            ctx.lineTo(rx + obs.width * 0.7, ry);
            ctx.lineTo(rx + obs.width, ry + obs.height * 0.4);
            ctx.lineTo(rx + obs.width * 0.8, ry + obs.height);
            ctx.closePath();
            ctx.fill();
            // Subtle green tint
            ctx.fillStyle = "rgba(0, 153, 38, 0.15)";
            ctx.fill();
            // Snow on top
            ctx.fillStyle = "rgba(220, 230, 220, 0.4)";
            ctx.beginPath();
            ctx.moveTo(rx + obs.width * 0.2, ry + 2);
            ctx.lineTo(rx + obs.width * 0.3, ry);
            ctx.lineTo(rx + obs.width * 0.7, ry);
            ctx.lineTo(rx + obs.width * 0.6, ry + 3);
            ctx.closePath();
            ctx.fill();
            break;
          }
          case "mogul": {
            ctx.fillStyle = MOGUL_COLOR;
            ctx.beginPath();
            ctx.ellipse(
              obs.x + obs.width / 2,
              obs.y + obs.height / 2,
              obs.width / 2,
              obs.height / 2,
              0, 0, Math.PI * 2
            );
            ctx.fill();
            // White highlight on top
            ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
            ctx.beginPath();
            ctx.ellipse(
              obs.x + obs.width / 2,
              obs.y + obs.height / 2 - 2,
              obs.width / 3,
              obs.height / 3,
              0, 0, Math.PI
            );
            ctx.fill();
            break;
          }
          case "snowdrift": {
            // White-ish snow mound
            ctx.fillStyle = SNOW_DRIFT_COLOR;
            ctx.beginPath();
            ctx.ellipse(
              obs.x + obs.width / 2,
              obs.y + obs.height / 2,
              obs.width / 2,
              obs.height / 2,
              0, 0, Math.PI * 2
            );
            ctx.fill();
            // Brighter white top
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.beginPath();
            ctx.ellipse(
              obs.x + obs.width / 2 - 3,
              obs.y + obs.height / 2 - 2,
              obs.width / 3,
              obs.height / 3,
              0, 0, Math.PI * 2
            );
            ctx.fill();
            break;
          }
          case "ice": {
            ctx.fillStyle = ICE_COLOR;
            ctx.beginPath();
            ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
            ctx.fill();
            ctx.strokeStyle = "rgba(100, 180, 255, 0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();
            break;
          }
        }
      }

      // ── Draw bonus items ──
      for (const item of s.bonusItems) {
        if (item.collected) continue;

        switch (item.type) {
          case "speedboost": {
            const cx = item.x + item.width / 2;
            const cy = item.y + item.height / 2;
            ctx.shadowColor = GREEN;
            ctx.shadowBlur = 12;
            ctx.fillStyle = GREEN;
            ctx.beginPath();
            ctx.arc(cx, cy, item.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#000";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("\u2193", cx, cy);
            break;
          }
          case "ramp": {
            // Proper ski jump ramp shape
            const rx = item.x;
            const ry = item.y;
            const rw = item.width;
            const rh = item.height;

            // Ramp body - curved launch surface
            ctx.fillStyle = RAMP_COLOR;
            ctx.beginPath();
            ctx.moveTo(rx, ry + rh); // bottom-left
            ctx.lineTo(rx + rw, ry + rh); // bottom-right
            ctx.lineTo(rx + rw, ry + rh * 0.3); // top-right (lip)
            ctx.quadraticCurveTo(rx + rw * 0.5, ry, rx, ry + rh * 0.7); // curved ramp
            ctx.closePath();
            ctx.fill();

            // Ramp surface highlight
            ctx.strokeStyle = GREEN;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rx, ry + rh * 0.7);
            ctx.quadraticCurveTo(rx + rw * 0.5, ry - 2, rx + rw, ry + rh * 0.3);
            ctx.stroke();

            // Lip edge (the launch point)
            ctx.fillStyle = GREEN;
            ctx.fillRect(rx + rw - 4, ry + rh * 0.2, 4, rh * 0.15);

            // Snow on ramp surface
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.beginPath();
            ctx.moveTo(rx + 4, ry + rh * 0.75);
            ctx.quadraticCurveTo(rx + rw * 0.4, ry + rh * 0.1, rx + rw - 6, ry + rh * 0.35);
            ctx.lineTo(rx + rw - 6, ry + rh * 0.5);
            ctx.quadraticCurveTo(rx + rw * 0.4, ry + rh * 0.25, rx + 4, ry + rh * 0.85);
            ctx.closePath();
            ctx.fill();

            // "JUMP" label
            ctx.fillStyle = "#000";
            ctx.font = "bold 8px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("JUMP", rx + rw / 2, ry + rh * 0.65);
            break;
          }
          case "coin": {
            const cx = item.x + item.width / 2;
            const cy = item.y + item.height / 2;
            ctx.shadowColor = COIN_COLOR;
            ctx.shadowBlur = 8;
            ctx.fillStyle = COIN_COLOR;
            ctx.beginPath();
            ctx.arc(cx, cy, item.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#000";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("$", cx, cy);
            break;
          }
        }
      }

      // ── Draw PEPE (abominable monster) ──
      if (s.pepe.active) {
        const pepeSize = 70;
        const px = s.pepe.x;
        const py = s.pepe.y;

        const glowAlpha = 0.2 + Math.sin(s.pepeGlowPhase) * 0.1;
        ctx.shadowColor = "#ff4400";
        ctx.shadowBlur = 30;
        ctx.fillStyle = `rgba(255, 68, 0, ${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, pepeSize / 2 + 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (pepeImgRef.current) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, pepeSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(
            pepeImgRef.current,
            px - pepeSize / 2,
            py - pepeSize / 2,
            pepeSize,
            pepeSize
          );
          ctx.restore();

          ctx.strokeStyle = "#ff4444";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(px, py, pepeSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = "#ff4444";
          ctx.beginPath();
          ctx.arc(px, py, pepeSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font = "bold 18px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("P", px, py);
        }
      }

      // ── Draw player (WOJAK skier/snowboarder) ──
      const playerDrawY = PLAYER_Y - s.jumpHeight;
      const playerVisible =
        s.status !== "crashed" || Math.floor(s.crashTimer / 4) % 2 === 0;

      if (playerVisible) {
        // Jump shadow
        if (s.jumpHeight > 5) {
          ctx.fillStyle = `rgba(0, 0, 0, ${0.3 - s.jumpHeight * 0.004})`;
          ctx.beginPath();
          ctx.ellipse(
            s.playerX,
            PLAYER_Y + PLAYER_TOTAL_H / 2 + 3,
            12,
            4,
            0, 0, Math.PI * 2
          );
          ctx.fill();
        }

        // Calculate tilt based on movement direction
        const keys = keysRef.current;
        let tilt = 0;
        if (keys.has("arrowleft") || keys.has("a")) tilt = -1;
        if (keys.has("arrowright") || keys.has("d")) tilt = 1;
        if (mouseXRef.current !== null) {
          const dx = mouseXRef.current - s.playerX;
          if (Math.abs(dx) > 5) tilt = Math.sign(dx) * Math.min(Math.abs(dx) / 30, 1);
        }

        if (currentEq === "skis") {
          drawSkier(ctx, s.playerX, playerDrawY, wojakImgRef.current, tilt);
        } else {
          drawSnowboarder(ctx, s.playerX, playerDrawY, wojakImgRef.current, tilt);
        }
      }

      // ── Draw crash particles ──
      if (s.crashEffect) {
        for (const p of s.crashEffect.particles) {
          if (p.alpha <= 0) continue;
          const px2 = s.crashEffect.x + p.dx * s.crashEffect.frame;
          const py2 = s.crashEffect.y + p.dy * s.crashEffect.frame;
          ctx.fillStyle =
            Math.random() > 0.5
              ? `rgba(0, 255, 65, ${p.alpha})`
              : `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(px2, py2, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Draw snow particles (foreground, parallax) ──
      for (const p of s.snowParticles) {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── HUD on canvas ──
      if (s.status === "playing" || s.status === "crashed") {
        ctx.fillStyle = GREEN;
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`${Math.floor(s.distance / 10)}m`, 12, 12);

        ctx.fillStyle = s.boostTimer > 0 ? "#ffff00" : GREEN;
        ctx.font = "12px monospace";
        ctx.fillText(`${Math.round(s.speed * 10)} km/h`, 12, 32);

        ctx.fillStyle = GREEN;
        ctx.textAlign = "right";
        ctx.font = "bold 14px monospace";
        ctx.fillText(`${s.score}`, CANVAS_W - 12, 12);

        if (s.pepe.active) {
          const warningAlpha = 0.5 + Math.sin(s.frameCount * 0.1) * 0.5;
          ctx.fillStyle = `rgba(255, 68, 0, ${warningAlpha})`;
          ctx.textAlign = "center";
          ctx.font = "bold 14px monospace";
          ctx.fillText("PEPE IS CHASING YOU!", CANVAS_W / 2, 12);
        }

        if (s.windGustX !== 0 && Math.abs(s.windGustX) > 0.2) {
          ctx.fillStyle = "rgba(150, 200, 255, 0.6)";
          ctx.textAlign = "center";
          ctx.font = "11px monospace";
          ctx.fillText(
            s.windGustX > 0 ? "WIND >>>" : "<<< WIND",
            CANVAS_W / 2, 50
          );
        }

        if (s.boostTimer > 0) {
          ctx.fillStyle = GREEN;
          ctx.textAlign = "center";
          ctx.font = "bold 12px monospace";
          ctx.fillText("BOOST!", CANVAS_W / 2, 32);
        }
      }

      // ── Idle overlay ──
      if (s.status === "idle") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = GREEN;
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SKI FREE", CANVAS_W / 2, CANVAS_H / 2 - 60);

        ctx.fillStyle = "#ffffff";
        ctx.font = "16px monospace";
        ctx.fillText("Click or Press Space", CANVAS_W / 2, CANVAS_H / 2 - 15);

        ctx.fillStyle = "#888888";
        ctx.font = "13px monospace";
        ctx.fillText("Mouse, Arrow keys, or WASD", CANVAS_W / 2, CANVAS_H / 2 + 15);
        ctx.fillText("\u2193/S = boost  \u2191/W = brake", CANVAS_W / 2, CANVAS_H / 2 + 35);
        ctx.fillText("Dodge obstacles, outrun PEPE!", CANVAS_W / 2, CANVAS_H / 2 + 60);
      }

      // ── Game over overlay ──
      if (s.status === "gameover") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = "#f87171";
        ctx.font = "bold 32px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          s.pepe.caught ? "PEPE CAUGHT YOU!" : "GAME OVER",
          CANVAS_W / 2, CANVAS_H / 2 - 70
        );

        ctx.fillStyle = "#ffffff";
        ctx.font = "18px monospace";
        ctx.fillText(`Distance: ${Math.floor(s.distance / 10)}m`, CANVAS_W / 2, CANVAS_H / 2 - 25);
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 5);

        ctx.fillStyle = GREEN;
        ctx.font = "16px monospace";
        ctx.fillText(`Best: ${bestDistancesRef.current[difficultyRef.current]}m`, CANVAS_W / 2, CANVAS_H / 2 + 35);

        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText("Click to play again", CANVAS_W / 2, CANVAS_H / 2 + 70);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [difficulty]);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-fit mx-auto">
      {/* Difficulty selector */}
      <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => (
          <button
            key={key}
            onClick={() => handleDifficultyChange(key)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              difficulty === key
                ? "bg-wojak-green text-black"
                : "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            {DIFFICULTIES[key].label}
          </button>
        ))}

        {/* Equipment toggle */}
        <div className="flex gap-1 ml-1 sm:ml-2 border border-wojak-border rounded-lg p-0.5">
          <button
            onClick={() => handleEquipmentChange("skis")}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              equipment === "skis"
                ? "bg-wojak-green text-black"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Ski
          </button>
          <button
            onClick={() => handleEquipmentChange("snowboard")}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              equipment === "snowboard"
                ? "bg-wojak-green text-black"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Snowboard
          </button>
        </div>

        {/* New game button */}
        <button
          onClick={() => resetGame()}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          New Game
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 sm:gap-4 bg-wojak-card border border-wojak-border rounded-xl px-3 sm:px-4 py-2 min-w-[280px] sm:min-w-[420px] justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Dist:</span>
          <span className="font-mono text-sm font-bold text-wojak-green">
            {displayState.distance}m
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Speed:</span>
          <span className="font-mono text-sm font-bold text-wojak-green">
            {displayState.speed}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Score:</span>
          <span className="font-mono text-sm font-bold text-wojak-green">
            {displayState.score}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Best:</span>
          <span className="font-mono text-sm font-bold text-yellow-400">
            {displayState.bestDistance}m
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="border-2 border-wojak-border rounded-lg cursor-pointer"
        style={{
          width: "min(85vw, 480px)",
          height: "auto",
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
          touchAction: "none",
        }}
      />

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Mouse, Arrow keys, or WASD to steer. Down/S = boost, Up/W = brake
        </span>
        <span className="sm:hidden">
          Drag to steer. Tap left = brake, right = boost
        </span>
      </div>
    </div>
  );
}
