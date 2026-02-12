"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Difficulty config ──

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface DifficultyConfig {
  label: string;
  rows: number;
  ballSpeed: number;
  brickHealth: (row: number) => number;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    rows: 3,
    ballSpeed: 3,
    brickHealth: () => 1,
  },
  medium: {
    label: "Medium",
    rows: 4,
    ballSpeed: 4,
    brickHealth: () => 1,
  },
  hard: {
    label: "Hard",
    rows: 5,
    ballSpeed: 5,
    brickHealth: (row) => (row < 2 ? 2 : 1),
  },
  expert: {
    label: "Expert",
    rows: 6,
    ballSpeed: 5.5,
    brickHealth: (row) => (row < 2 ? 3 : row < 4 ? 2 : 1),
  },
};

// ── Colors ──

const BRICK_COLORS: Record<number, string> = {
  1: "#00ff41",
  2: "#009926",
  3: "#006619",
};

const BRICK_HIT_COLORS: Record<string, string> = {
  "3_3": "#006619",
  "3_2": "#009926",
  "3_1": "#00cc33",
  "2_2": "#009926",
  "2_1": "#00cc33",
  "1_1": "#00ff41",
};

// ── Types ──

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  alive: boolean;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface GameStateData {
  bricks: Brick[];
  ball: Ball;
  paddle: Paddle;
  lives: number;
  score: number;
  status: "idle" | "playing" | "won" | "lost";
}

// ── Canvas dimensions ──

const CANVAS_W = 480;
const CANVAS_H = 600;
const BRICK_PADDING = 4;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 10;
const BRICK_COLS = 10;
const BRICK_H = 20;
const PADDLE_W = 80;
const PADDLE_H = 12;
const BALL_RADIUS = 7;

function createBricks(config: DifficultyConfig): Brick[] {
  const bricks: Brick[] = [];
  const brickW =
    (CANVAS_W - BRICK_OFFSET_LEFT * 2 - BRICK_PADDING * (BRICK_COLS - 1)) /
    BRICK_COLS;

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const health = config.brickHealth(row);
      bricks.push({
        x: BRICK_OFFSET_LEFT + col * (brickW + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + row * (BRICK_H + BRICK_PADDING),
        w: brickW,
        h: BRICK_H,
        health,
        maxHealth: health,
        alive: true,
      });
    }
  }
  return bricks;
}

function createInitialState(config: DifficultyConfig): GameStateData {
  return {
    bricks: createBricks(config),
    ball: {
      x: CANVAS_W / 2,
      y: CANVAS_H - 50,
      dx: config.ballSpeed * (Math.random() > 0.5 ? 1 : -1) * 0.7,
      dy: -config.ballSpeed,
      radius: BALL_RADIUS,
    },
    paddle: {
      x: CANVAS_W / 2 - PADDLE_W / 2,
      y: CANVAS_H - 30,
      w: PADDLE_W,
      h: PADDLE_H,
    },
    lives: 3,
    score: 0,
    status: "idle",
  };
}

// ── Main component ──

export default function Breakout() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameStateData>(createInitialState(DIFFICULTIES[difficulty]));
  const animRef = useRef<number>(0);
  const [displayState, setDisplayState] = useState<{
    lives: number;
    score: number;
    status: string;
  }>({ lives: 3, score: 0, status: "idle" });

  // Track paddle target position from mouse/touch
  const paddleTargetRef = useRef<number | null>(null);

  const config = DIFFICULTIES[difficulty];

  // Reset game
  const resetGame = useCallback(
    (diff?: Difficulty) => {
      const cfg = DIFFICULTIES[diff || difficulty];
      stateRef.current = createInitialState(cfg);
      setDisplayState({ lives: 3, score: 0, status: "idle" });
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

  // Start the game on click/tap
  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "idle") {
      s.status = "playing";
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    }
  }, []);

  // Get canvas-relative X from mouse/touch
  const getCanvasX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    return (clientX - rect.left) * scaleX;
  }, []);

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = getCanvasX(e.clientX);
      if (x !== null) paddleTargetRef.current = x;
    };

    const handleClick = () => startGame();

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [getCanvasX, startGame]);

  // Touch handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      startGame();
      if (e.touches.length > 0) {
        const x = getCanvasX(e.touches[0].clientX);
        if (x !== null) paddleTargetRef.current = x;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const x = getCanvasX(e.touches[0].clientX);
        if (x !== null) paddleTargetRef.current = x;
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", (e) => e.preventDefault(), {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [getCanvasX, startGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = stateRef.current;

      // Update paddle position
      if (paddleTargetRef.current !== null) {
        s.paddle.x = Math.max(
          0,
          Math.min(CANVAS_W - s.paddle.w, paddleTargetRef.current - s.paddle.w / 2)
        );
      }

      // Physics
      if (s.status === "playing") {
        // Move ball
        s.ball.x += s.ball.dx;
        s.ball.y += s.ball.dy;

        // Wall collisions (left/right)
        if (s.ball.x - s.ball.radius <= 0) {
          s.ball.x = s.ball.radius;
          s.ball.dx = Math.abs(s.ball.dx);
        } else if (s.ball.x + s.ball.radius >= CANVAS_W) {
          s.ball.x = CANVAS_W - s.ball.radius;
          s.ball.dx = -Math.abs(s.ball.dx);
        }

        // Top wall
        if (s.ball.y - s.ball.radius <= 0) {
          s.ball.y = s.ball.radius;
          s.ball.dy = Math.abs(s.ball.dy);
        }

        // Paddle collision
        if (
          s.ball.dy > 0 &&
          s.ball.y + s.ball.radius >= s.paddle.y &&
          s.ball.y + s.ball.radius <= s.paddle.y + s.paddle.h + 4 &&
          s.ball.x >= s.paddle.x &&
          s.ball.x <= s.paddle.x + s.paddle.w
        ) {
          s.ball.y = s.paddle.y - s.ball.radius;
          s.ball.dy = -Math.abs(s.ball.dy);

          // Angle based on where ball hits paddle
          const hitPos = (s.ball.x - s.paddle.x) / s.paddle.w;
          const angle = (hitPos - 0.5) * Math.PI * 0.7;
          const speed = Math.sqrt(s.ball.dx ** 2 + s.ball.dy ** 2);
          s.ball.dx = speed * Math.sin(angle);
          s.ball.dy = -speed * Math.cos(angle);
        }

        // Ball falls below paddle
        if (s.ball.y - s.ball.radius > CANVAS_H) {
          s.lives--;
          if (s.lives <= 0) {
            s.status = "lost";
            setDisplayState({ lives: 0, score: s.score, status: "lost" });
          } else {
            // Reset ball position
            const cfg = DIFFICULTIES[difficulty];
            s.ball.x = CANVAS_W / 2;
            s.ball.y = CANVAS_H - 50;
            s.ball.dx = cfg.ballSpeed * (Math.random() > 0.5 ? 1 : -1) * 0.7;
            s.ball.dy = -cfg.ballSpeed;
            s.status = "idle";
            setDisplayState({
              lives: s.lives,
              score: s.score,
              status: "idle",
            });
          }
        }

        // Brick collisions
        for (const brick of s.bricks) {
          if (!brick.alive) continue;

          // Check ball-rect collision
          const closestX = Math.max(brick.x, Math.min(s.ball.x, brick.x + brick.w));
          const closestY = Math.max(brick.y, Math.min(s.ball.y, brick.y + brick.h));
          const distX = s.ball.x - closestX;
          const distY = s.ball.y - closestY;
          const dist = Math.sqrt(distX * distX + distY * distY);

          if (dist <= s.ball.radius) {
            brick.health--;
            if (brick.health <= 0) {
              brick.alive = false;
              s.score += brick.maxHealth * 10;
            } else {
              s.score += 5;
            }

            // Determine bounce direction
            const overlapX =
              s.ball.radius -
              Math.abs(s.ball.x - (brick.x + brick.w / 2)) +
              brick.w / 2;
            const overlapY =
              s.ball.radius -
              Math.abs(s.ball.y - (brick.y + brick.h / 2)) +
              brick.h / 2;

            if (overlapX < overlapY) {
              s.ball.dx = -s.ball.dx;
            } else {
              s.ball.dy = -s.ball.dy;
            }

            // Push ball outside of brick
            s.ball.x += s.ball.dx * 0.5;
            s.ball.y += s.ball.dy * 0.5;

            setDisplayState((prev) => ({
              ...prev,
              score: s.score,
            }));
            break; // Only one brick per frame
          }
        }

        // Check win
        if (s.bricks.every((b) => !b.alive)) {
          s.status = "won";
          setDisplayState({ lives: s.lives, score: s.score, status: "won" });
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Bricks
      for (const brick of s.bricks) {
        if (!brick.alive) continue;
        const colorKey = `${brick.maxHealth}_${brick.health}`;
        ctx.fillStyle =
          BRICK_HIT_COLORS[colorKey] || BRICK_COLORS[brick.health] || "#00ff41";
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);

        // Border
        ctx.strokeStyle = "#0a0a0a";
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);

        // Health indicator for multi-hit bricks
        if (brick.maxHealth > 1) {
          ctx.fillStyle = brick.health > 1 ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.2)";
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            String(brick.health),
            brick.x + brick.w / 2,
            brick.y + brick.h / 2
          );
        }
      }

      // Paddle
      ctx.fillStyle = "#00ff41";
      ctx.shadowColor = "#00ff41";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(s.paddle.x, s.paddle.y, s.paddle.w, s.paddle.h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#00ff41";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, s.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Idle overlay
      if (s.status === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Click or Tap to Launch", CANVAS_W / 2, CANVAS_H / 2);
      }

      // Won overlay
      if (s.status === "won") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("YOU WIN!", CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = "16px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 15);
        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText("Click to play again", CANVAS_W / 2, CANVAS_H / 2 + 45);
      }

      // Lost overlay
      if (s.status === "lost") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = "16px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 15);
        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText("Click to try again", CANVAS_W / 2, CANVAS_H / 2 + 45);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [difficulty]);

  // Click on canvas when game over to restart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleRestart = () => {
      const s = stateRef.current;
      if (s.status === "won" || s.status === "lost") {
        resetGame();
      }
    };

    canvas.addEventListener("click", handleRestart);
    return () => canvas.removeEventListener("click", handleRestart);
  }, [resetGame]);

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
          <span className="text-xs text-gray-400">Lives:</span>
          <span className="font-mono text-sm font-bold text-red-500">
            {displayState.lives}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Score:</span>
          <span className="font-mono text-sm font-bold text-wojak-green">
            {displayState.score}
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
          Move mouse to control paddle
        </span>
        <span className="sm:hidden">Drag to move paddle</span>
      </div>
    </div>
  );
}
