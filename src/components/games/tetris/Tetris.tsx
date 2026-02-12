"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Difficulty config ──

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface DifficultyConfig {
  label: string;
  initialSpeed: number; // ms between auto-drops
  speedDecrease: number; // ms decrease per level
  minSpeed: number; // fastest possible drop interval
  lockDelay: number; // ms before piece locks after landing
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    initialSpeed: 1000,
    speedDecrease: 50,
    minSpeed: 200,
    lockDelay: 500,
  },
  medium: {
    label: "Medium",
    initialSpeed: 600,
    speedDecrease: 50,
    minSpeed: 150,
    lockDelay: 500,
  },
  hard: {
    label: "Hard",
    initialSpeed: 400,
    speedDecrease: 40,
    minSpeed: 100,
    lockDelay: 400,
  },
  expert: {
    label: "Expert",
    initialSpeed: 250,
    speedDecrease: 30,
    minSpeed: 60,
    lockDelay: 200,
  },
};

// ── Piece definitions ──

// All pieces use the same green
const PIECE_COLORS: Record<number, string> = {
  1: "#00ff41", // I
  2: "#00ff41", // O
  3: "#00ff41", // T
  4: "#00ff41", // S
  5: "#00ff41", // Z
  6: "#00ff41", // J
  7: "#00ff41", // L
};

// Base shapes — I uses 4x4 box, O uses 2x2, rest use 3x3 for clean rotation
const PIECE_SHAPES: number[][][] = [
  [],                                          // 0 — unused
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],  // 1 — I
  [[1,1],[1,1]],                               // 2 — O
  [[0,1,0],[1,1,1],[0,0,0]],                   // 3 — T
  [[0,1,1],[1,1,0],[0,0,0]],                   // 4 — S
  [[1,1,0],[0,1,1],[0,0,0]],                   // 5 — Z
  [[1,0,0],[1,1,1],[0,0,0]],                   // 6 — J
  [[0,0,1],[1,1,1],[0,0,0]],                   // 7 — L
];

// ── Grid constants ──

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;
const GRID_W = COLS * CELL_SIZE; // 300
const SIDEBAR_W = 150;
const CANVAS_W = GRID_W + SIDEBAR_W; // 450
const CANVAS_H = ROWS * CELL_SIZE; // 600
const GRID_COLOR = "rgba(255, 255, 255, 0.05)";

// ── Helpers ──

function rotateClockwise(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const row: number[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      row.push(matrix[r][c]);
    }
    result.push(row);
  }
  return result;
}

function getRotation(type: number, rotation: number): number[][] {
  let shape = PIECE_SHAPES[type];
  for (let i = 0; i < rotation; i++) {
    shape = rotateClockwise(shape);
  }
  return shape;
}

function getOccupiedCells(
  shape: number[][],
  px: number,
  py: number
): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        cells.push({ r: py + r, c: px + c });
      }
    }
  }
  return cells;
}

function isValidPosition(
  grid: number[][],
  shape: number[][],
  px: number,
  py: number
): boolean {
  const cells = getOccupiedCells(shape, px, py);
  for (const cell of cells) {
    if (cell.c < 0 || cell.c >= COLS || cell.r >= ROWS) return false;
    if (cell.r >= 0 && grid[cell.r][cell.c] !== 0) return false;
  }
  return true;
}

function getDropSpeed(config: DifficultyConfig, level: number): number {
  return Math.max(
    config.minSpeed,
    config.initialSpeed - (level - 1) * config.speedDecrease
  );
}

function randomPieceType(): number {
  return Math.floor(Math.random() * 7) + 1;
}

// ── Types ──

interface Piece {
  type: number;
  shape: number[][];
  rotation: number;
  x: number;
  y: number;
}

interface GameStateData {
  grid: number[][];
  currentPiece: Piece | null;
  nextPieceType: number;
  score: number;
  lines: number;
  level: number;
  status: "idle" | "playing" | "gameover";
  lastDropTime: number;
  lockStartTime: number | null;
}

// ── State creation ──

function createEmptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function spawnPiece(type: number): Piece {
  const shape = PIECE_SHAPES[type];
  const x = Math.floor((COLS - shape[0].length) / 2);
  return {
    type,
    shape: shape.map((row) => [...row]),
    rotation: 0,
    x,
    y: type === 1 ? -1 : 0,
  };
}

function createInitialState(): GameStateData {
  return {
    grid: createEmptyGrid(),
    currentPiece: null,
    nextPieceType: randomPieceType(),
    score: 0,
    lines: 0,
    level: 1,
    status: "idle",
    lastDropTime: 0,
    lockStartTime: null,
  };
}

// ── Scoring ──

const LINE_SCORES: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

// ── Main component ──

export default function Tetris() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameStateData>(createInitialState());
  const animRef = useRef<number>(0);
  const [displayState, setDisplayState] = useState<{
    score: number;
    lines: number;
    level: number;
    status: string;
  }>({ score: 0, lines: 0, level: 1, status: "idle" });

  // Sync display state from game state
  const syncDisplay = useCallback((s: GameStateData) => {
    setDisplayState({
      score: s.score,
      lines: s.lines,
      level: s.level,
      status: s.status,
    });
  }, []);

  // Lock the current piece into the grid
  const lockPiece = useCallback(
    (s: GameStateData) => {
      if (!s.currentPiece) return;

      const cells = getOccupiedCells(
        s.currentPiece.shape,
        s.currentPiece.x,
        s.currentPiece.y
      );
      for (const cell of cells) {
        if (cell.r >= 0 && cell.r < ROWS && cell.c >= 0 && cell.c < COLS) {
          s.grid[cell.r][cell.c] = s.currentPiece.type;
        }
      }

      // Clear completed lines
      let linesCleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (s.grid[r].every((cell) => cell !== 0)) {
          s.grid.splice(r, 1);
          s.grid.unshift(Array(COLS).fill(0));
          linesCleared++;
          r++; // recheck this row since rows shifted down
        }
      }

      if (linesCleared > 0) {
        s.lines += linesCleared;
        s.score += (LINE_SCORES[linesCleared] || 0) * s.level;
        s.level = Math.floor(s.lines / 10) + 1;
      }

      // Spawn next piece
      const nextPiece = spawnPiece(s.nextPieceType);
      s.nextPieceType = randomPieceType();

      if (!isValidPosition(s.grid, nextPiece.shape, nextPiece.x, nextPiece.y)) {
        s.status = "gameover";
        s.currentPiece = null;
      } else {
        s.currentPiece = nextPiece;
      }

      s.lockStartTime = null;
      s.lastDropTime = performance.now();
      syncDisplay(s);
    },
    [syncDisplay]
  );

  // Move piece by delta
  const movePiece = useCallback((dx: number, dy: number): boolean => {
    const s = stateRef.current;
    if (!s.currentPiece || s.status !== "playing") return false;

    const newX = s.currentPiece.x + dx;
    const newY = s.currentPiece.y + dy;

    if (isValidPosition(s.grid, s.currentPiece.shape, newX, newY)) {
      s.currentPiece.x = newX;
      s.currentPiece.y = newY;
      if (dx !== 0) {
        s.lockStartTime = null;
      }
      return true;
    }
    return false;
  }, []);

  // Move piece to a target grid column (for mouse tracking)
  const movePieceToColumn = useCallback((targetCol: number) => {
    const s = stateRef.current;
    if (!s.currentPiece || s.status !== "playing") return;

    // Find actual filled column bounds within the shape matrix
    let minC = s.currentPiece.shape[0].length;
    let maxC = 0;
    for (let r = 0; r < s.currentPiece.shape.length; r++) {
      for (let c = 0; c < s.currentPiece.shape[r].length; c++) {
        if (s.currentPiece.shape[r][c]) {
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    const filledWidth = maxC - minC + 1;

    // Center the filled portion on the target column
    const targetX = Math.round(targetCol - minC - filledWidth / 2);
    const clampedX = Math.max(
      -minC,
      Math.min(COLS - maxC - 1, targetX)
    );

    // Move one step at a time toward target to respect collisions
    while (s.currentPiece.x !== clampedX) {
      const dx = clampedX > s.currentPiece.x ? 1 : -1;
      if (
        isValidPosition(
          s.grid,
          s.currentPiece.shape,
          s.currentPiece.x + dx,
          s.currentPiece.y
        )
      ) {
        s.currentPiece.x += dx;
        s.lockStartTime = null;
      } else {
        break;
      }
    }
  }, []);

  // Rotate piece clockwise with wall kicks
  const rotatePiece = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || s.status !== "playing") return;
    if (s.currentPiece.type === 2) return; // O piece doesn't rotate

    const newRotation = (s.currentPiece.rotation + 1) % 4;
    const newShape = getRotation(s.currentPiece.type, newRotation);

    // Try normal position, then wall kicks
    const kicks = [0, -1, 1, -2, 2];
    const yKicks = [0, -1];

    for (const ky of yKicks) {
      for (const kx of kicks) {
        if (
          isValidPosition(
            s.grid,
            newShape,
            s.currentPiece.x + kx,
            s.currentPiece.y + ky
          )
        ) {
          s.currentPiece.shape = newShape;
          s.currentPiece.rotation = newRotation;
          s.currentPiece.x += kx;
          s.currentPiece.y += ky;
          s.lockStartTime = null;
          return;
        }
      }
    }
  }, []);

  // Hard drop
  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentPiece || s.status !== "playing") return;

    let dropDistance = 0;
    while (
      isValidPosition(
        s.grid,
        s.currentPiece.shape,
        s.currentPiece.x,
        s.currentPiece.y + 1
      )
    ) {
      s.currentPiece.y++;
      dropDistance++;
    }
    s.score += dropDistance * 2;
    lockPiece(s);
  }, [lockPiece]);

  // Ghost piece Y position
  const getGhostY = useCallback((s: GameStateData): number => {
    if (!s.currentPiece) return 0;
    let ghostY = s.currentPiece.y;
    while (
      isValidPosition(
        s.grid,
        s.currentPiece.shape,
        s.currentPiece.x,
        ghostY + 1
      )
    ) {
      ghostY++;
    }
    return ghostY;
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    stateRef.current = createInitialState();
    setDisplayState({ score: 0, lines: 0, level: 1, status: "idle" });
  }, []);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    cancelAnimationFrame(animRef.current);
    stateRef.current = createInitialState();
    setDisplayState({ score: 0, lines: 0, level: 1, status: "idle" });
  }, []);

  // Start game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "idle") {
      s.status = "playing";
      const piece = spawnPiece(s.nextPieceType);
      s.nextPieceType = randomPieceType();
      s.currentPiece = piece;
      s.lastDropTime = performance.now();
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;

      if (s.status === "idle") {
        if (
          [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            " ",
            "w",
            "W",
          ].includes(e.key)
        ) {
          e.preventDefault();
          startGame();
          return;
        }
      }

      if (s.status === "gameover") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          resetGame();
          return;
        }
      }

      if (s.status !== "playing") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          movePiece(1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (movePiece(0, 1)) {
            s.score += 1;
            s.lastDropTime = performance.now();
            syncDisplay(s);
          }
          break;
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          rotatePiece();
          break;
        case " ":
          e.preventDefault();
          hardDrop();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startGame, resetGame, movePiece, rotatePiece, hardDrop, syncDisplay]);

  // Mouse controls — move piece to follow mouse, click to rotate
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const s = stateRef.current;
      if (s.status !== "playing" || !s.currentPiece) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const canvasX = (e.clientX - rect.left) * scaleX;

      // Only track within the grid area
      if (canvasX >= 0 && canvasX <= GRID_W) {
        const targetCol = canvasX / CELL_SIZE;
        movePieceToColumn(targetCol);
      }
    };

    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let didHardDrop = false;

    const handleMouseDown = () => {
      didHardDrop = false;
      const s = stateRef.current;
      if (s.status === "playing") {
        holdTimer = setTimeout(() => {
          didHardDrop = true;
          hardDrop();
        }, 200);
      }
    };

    const handleMouseUp = () => {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      if (!didHardDrop) {
        const s = stateRef.current;
        if (s.status === "idle") {
          startGame();
        } else if (s.status === "gameover") {
          resetGame();
        } else if (s.status === "playing") {
          rotatePiece();
        }
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [startGame, resetGame, rotatePiece, movePieceToColumn, hardDrop]);

  // Touch controls — tap to rotate, swipe down to soft drop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;

      if (s.status === "idle") {
        startGame();
        return;
      }
      if (s.status === "gameover") {
        resetGame();
        return;
      }

      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        // Move piece to touch X position
        if (s.status === "playing" && s.currentPiece) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = CANVAS_W / rect.width;
          const canvasX = (e.touches[0].clientX - rect.left) * scaleX;
          if (canvasX >= 0 && canvasX <= GRID_W) {
            movePieceToColumn(canvasX / CELL_SIZE);
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.status !== "playing" || !s.currentPiece) return;

      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_W / rect.width;
        const canvasX = (e.touches[0].clientX - rect.left) * scaleX;
        if (canvasX >= 0 && canvasX <= GRID_W) {
          movePieceToColumn(canvasX / CELL_SIZE);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.status !== "playing") return;
      if (e.changedTouches.length === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dy = touchEndY - touchStartY;
      const absDx = Math.abs(touchEndX - touchStartX);
      const absDy = Math.abs(dy);

      const SWIPE_THRESHOLD = 30;

      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
        // Tap = rotate
        rotatePiece();
      } else if (absDy > absDx && dy > SWIPE_THRESHOLD) {
        // Swipe down = soft drop
        for (let i = 0; i < 5; i++) {
          if (movePiece(0, 1)) {
            s.score += 1;
          } else break;
        }
        s.lastDropTime = performance.now();
        syncDisplay(s);
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startGame, resetGame, movePiece, rotatePiece, movePieceToColumn, syncDisplay]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = DIFFICULTIES[difficulty];

    const loop = (timestamp: number) => {
      const s = stateRef.current;

      // ── Update ──
      if (s.status === "playing" && s.currentPiece) {
        const dropSpeed = getDropSpeed(config, s.level);

        if (timestamp - s.lastDropTime >= dropSpeed) {
          if (
            isValidPosition(
              s.grid,
              s.currentPiece.shape,
              s.currentPiece.x,
              s.currentPiece.y + 1
            )
          ) {
            s.currentPiece.y++;
            s.lastDropTime = timestamp;
            s.lockStartTime = null;
          } else {
            // Piece can't move down — start / check lock delay
            if (s.lockStartTime === null) {
              s.lockStartTime = timestamp;
            }

            if (timestamp - s.lockStartTime >= config.lockDelay) {
              lockPiece(s);
            }
          }
        }
      }

      // ── Draw ──
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid background
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, GRID_W, CANVAS_H);

      // Grid lines
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, CANVAS_H);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(GRID_W, r * CELL_SIZE);
        ctx.stroke();
      }

      // Locked blocks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (s.grid[r][c] !== 0) {
            const color = PIECE_COLORS[s.grid[r][c]];
            ctx.fillStyle = color;
            ctx.fillRect(
              c * CELL_SIZE + 1,
              r * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.lineWidth = 1;
            ctx.strokeRect(
              c * CELL_SIZE + 1,
              r * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
          }
        }
      }

      // Ghost piece
      if (s.currentPiece && s.status === "playing") {
        const ghostY = getGhostY(s);
        if (ghostY !== s.currentPiece.y) {
          const ghostCells = getOccupiedCells(
            s.currentPiece.shape,
            s.currentPiece.x,
            ghostY
          );
          const color = PIECE_COLORS[s.currentPiece.type];
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.2;
          for (const cell of ghostCells) {
            if (cell.r >= 0) {
              ctx.fillRect(
                cell.c * CELL_SIZE + 1,
                cell.r * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
              );
            }
          }
          ctx.globalAlpha = 1;
        }
      }

      // Current piece
      if (s.currentPiece) {
        const cells = getOccupiedCells(
          s.currentPiece.shape,
          s.currentPiece.x,
          s.currentPiece.y
        );
        const color = PIECE_COLORS[s.currentPiece.type];
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        for (const cell of cells) {
          if (cell.r >= 0) {
            ctx.fillRect(
              cell.c * CELL_SIZE + 1,
              cell.r * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
          }
        }
        ctx.shadowBlur = 0;

        // Inner highlight
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        for (const cell of cells) {
          if (cell.r >= 0) {
            ctx.strokeRect(
              cell.c * CELL_SIZE + 2,
              cell.r * CELL_SIZE + 2,
              CELL_SIZE - 4,
              CELL_SIZE - 4
            );
          }
        }
      }

      // ── Sidebar ──
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(GRID_W, 0);
      ctx.lineTo(GRID_W, CANVAS_H);
      ctx.stroke();

      // "NEXT" label
      ctx.fillStyle = "#888888";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("NEXT", GRID_W + SIDEBAR_W / 2, 30);

      // Next piece preview
      if (s.nextPieceType > 0) {
        const nextShape = PIECE_SHAPES[s.nextPieceType];
        const previewCellSize = 20;
        const previewW = nextShape[0].length * previewCellSize;
        const previewH = nextShape.length * previewCellSize;
        const previewX = GRID_W + (SIDEBAR_W - previewW) / 2;
        const previewY = 45;

        ctx.fillStyle = PIECE_COLORS[s.nextPieceType];
        ctx.shadowColor = PIECE_COLORS[s.nextPieceType];
        ctx.shadowBlur = 4;
        for (let r = 0; r < nextShape.length; r++) {
          for (let c = 0; c < nextShape[r].length; c++) {
            if (nextShape[r][c]) {
              ctx.fillRect(
                previewX + c * previewCellSize + 1,
                previewY + r * previewCellSize + 1,
                previewCellSize - 2,
                previewCellSize - 2
              );
            }
          }
        }
        ctx.shadowBlur = 0;
      }

      // Sidebar stats
      const statsX = GRID_W + 15;
      let statsY = 140;

      ctx.textAlign = "left";
      ctx.fillStyle = "#888888";
      ctx.font = "12px monospace";
      ctx.fillText("SCORE", statsX, statsY);
      statsY += 18;
      ctx.fillStyle = "#00ff41";
      ctx.font = "bold 16px monospace";
      ctx.fillText(String(s.score), statsX, statsY);
      statsY += 30;

      ctx.fillStyle = "#888888";
      ctx.font = "12px monospace";
      ctx.fillText("LINES", statsX, statsY);
      statsY += 18;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.fillText(String(s.lines), statsX, statsY);
      statsY += 30;

      ctx.fillStyle = "#888888";
      ctx.font = "12px monospace";
      ctx.fillText("LEVEL", statsX, statsY);
      statsY += 18;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px monospace";
      ctx.fillText(String(s.level), statsX, statsY);

      // Controls legend in sidebar
      statsY += 40;
      ctx.fillStyle = "#555555";
      ctx.font = "10px monospace";
      ctx.fillText("Mouse Move", statsX, statsY);
      statsY += 16;
      ctx.fillText("Click Rotate", statsX, statsY);
      statsY += 16;
      ctx.fillText("\u2193   Soft drop", statsX, statsY);
      statsY += 16;
      ctx.fillText("Space Hard drop", statsX, statsY);

      // ── Overlays ──
      if (s.status === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, GRID_W, CANVAS_H);
        ctx.fillStyle = "#00ff41";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Click or Tap to Start", GRID_W / 2, CANVAS_H / 2 - 10);
        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText(
          "Mouse to move, Click to rotate",
          GRID_W / 2,
          CANVAS_H / 2 + 20
        );
        ctx.fillText("Space to hard drop", GRID_W / 2, CANVAS_H / 2 + 42);
        ctx.textBaseline = "alphabetic";
      }

      if (s.status === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, GRID_W, CANVAS_H);
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", GRID_W / 2, CANVAS_H / 2 - 40);
        ctx.font = "16px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Score: ${s.score}`, GRID_W / 2, CANVAS_H / 2 - 5);
        ctx.fillStyle = "#00ff41";
        ctx.fillText(`Lines: ${s.lines}`, GRID_W / 2, CANVAS_H / 2 + 22);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Level: ${s.level}`, GRID_W / 2, CANVAS_H / 2 + 49);
        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText(
          "Click or Tap to play again",
          GRID_W / 2,
          CANVAS_H / 2 + 80
        );
        ctx.textBaseline = "alphabetic";
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [difficulty, lockPiece, getGhostY]);

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
      <div className="flex items-center gap-3 sm:gap-4 bg-wojak-card border border-wojak-border rounded-xl px-3 sm:px-4 py-2 min-w-[240px] sm:min-w-[320px] justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Score:</span>
          <span className="font-mono text-sm font-bold text-wojak-green">
            {displayState.score}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Lines:</span>
          <span className="font-mono text-sm font-bold text-white">
            {displayState.lines}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Level:</span>
          <span className="font-mono text-sm font-bold text-white">
            {displayState.level}
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
          width: "min(85vw, 450px)",
          height: "auto",
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
          touchAction: "none",
        }}
      />

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Mouse to move &mdash; Click to rotate &mdash; Space to hard drop
        </span>
        <span className="sm:hidden">
          Drag to move &mdash; Tap to rotate &mdash; Swipe down to drop
        </span>
      </div>
    </div>
  );
}
