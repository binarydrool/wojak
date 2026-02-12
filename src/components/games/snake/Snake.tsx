"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Difficulty config ──

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface DifficultyConfig {
  label: string;
  speed: number; // ms between snake moves
  gridCells: number; // cells per row/column
  obstacles: boolean; // whether obstacles spawn
  obstacleInterval: number; // spawn obstacle every N food eaten
  obstacleCount: number; // how many obstacles per spawn
  foodTimer: number; // seconds before food disappears (0 = never)
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    speed: 150,
    gridCells: 20,
    obstacles: false,
    obstacleInterval: 0,
    obstacleCount: 0,
    foodTimer: 0,
  },
  medium: {
    label: "Medium",
    speed: 100,
    gridCells: 20,
    obstacles: false,
    obstacleInterval: 0,
    obstacleCount: 0,
    foodTimer: 0,
  },
  hard: {
    label: "Hard",
    speed: 75,
    gridCells: 20,
    obstacles: true,
    obstacleInterval: 5,
    obstacleCount: 1,
    foodTimer: 0,
  },
  expert: {
    label: "Expert",
    speed: 55,
    gridCells: 15,
    obstacles: true,
    obstacleInterval: 3,
    obstacleCount: 2,
    foodTimer: 7,
  },
};

// ── Types ──

interface Point {
  x: number;
  y: number;
}

type Direction = "up" | "down" | "left" | "right";

interface GameStateData {
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point;
  foodSpawnTime: number;
  obstacles: Point[];
  score: number;
  status: "idle" | "playing" | "gameover";
  lastMoveTime: number;
  foodEatenSinceObstacle: number;
}

// ── Canvas dimensions ──

const CANVAS_SIZE = 600;

// ── Colors ──

const SNAKE_COLOR = "#00ff41";
const FOOD_COLOR = "#ff4444";
const FOOD_IMG_SRC = "/images/Wojak_white.png";
const OBSTACLE_COLOR = "#555555";
const GRID_COLOR = "rgba(255, 255, 255, 0.03)";

// ── Helpers ──

function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}

function randomFoodPosition(
  gridCells: number,
  snake: Point[],
  obstacles: Point[]
): Point {
  const occupied = new Set(
    [...snake, ...obstacles].map(pointKey)
  );
  let pos: Point;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * gridCells),
      y: Math.floor(Math.random() * gridCells),
    };
    attempts++;
    if (attempts > 1000) break;
  } while (occupied.has(pointKey(pos)));
  return pos;
}

function createInitialState(config: DifficultyConfig): GameStateData {
  const mid = Math.floor(config.gridCells / 2);
  const snake: Point[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    snake,
    direction: "right",
    nextDirection: "right",
    food: randomFoodPosition(config.gridCells, snake, []),
    foodSpawnTime: Date.now(),
    obstacles: [],
    score: 0,
    status: "idle",
    lastMoveTime: 0,
    foodEatenSinceObstacle: 0,
  };
}

function oppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
  }
}

// Given a snake head (grid coords) and a pointer position (canvas pixels),
// return the best cardinal direction to move toward the pointer.
function directionTowardPointer(
  head: Point,
  pointer: { x: number; y: number },
  cellSize: number
): Direction {
  const hx = head.x * cellSize + cellSize / 2;
  const hy = head.y * cellSize + cellSize / 2;
  const dx = pointer.x - hx;
  const dy = pointer.y - hy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "down" : "up";
}

// ── Main component ──

export default function Snake() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameStateData>(
    createInitialState(DIFFICULTIES[difficulty])
  );
  const animRef = useRef<number>(0);
  const [displayState, setDisplayState] = useState<{
    score: number;
    highScore: number;
    status: string;
  }>({ score: 0, highScore: 0, status: "idle" });

  const highScoresRef = useRef<Record<Difficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  });

  // Pointer position in canvas-pixel coordinates (mouse or touch)
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);

  // Food image
  const foodImgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = FOOD_IMG_SRC;
    foodImgRef.current = img;
  }, []);

  // Reset game
  const resetGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff || difficulty;
      const cfg = DIFFICULTIES[d];
      stateRef.current = createInitialState(cfg);
      setDisplayState({
        score: 0,
        highScore: highScoresRef.current[d],
        status: "idle",
      });
    },
    [difficulty]
  );

  // Handle difficulty change
  const handleDifficultyChange = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    cancelAnimationFrame(animRef.current);
    stateRef.current = createInitialState(DIFFICULTIES[diff]);
    setDisplayState({
      score: 0,
      highScore: highScoresRef.current[diff],
      status: "idle",
    });
  }, []);

  // Start game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "idle") {
      s.status = "playing";
      s.lastMoveTime = performance.now();
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    }
  }, []);

  // Convert a client coordinate to canvas-pixel coordinate
  const toCanvasPos = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  // Keyboard controls (WASD / arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;

      if (s.status === "idle") {
        if (
          [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "w",
            "a",
            "s",
            "d",
            "W",
            "A",
            "S",
            "D",
          ].includes(e.key)
        ) {
          // Clear pointer so keyboard takes over cleanly
          pointerPosRef.current = null;
          startGame();
        }
      }

      if (s.status !== "playing" && s.status !== "idle") return;

      let newDir: Direction | null = null;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newDir = "up";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newDir = "down";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newDir = "left";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newDir = "right";
          break;
      }

      if (newDir && newDir !== oppositeDirection(s.direction)) {
        e.preventDefault();
        // Clear pointer so keyboard takes over
        pointerPosRef.current = null;
        s.nextDirection = newDir;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startGame]);

  // Mouse handlers — move on canvas steers snake, leave clears
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pos = toCanvasPos(e.clientX, e.clientY);
      if (pos) pointerPosRef.current = pos;
    };

    const handleMouseLeave = () => {
      pointerPosRef.current = null;
    };

    const handleClick = () => {
      const s = stateRef.current;
      if (s.status === "gameover") {
        resetGame();
      } else if (s.status === "idle") {
        startGame();
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);
    };
  }, [toCanvasPos, startGame, resetGame]);

  // Touch handlers — hold and drag to steer, lift to clear
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const pos = toCanvasPos(
          e.touches[0].clientX,
          e.touches[0].clientY
        );
        if (pos) pointerPosRef.current = pos;
      }

      const s = stateRef.current;
      if (s.status === "idle") {
        startGame();
      } else if (s.status === "gameover") {
        resetGame();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const pos = toCanvasPos(
          e.touches[0].clientX,
          e.touches[0].clientY
        );
        if (pos) pointerPosRef.current = pos;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      // Keep last known position so snake doesn't lose direction on lift
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [toCanvasPos, startGame, resetGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = DIFFICULTIES[difficulty];
    const cellSize = CANVAS_SIZE / cfg.gridCells;

    const loop = (timestamp: number) => {
      const s = stateRef.current;

      // Update logic
      if (
        s.status === "playing" &&
        timestamp - s.lastMoveTime >= cfg.speed
      ) {
        s.lastMoveTime = timestamp;

        // If pointer is active, derive direction from it
        if (pointerPosRef.current) {
          const desired = directionTowardPointer(
            s.snake[0],
            pointerPosRef.current,
            cellSize
          );
          if (desired !== oppositeDirection(s.direction)) {
            s.nextDirection = desired;
          }
        }
        s.direction = s.nextDirection;

        // Calculate new head position
        const head = s.snake[0];
        let newHead: Point;

        switch (s.direction) {
          case "up":
            newHead = { x: head.x, y: head.y - 1 };
            break;
          case "down":
            newHead = { x: head.x, y: head.y + 1 };
            break;
          case "left":
            newHead = { x: head.x - 1, y: head.y };
            break;
          case "right":
            newHead = { x: head.x + 1, y: head.y };
            break;
        }

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= cfg.gridCells ||
          newHead.y < 0 ||
          newHead.y >= cfg.gridCells
        ) {
          s.status = "gameover";
          if (s.score > highScoresRef.current[difficulty]) {
            highScoresRef.current[difficulty] = s.score;
          }
          setDisplayState({
            score: s.score,
            highScore: highScoresRef.current[difficulty],
            status: "gameover",
          });
        }
        // Check obstacle collision
        else if (
          s.obstacles.some(
            (obs) => obs.x === newHead.x && obs.y === newHead.y
          )
        ) {
          s.status = "gameover";
          if (s.score > highScoresRef.current[difficulty]) {
            highScoresRef.current[difficulty] = s.score;
          }
          setDisplayState({
            score: s.score,
            highScore: highScoresRef.current[difficulty],
            status: "gameover",
          });
        } else {
          // Will eat food?
          const ateFood =
            newHead.x === s.food.x && newHead.y === s.food.y;

          // Check self collision (exclude tail if not eating, since it moves)
          const checkBody = ateFood
            ? s.snake
            : s.snake.slice(0, -1);

          if (
            checkBody.some(
              (seg) => seg.x === newHead.x && seg.y === newHead.y
            )
          ) {
            s.status = "gameover";
            if (s.score > highScoresRef.current[difficulty]) {
              highScoresRef.current[difficulty] = s.score;
            }
            setDisplayState({
              score: s.score,
              highScore: highScoresRef.current[difficulty],
              status: "gameover",
            });
          } else {
            // Move snake
            s.snake.unshift(newHead);

            if (ateFood) {
              s.score += 10;
              s.foodEatenSinceObstacle++;

              // Spawn obstacles on hard/expert
              if (
                cfg.obstacles &&
                cfg.obstacleInterval > 0 &&
                s.foodEatenSinceObstacle >= cfg.obstacleInterval
              ) {
                s.foodEatenSinceObstacle = 0;
                for (let i = 0; i < cfg.obstacleCount; i++) {
                  const obsPos = randomFoodPosition(
                    cfg.gridCells,
                    s.snake,
                    [...s.obstacles, s.food]
                  );
                  s.obstacles.push(obsPos);
                }
              }

              // Spawn new food
              s.food = randomFoodPosition(
                cfg.gridCells,
                s.snake,
                s.obstacles
              );
              s.foodSpawnTime = Date.now();

              setDisplayState((prev) => ({
                ...prev,
                score: s.score,
              }));
            } else {
              s.snake.pop();
            }

            // Expert mode: food timer
            if (cfg.foodTimer > 0) {
              const elapsed = (Date.now() - s.foodSpawnTime) / 1000;
              if (elapsed >= cfg.foodTimer) {
                s.food = randomFoodPosition(
                  cfg.gridCells,
                  s.snake,
                  s.obstacles
                );
                s.foodSpawnTime = Date.now();
              }
            }
          }
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Grid lines
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let i = 0; i <= cfg.gridCells; i++) {
        const pos = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(CANVAS_SIZE, pos);
        ctx.stroke();
      }

      // Obstacles
      for (const obs of s.obstacles) {
        ctx.fillStyle = OBSTACLE_COLOR;
        ctx.fillRect(
          obs.x * cellSize + 1,
          obs.y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );
        // X pattern on obstacles
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        const ox = obs.x * cellSize;
        const oy = obs.y * cellSize;
        ctx.beginPath();
        ctx.moveTo(ox + 4, oy + 4);
        ctx.lineTo(ox + cellSize - 4, oy + cellSize - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ox + cellSize - 4, oy + 4);
        ctx.lineTo(ox + 4, oy + cellSize - 4);
        ctx.stroke();
      }

      // Food
      let foodAlpha = 1;
      if (cfg.foodTimer > 0) {
        const elapsed = (Date.now() - s.foodSpawnTime) / 1000;
        const remaining = cfg.foodTimer - elapsed;
        if (remaining < 3) {
          foodAlpha = 0.3 + 0.7 * Math.abs(Math.sin(elapsed * 4));
        }
      }
      ctx.globalAlpha = foodAlpha;
      if (foodImgRef.current && foodImgRef.current.complete && foodImgRef.current.naturalWidth > 0) {
        const fx = s.food.x * cellSize + 1;
        const fy = s.food.y * cellSize + 1;
        const fs = cellSize - 2;
        ctx.drawImage(foodImgRef.current, fx, fy, fs, fs);
      } else {
        ctx.fillStyle = FOOD_COLOR;
        ctx.shadowColor = FOOD_COLOR;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(
          s.food.x * cellSize + cellSize / 2,
          s.food.y * cellSize + cellSize / 2,
          cellSize / 2 - 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Snake (draw tail to head so head is on top)
      for (let i = s.snake.length - 1; i >= 0; i--) {
        const seg = s.snake[i];
        const isHead = i === 0;

        if (isHead) {
          ctx.fillStyle = SNAKE_COLOR;
          ctx.shadowColor = SNAKE_COLOR;
          ctx.shadowBlur = 10;
        } else {
          const t = i / s.snake.length;
          const g = Math.floor(255 * (1 - t * 0.5));
          ctx.fillStyle = `rgb(0, ${g}, ${Math.floor(g * 0.25)})`;
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.roundRect(
          seg.x * cellSize + 1,
          seg.y * cellSize + 1,
          cellSize - 2,
          cellSize - 2,
          isHead ? 4 : 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Idle overlay
      if (s.status === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Click or Tap to Start",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 - 10
        );
        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText(
          "Mouse / Touch or WASD to steer",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 20
        );
      }

      // Game over overlay
      if (s.status === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
        ctx.font = "16px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(
          `Score: ${s.score}`,
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 5
        );
        ctx.fillStyle = "#00ff41";
        ctx.fillText(
          `High Score: ${highScoresRef.current[difficulty]}`,
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 30
        );
        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText(
          "Click or Tap to play again",
          CANVAS_SIZE / 2,
          CANVAS_SIZE / 2 + 60
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
          <span className="text-xs text-gray-400">High Score:</span>
          <span className="font-mono text-sm font-bold text-yellow-400">
            {displayState.highScore}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="border-2 border-wojak-border rounded-lg cursor-pointer"
        style={{
          width: "min(85vw, 480px)",
          height: "auto",
          aspectRatio: "1 / 1",
          touchAction: "none",
        }}
      />

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Move mouse to steer — WASD / Arrow keys also work
        </span>
        <span className="sm:hidden">Touch &amp; drag to steer</span>
      </div>
    </div>
  );
}
