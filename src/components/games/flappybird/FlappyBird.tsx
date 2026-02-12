"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Difficulty config ──

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface DifficultyConfig {
  label: string;
  gravity: number;
  flapStrength: number;
  pipeSpeed: number;
  pipeGap: number;
  pipeWidth: number;
  pipeSpawnInterval: number; // frames between pipe spawns
  verticalPipes: boolean; // pipes oscillate up/down (Expert)
  verticalAmplitude: number;
  verticalSpeed: number;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    gravity: 0.35,
    flapStrength: -6.5,
    pipeSpeed: 2,
    pipeGap: 180,
    pipeWidth: 60,
    pipeSpawnInterval: 120,
    verticalPipes: false,
    verticalAmplitude: 0,
    verticalSpeed: 0,
  },
  medium: {
    label: "Medium",
    gravity: 0.45,
    flapStrength: -7,
    pipeSpeed: 2.8,
    pipeGap: 150,
    pipeWidth: 60,
    pipeSpawnInterval: 100,
    verticalPipes: false,
    verticalAmplitude: 0,
    verticalSpeed: 0,
  },
  hard: {
    label: "Hard",
    gravity: 0.55,
    flapStrength: -7.5,
    pipeSpeed: 3.5,
    pipeGap: 125,
    pipeWidth: 55,
    pipeSpawnInterval: 85,
    verticalPipes: false,
    verticalAmplitude: 0,
    verticalSpeed: 0,
  },
  expert: {
    label: "Expert",
    gravity: 0.6,
    flapStrength: -7.8,
    pipeSpeed: 4,
    pipeGap: 115,
    pipeWidth: 55,
    pipeSpawnInterval: 80,
    verticalPipes: true,
    verticalAmplitude: 40,
    verticalSpeed: 0.02,
  },
};

// ── Canvas dimensions ──

const CANVAS_W = 400;
const CANVAS_H = 600;
const GROUND_H = 50;
const PLAY_H = CANVAS_H - GROUND_H;

// ── Bird config ──

const BIRD_SIZE = 38;
const BIRD_X = 80;

// ── Avatar ──

const WOJAK_AVATAR = "/images/favicon.jpg";

// ── Colors ──

const PIPE_COLOR = "#00ff41";
const PIPE_BORDER_COLOR = "#00cc33";
const PIPE_CAP_COLOR = "#00e639";
const BG_COLOR = "#0a0a0a";
const GROUND_COLOR = "#111111";
const GROUND_LINE_COLOR = "#1a1a1a";

// ── Types ──

interface Pipe {
  x: number;
  gapY: number; // center of the gap
  passed: boolean;
  spawnFrame: number; // frame when spawned, for vertical oscillation
}

interface GameStateData {
  birdY: number;
  birdVelocity: number;
  pipes: Pipe[];
  score: number;
  bestScore: number;
  status: "idle" | "playing" | "gameover";
  frameCount: number;
  groundOffset: number;
}

// ── Helpers ──

function createInitialState(bestScore: number): GameStateData {
  return {
    birdY: PLAY_H / 2,
    birdVelocity: 0,
    pipes: [],
    score: 0,
    bestScore,
    status: "idle",
    frameCount: 0,
    groundOffset: 0,
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Main component ──

export default function FlappyBird() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameStateData>(createInitialState(0));
  const animRef = useRef<number>(0);
  const wojakImgRef = useRef<HTMLImageElement | null>(null);
  const [displayState, setDisplayState] = useState<{
    score: number;
    bestScore: number;
    status: string;
  }>({ score: 0, bestScore: 0, status: "idle" });

  const bestScoresRef = useRef<Record<Difficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  });

  // Load WOJAK avatar image
  useEffect(() => {
    const img = new Image();
    img.src = WOJAK_AVATAR;
    img.onload = () => {
      wojakImgRef.current = img;
    };
  }, []);

  // Reset game
  const resetGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff || difficulty;
      stateRef.current = createInitialState(bestScoresRef.current[d]);
      setDisplayState({
        score: 0,
        bestScore: bestScoresRef.current[d],
        status: "idle",
      });
    },
    [difficulty]
  );

  // Handle difficulty change
  const handleDifficultyChange = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    cancelAnimationFrame(animRef.current);
    stateRef.current = createInitialState(bestScoresRef.current[diff]);
    setDisplayState({
      score: 0,
      bestScore: bestScoresRef.current[diff],
      status: "idle",
    });
  }, []);

  // Flap action
  const flap = useCallback(() => {
    const s = stateRef.current;
    const cfg = DIFFICULTIES[difficulty];
    if (s.status === "idle") {
      s.status = "playing";
      s.birdVelocity = cfg.flapStrength;
      s.frameCount = 0;
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    } else if (s.status === "playing") {
      s.birdVelocity = cfg.flapStrength;
    } else if (s.status === "gameover") {
      resetGame();
    }
  }, [difficulty, resetGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flap]);

  // Mouse / touch controls on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      flap();
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      flap();
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleTouch, { passive: false });

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleTouch);
    };
  }, [flap]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = DIFFICULTIES[difficulty];

    const loop = () => {
      const s = stateRef.current;

      // ── Update logic ──
      if (s.status === "playing") {
        s.frameCount++;

        // Gravity
        s.birdVelocity += cfg.gravity;
        s.birdY += s.birdVelocity;

        // Scrolling ground
        s.groundOffset = (s.groundOffset + cfg.pipeSpeed) % 24;

        // Spawn pipes
        if (s.frameCount % cfg.pipeSpawnInterval === 0) {
          const minGapY = cfg.pipeGap / 2 + 30;
          const maxGapY = PLAY_H - cfg.pipeGap / 2 - 30;
          const gapY = minGapY + Math.random() * (maxGapY - minGapY);
          s.pipes.push({
            x: CANVAS_W + cfg.pipeWidth,
            gapY,
            passed: false,
            spawnFrame: s.frameCount,
          });
        }

        // Move pipes
        for (const pipe of s.pipes) {
          pipe.x -= cfg.pipeSpeed;
        }

        // Remove off-screen pipes
        s.pipes = s.pipes.filter((p) => p.x + cfg.pipeWidth > -10);

        // Check scoring
        for (const pipe of s.pipes) {
          if (!pipe.passed && pipe.x + cfg.pipeWidth < BIRD_X) {
            pipe.passed = true;
            s.score++;
            setDisplayState((prev) => ({
              ...prev,
              score: s.score,
            }));
          }
        }

        // Collision detection
        const birdTop = s.birdY - BIRD_SIZE / 2;
        const birdBottom = s.birdY + BIRD_SIZE / 2;
        const birdLeft = BIRD_X - BIRD_SIZE / 2;
        const birdRight = BIRD_X + BIRD_SIZE / 2;

        // Floor / ceiling collision
        if (birdBottom >= PLAY_H || birdTop <= 0) {
          s.birdY = clamp(s.birdY, BIRD_SIZE / 2, PLAY_H - BIRD_SIZE / 2);
          s.status = "gameover";
          if (s.score > bestScoresRef.current[difficulty]) {
            bestScoresRef.current[difficulty] = s.score;
          }
          s.bestScore = bestScoresRef.current[difficulty];
          setDisplayState({
            score: s.score,
            bestScore: s.bestScore,
            status: "gameover",
          });
        }

        // Pipe collision
        if (s.status === "playing") {
          for (const pipe of s.pipes) {
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + cfg.pipeWidth;

            // Vertical oscillation for Expert
            let gapY = pipe.gapY;
            if (cfg.verticalPipes) {
              const elapsed = s.frameCount - pipe.spawnFrame;
              gapY += Math.sin(elapsed * cfg.verticalSpeed) * cfg.verticalAmplitude;
              gapY = clamp(gapY, cfg.pipeGap / 2 + 10, PLAY_H - cfg.pipeGap / 2 - 10);
            }

            const gapTop = gapY - cfg.pipeGap / 2;
            const gapBottom = gapY + cfg.pipeGap / 2;

            // Check if bird overlaps pipe horizontally
            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              // Check if bird is outside the gap
              if (birdTop < gapTop || birdBottom > gapBottom) {
                s.status = "gameover";
                if (s.score > bestScoresRef.current[difficulty]) {
                  bestScoresRef.current[difficulty] = s.score;
                }
                s.bestScore = bestScoresRef.current[difficulty];
                setDisplayState({
                  score: s.score,
                  bestScore: s.bestScore,
                  status: "gameover",
                });
                break;
              }
            }
          }
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle background stars / dots
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 137 + 50) % CANVAS_W);
        const sy = ((i * 97 + 30) % PLAY_H);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Pipes
      for (const pipe of s.pipes) {
        const cfg2 = DIFFICULTIES[difficulty];

        let gapY = pipe.gapY;
        if (cfg2.verticalPipes) {
          const elapsed = s.frameCount - pipe.spawnFrame;
          gapY += Math.sin(elapsed * cfg2.verticalSpeed) * cfg2.verticalAmplitude;
          gapY = clamp(gapY, cfg2.pipeGap / 2 + 10, PLAY_H - cfg2.pipeGap / 2 - 10);
        }

        const gapTop = gapY - cfg2.pipeGap / 2;
        const gapBottom = gapY + cfg2.pipeGap / 2;
        const capH = 20;
        const capOverhang = 4;

        // Top pipe body
        ctx.fillStyle = PIPE_COLOR;
        ctx.fillRect(pipe.x, 0, cfg2.pipeWidth, gapTop - capH);
        // Top pipe cap
        ctx.fillStyle = PIPE_CAP_COLOR;
        ctx.fillRect(
          pipe.x - capOverhang,
          gapTop - capH,
          cfg2.pipeWidth + capOverhang * 2,
          capH
        );
        // Top pipe border
        ctx.strokeStyle = PIPE_BORDER_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, cfg2.pipeWidth, gapTop - capH);
        ctx.strokeRect(
          pipe.x - capOverhang,
          gapTop - capH,
          cfg2.pipeWidth + capOverhang * 2,
          capH
        );

        // Bottom pipe body
        ctx.fillStyle = PIPE_COLOR;
        ctx.fillRect(pipe.x, gapBottom + capH, cfg2.pipeWidth, PLAY_H - gapBottom - capH);
        // Bottom pipe cap
        ctx.fillStyle = PIPE_CAP_COLOR;
        ctx.fillRect(
          pipe.x - capOverhang,
          gapBottom,
          cfg2.pipeWidth + capOverhang * 2,
          capH
        );
        // Bottom pipe border
        ctx.strokeStyle = PIPE_BORDER_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, gapBottom + capH, cfg2.pipeWidth, PLAY_H - gapBottom - capH);
        ctx.strokeRect(
          pipe.x - capOverhang,
          gapBottom,
          cfg2.pipeWidth + capOverhang * 2,
          capH
        );

        // Pipe highlight (inner shine)
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fillRect(pipe.x + 4, 0, 8, gapTop - capH);
        ctx.fillRect(pipe.x + 4, gapBottom + capH, 8, PLAY_H - gapBottom - capH);
      }

      // Ground
      ctx.fillStyle = GROUND_COLOR;
      ctx.fillRect(0, PLAY_H, CANVAS_W, GROUND_H);
      // Ground top line
      ctx.strokeStyle = PIPE_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, PLAY_H);
      ctx.lineTo(CANVAS_W, PLAY_H);
      ctx.stroke();
      // Ground pattern
      ctx.strokeStyle = GROUND_LINE_COLOR;
      ctx.lineWidth = 1;
      for (let gx = -s.groundOffset; gx < CANVAS_W + 24; gx += 24) {
        ctx.beginPath();
        ctx.moveTo(gx, PLAY_H + 10);
        ctx.lineTo(gx + 12, PLAY_H + GROUND_H);
        ctx.stroke();
      }

      // Bird (WOJAK avatar with rotation based on velocity)
      const birdAngle = clamp(s.birdVelocity * 0.06, -0.5, Math.PI / 4);

      ctx.save();
      ctx.translate(BIRD_X, s.birdY);
      ctx.rotate(birdAngle);

      if (wojakImgRef.current) {
        // Draw circular WOJAK avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          wojakImgRef.current,
          -BIRD_SIZE / 2,
          -BIRD_SIZE / 2,
          BIRD_SIZE,
          BIRD_SIZE
        );
        ctx.restore();

        // Green border ring around WOJAK
        ctx.strokeStyle = PIPE_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Fallback circle if image not loaded
        ctx.fillStyle = PIPE_COLOR;
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("W", 0, 0);
      }

      ctx.restore();

      // In-game score display
      if (s.status === "playing") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.font = "bold 48px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(String(s.score), CANVAS_W / 2 + 2, 22);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(s.score), CANVAS_W / 2, 20);
      }

      // Idle overlay
      if (s.status === "idle") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FLAPPY WOJAK", CANVAS_W / 2, PLAY_H / 2 - 40);

        ctx.fillStyle = "#ffffff";
        ctx.font = "16px monospace";
        ctx.fillText(
          "Click, Tap, or Space to Flap",
          CANVAS_W / 2,
          PLAY_H / 2 + 10
        );

        ctx.fillStyle = "#888888";
        ctx.font = "13px monospace";
        ctx.fillText(
          "Fly through the pipes!",
          CANVAS_W / 2,
          PLAY_H / 2 + 40
        );
      }

      // Game over overlay
      if (s.status === "gameover") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = "#f87171";
        ctx.font = "bold 32px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", CANVAS_W / 2, PLAY_H / 2 - 50);

        ctx.fillStyle = "#ffffff";
        ctx.font = "18px monospace";
        ctx.fillText(
          `Score: ${s.score}`,
          CANVAS_W / 2,
          PLAY_H / 2 - 10
        );

        ctx.fillStyle = "#00ff41";
        ctx.font = "16px monospace";
        ctx.fillText(
          `Best: ${s.bestScore}`,
          CANVAS_W / 2,
          PLAY_H / 2 + 20
        );

        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText(
          "Click or Tap to Play Again",
          CANVAS_W / 2,
          PLAY_H / 2 + 60
        );
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [difficulty]);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-fit mx-auto">
      {/* Difficulty selector */}
      <div className="flex gap-1.5 sm:gap-2">
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

        {/* New game button */}
        <button
          onClick={() => resetGame()}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          New Game
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 sm:gap-4 bg-wojak-card border border-wojak-border rounded-xl px-3 sm:px-4 py-2 min-w-[240px] sm:min-w-[280px] justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Score:</span>
          <span className="font-mono text-sm font-bold text-wojak-green">
            {displayState.score}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Best:</span>
          <span className="font-mono text-sm font-bold text-yellow-400">
            {displayState.bestScore}
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
          width: "min(85vw, 360px)",
          height: "auto",
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
          touchAction: "none",
        }}
      />

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Click or press Space to flap
        </span>
        <span className="sm:hidden">Tap to flap</span>
      </div>
    </div>
  );
}
