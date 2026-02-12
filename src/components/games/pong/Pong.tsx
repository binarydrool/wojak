"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Difficulty config ──

type Difficulty = "beginner" | "advanced" | "expert" | "master";

interface DifficultyConfig {
  label: string;
  ballSpeed: number;
  aiSpeed: number;       // max px AI paddle moves per frame
  aiReaction: number;    // 0-1, how accurately AI tracks the ball (1 = perfect)
  aiErrorMargin: number; // px of intentional offset from ball center
  pepeImg: string;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    label: "Beginner",
    ballSpeed: 3,
    aiSpeed: 2.2,
    aiReaction: 0.6,
    aiErrorMargin: 40,
    pepeImg: "/images/pepe1.jpg",
  },
  advanced: {
    label: "Advanced",
    ballSpeed: 4,
    aiSpeed: 3,
    aiReaction: 0.75,
    aiErrorMargin: 25,
    pepeImg: "/images/pepe2.jpg",
  },
  expert: {
    label: "Expert",
    ballSpeed: 5,
    aiSpeed: 4,
    aiReaction: 0.88,
    aiErrorMargin: 12,
    pepeImg: "/images/pepe3.jpg",
  },
  master: {
    label: "Master",
    ballSpeed: 5.5,
    aiSpeed: 4.8,
    aiReaction: 0.95,
    aiErrorMargin: 5,
    pepeImg: "/images/pepe4.jpg",
  },
};

const WOJAK_AVATAR = "/images/favicon.jpg";
const WIN_SCORE = 5;

// ── Canvas dimensions ──

const CANVAS_W = 600;
const CANVAS_H = 400;
const PADDLE_W = 12;
const PADDLE_H = 70;
const PADDLE_MARGIN = 20;
const BALL_RADIUS = 7;

// ── Game state ──

interface GameStateData {
  ballX: number;
  ballY: number;
  ballDX: number;
  ballDY: number;
  playerY: number;  // top of player paddle
  aiY: number;      // top of AI paddle
  playerScore: number;
  aiScore: number;
  status: "idle" | "playing" | "scored" | "won" | "lost";
  lastScorer: "player" | "ai" | null;
  aiTargetY: number;       // AI's current target Y (with error)
  aiDecisionTimer: number; // frames until AI recalculates target
}

function createInitialState(config: DifficultyConfig): GameStateData {
  const angle = (Math.random() * 0.8 - 0.4); // -0.4 to 0.4 radians
  const dir = Math.random() > 0.5 ? 1 : -1;
  return {
    ballX: CANVAS_W / 2,
    ballY: CANVAS_H / 2,
    ballDX: config.ballSpeed * dir * Math.cos(angle),
    ballDY: config.ballSpeed * Math.sin(angle),
    playerY: CANVAS_H / 2 - PADDLE_H / 2,
    aiY: CANVAS_H / 2 - PADDLE_H / 2,
    playerScore: 0,
    aiScore: 0,
    status: "idle",
    lastScorer: null,
    aiTargetY: CANVAS_H / 2,
    aiDecisionTimer: 0,
  };
}

function resetBall(state: GameStateData, config: DifficultyConfig, serveToward: "player" | "ai"): void {
  const angle = (Math.random() * 0.8 - 0.4);
  const dir = serveToward === "ai" ? 1 : -1;
  state.ballX = CANVAS_W / 2;
  state.ballY = CANVAS_H / 2;
  state.ballDX = config.ballSpeed * dir * Math.cos(angle);
  state.ballDY = config.ballSpeed * Math.sin(angle);
  state.aiTargetY = CANVAS_H / 2;
  state.aiDecisionTimer = 0;
}

// ── Main component ──

export default function Pong() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameStateData>(createInitialState(DIFFICULTIES[difficulty]));
  const animRef = useRef<number>(0);
  const [displayState, setDisplayState] = useState<{
    playerScore: number;
    aiScore: number;
    status: string;
  }>({ playerScore: 0, aiScore: 0, status: "idle" });

  // Track player paddle target from mouse/touch
  const paddleTargetRef = useRef<number | null>(null);

  const config = DIFFICULTIES[difficulty];

  // Reset game
  const resetGame = useCallback(
    (diff?: Difficulty) => {
      const cfg = DIFFICULTIES[diff || difficulty];
      stateRef.current = createInitialState(cfg);
      setDisplayState({ playerScore: 0, aiScore: 0, status: "idle" });
    },
    [difficulty]
  );

  // Handle difficulty change
  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      cancelAnimationFrame(animRef.current);
      const cfg = DIFFICULTIES[diff];
      stateRef.current = createInitialState(cfg);
      setDisplayState({ playerScore: 0, aiScore: 0, status: "idle" });
    },
    []
  );

  // Start game on click/tap
  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "idle" || s.status === "scored") {
      s.status = "playing";
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    }
  }, []);

  // Get canvas-relative Y from mouse/touch
  const getCanvasY = useCallback((clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_H / rect.height;
    return (clientY - rect.top) * scaleY;
  }, []);

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const y = getCanvasY(e.clientY);
      if (y !== null) paddleTargetRef.current = y;
    };

    const handleClick = () => startGame();

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [getCanvasY, startGame]);

  // Touch handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      startGame();
      if (e.touches.length > 0) {
        const y = getCanvasY(e.touches[0].clientY);
        if (y !== null) paddleTargetRef.current = y;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const y = getCanvasY(e.touches[0].clientY);
        if (y !== null) paddleTargetRef.current = y;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [getCanvasY, startGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = DIFFICULTIES[difficulty];

    const loop = () => {
      const s = stateRef.current;

      // ── Update player paddle ──
      if (paddleTargetRef.current !== null) {
        s.playerY = Math.max(
          0,
          Math.min(CANVAS_H - PADDLE_H, paddleTargetRef.current - PADDLE_H / 2)
        );
      }

      if (s.status === "playing") {
        // ── AI paddle logic ──
        s.aiDecisionTimer--;
        if (s.aiDecisionTimer <= 0) {
          // Recalculate AI target with some error
          const ballCenterY = s.ballY;
          const error = (Math.random() - 0.5) * 2 * cfg.aiErrorMargin;
          s.aiTargetY = ballCenterY + error;
          // Recalculate every 8-20 frames depending on difficulty
          s.aiDecisionTimer = Math.floor(8 + (1 - cfg.aiReaction) * 30);
        }

        // Move AI paddle toward target
        const aiPaddleCenter = s.aiY + PADDLE_H / 2;
        const diff = s.aiTargetY - aiPaddleCenter;

        // Only move if ball is heading toward AI side, or close enough
        const shouldTrack = s.ballDX > 0 || s.ballX > CANVAS_W * 0.4;

        if (shouldTrack) {
          if (Math.abs(diff) > 2) {
            const move = Math.sign(diff) * Math.min(Math.abs(diff), cfg.aiSpeed) * cfg.aiReaction;
            s.aiY = Math.max(0, Math.min(CANVAS_H - PADDLE_H, s.aiY + move));
          }
        } else {
          // Drift toward center when ball is heading away
          const centerDiff = CANVAS_H / 2 - aiPaddleCenter;
          if (Math.abs(centerDiff) > 5) {
            s.aiY += Math.sign(centerDiff) * cfg.aiSpeed * 0.3;
            s.aiY = Math.max(0, Math.min(CANVAS_H - PADDLE_H, s.aiY));
          }
        }

        // ── Move ball ──
        s.ballX += s.ballDX;
        s.ballY += s.ballDY;

        // Top/bottom wall bounce
        if (s.ballY - BALL_RADIUS <= 0) {
          s.ballY = BALL_RADIUS;
          s.ballDY = Math.abs(s.ballDY);
        } else if (s.ballY + BALL_RADIUS >= CANVAS_H) {
          s.ballY = CANVAS_H - BALL_RADIUS;
          s.ballDY = -Math.abs(s.ballDY);
        }

        // Player paddle collision (left side)
        const playerPaddleRight = PADDLE_MARGIN + PADDLE_W;
        if (
          s.ballDX < 0 &&
          s.ballX - BALL_RADIUS <= playerPaddleRight &&
          s.ballX - BALL_RADIUS >= PADDLE_MARGIN - BALL_RADIUS &&
          s.ballY >= s.playerY &&
          s.ballY <= s.playerY + PADDLE_H
        ) {
          s.ballX = playerPaddleRight + BALL_RADIUS;
          // Angle based on where ball hits paddle
          const hitPos = (s.ballY - s.playerY) / PADDLE_H; // 0-1
          const angle = (hitPos - 0.5) * Math.PI * 0.6; // +-54 degrees
          const speed = Math.sqrt(s.ballDX ** 2 + s.ballDY ** 2) * 1.02; // slight speed increase
          const cappedSpeed = Math.min(speed, cfg.ballSpeed * 1.8);
          s.ballDX = cappedSpeed * Math.cos(angle);
          s.ballDY = cappedSpeed * Math.sin(angle);
        }

        // AI paddle collision (right side)
        const aiPaddleLeft = CANVAS_W - PADDLE_MARGIN - PADDLE_W;
        if (
          s.ballDX > 0 &&
          s.ballX + BALL_RADIUS >= aiPaddleLeft &&
          s.ballX + BALL_RADIUS <= CANVAS_W - PADDLE_MARGIN + BALL_RADIUS &&
          s.ballY >= s.aiY &&
          s.ballY <= s.aiY + PADDLE_H
        ) {
          s.ballX = aiPaddleLeft - BALL_RADIUS;
          const hitPos = (s.ballY - s.aiY) / PADDLE_H;
          const angle = (hitPos - 0.5) * Math.PI * 0.6;
          const speed = Math.sqrt(s.ballDX ** 2 + s.ballDY ** 2) * 1.02;
          const cappedSpeed = Math.min(speed, cfg.ballSpeed * 1.8);
          s.ballDX = -cappedSpeed * Math.cos(angle);
          s.ballDY = cappedSpeed * Math.sin(angle);
        }

        // Scoring: ball passes left edge
        if (s.ballX + BALL_RADIUS < 0) {
          s.aiScore++;
          s.lastScorer = "ai";
          if (s.aiScore >= WIN_SCORE) {
            s.status = "lost";
            setDisplayState({ playerScore: s.playerScore, aiScore: s.aiScore, status: "lost" });
          } else {
            s.status = "scored";
            resetBall(s, cfg, "ai"); // serve toward the scorer's opponent? Serve toward player who was scored on
            setDisplayState({ playerScore: s.playerScore, aiScore: s.aiScore, status: "scored" });
          }
        }

        // Scoring: ball passes right edge
        if (s.ballX - BALL_RADIUS > CANVAS_W) {
          s.playerScore++;
          s.lastScorer = "player";
          if (s.playerScore >= WIN_SCORE) {
            s.status = "won";
            setDisplayState({ playerScore: s.playerScore, aiScore: s.aiScore, status: "won" });
          } else {
            s.status = "scored";
            resetBall(s, cfg, "player");
            setDisplayState({ playerScore: s.playerScore, aiScore: s.aiScore, status: "scored" });
          }
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Center line (dashed)
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2, 0);
      ctx.lineTo(CANVAS_W / 2, CANVAS_H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Score display on canvas
      ctx.font = "bold 48px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillText(String(s.playerScore), CANVAS_W / 2 - 60, 20);
      ctx.fillText(String(s.aiScore), CANVAS_W / 2 + 60, 20);

      // Player paddle (left)
      ctx.fillStyle = "#00ff41";
      ctx.shadowColor = "#00ff41";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(PADDLE_MARGIN, s.playerY, PADDLE_W, PADDLE_H, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // AI paddle (right)
      ctx.fillStyle = "#00ff41";
      ctx.shadowColor = "#00ff41";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(CANVAS_W - PADDLE_MARGIN - PADDLE_W, s.aiY, PADDLE_W, PADDLE_H, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = "#00ff41";
      ctx.shadowColor = "#00ff41";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Idle / scored overlay
      if (s.status === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Click or Tap to Start", CANVAS_W / 2, CANVAS_H / 2);
        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText("First to 5 wins", CANVAS_W / 2, CANVAS_H / 2 + 30);
      }

      if (s.status === "scored") {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 18px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const scorer = s.lastScorer === "player" ? "WOJAK" : "PEPE";
        ctx.fillText(`${scorer} scores!`, CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText("Click or Tap to continue", CANVAS_W / 2, CANVAS_H / 2 + 20);
      }

      // Won overlay
      if (s.status === "won") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("WOJAK WINS!", CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = "16px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${s.playerScore} - ${s.aiScore}`, CANVAS_W / 2, CANVAS_H / 2 + 15);
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
        ctx.fillText("PEPE WINS!", CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = "16px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${s.playerScore} - ${s.aiScore}`, CANVAS_W / 2, CANVAS_H / 2 + 15);
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

  const currentPepe = DIFFICULTIES[difficulty];

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

      {/* Player info row */}
      <div className="flex items-center justify-between w-full gap-2" style={{ maxWidth: "min(85vw, 600px)" }}>
        {/* WOJAK (left / player) */}
        <div
          className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
            displayState.status === "won"
              ? "bg-wojak-green/10 border border-wojak-green/30"
              : "bg-wojak-card/50"
          }`}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
            <img
              src={WOJAK_AVATAR}
              alt="WOJAK"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <span className="text-sm font-bold text-gray-300">WOJAK</span>
          <span className="font-mono text-lg font-bold text-wojak-green">{displayState.playerScore}</span>
        </div>

        <span className="text-gray-500 text-sm font-mono">VS</span>

        {/* PEPE (right / AI) */}
        <div
          className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
            displayState.status === "lost"
              ? "bg-red-500/10 border border-red-500/30"
              : "bg-wojak-card/50"
          }`}
        >
          <span className="font-mono text-lg font-bold text-red-400">{displayState.aiScore}</span>
          <span className="text-sm font-bold text-gray-300">PEPE</span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
            <img
              src={currentPepe.pepeImg}
              alt="PEPE"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="border-2 border-wojak-border rounded-lg cursor-pointer"
        style={{
          width: "min(85vw, 600px)",
          height: "auto",
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
          touchAction: "none",
        }}
      />

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Move mouse up/down to control your paddle
        </span>
        <span className="sm:hidden">Drag up/down to move paddle</span>
      </div>
    </div>
  );
}
