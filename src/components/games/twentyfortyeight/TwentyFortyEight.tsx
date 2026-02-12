"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Types ──

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface TileData {
  id: number;
  value: number;
  row: number;
  col: number;
  mergedFrom?: boolean;
  isNew?: boolean;
}

interface GameState {
  grid: number[][];
  tiles: TileData[];
  score: number;
}

interface DifficultyConfig {
  label: string;
  gridSize: number;
  spawnChance2: number; // chance of spawning a 2 (vs 4)
  spawnChance8: number; // chance of spawning an 8 (hard+)
  winTarget: number;
}

// ── Constants ──

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: "Easy", gridSize: 4, spawnChance2: 0.9, spawnChance8: 0, winTarget: 2048 },
  medium: { label: "Medium", gridSize: 4, spawnChance2: 0.8, spawnChance8: 0, winTarget: 2048 },
  hard: { label: "Hard", gridSize: 4, spawnChance2: 0.6, spawnChance8: 0.05, winTarget: 2048 },
  expert: { label: "Expert", gridSize: 5, spawnChance2: 0.5, spawnChance8: 0, winTarget: 4096 },
};

const DIFFICULTY_KEYS: Difficulty[] = ["easy", "medium", "hard", "expert"];

// Green gradient tile colors based on value
function getTileColor(value: number): string {
  switch (value) {
    case 2:    return "#1a2e1a";
    case 4:    return "#1e3a1e";
    case 8:    return "#224822";
    case 16:   return "#285828";
    case 32:   return "#2e6e2e";
    case 64:   return "#348834";
    case 128:  return "#3aa63a";
    case 256:  return "#44be44";
    case 512:  return "#55d455";
    case 1024: return "#22dd44";
    case 2048: return "#00ff41";
    case 4096: return "#00ff41";
    case 8192: return "#44ffaa";
    default:   return value > 8192 ? "#88ffcc" : "#1a2e1a";
  }
}

function getTileShadow(value: number): string {
  if (value >= 2048) return "0 0 20px #00ff4180, 0 0 40px #00ff4140";
  if (value >= 512)  return "0 0 12px #00ff4160";
  if (value >= 128)  return "0 0 8px #00ff4140";
  return "none";
}

function getTileFontSize(value: number, gridSize: number): string {
  const digits = String(value).length;
  const base = gridSize === 5 ? "text-lg" : "text-xl";
  if (digits <= 2) return gridSize === 5 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl";
  if (digits === 3) return gridSize === 5 ? "text-base sm:text-lg" : base + " sm:text-2xl";
  return gridSize === 5 ? "text-xs sm:text-sm" : "text-sm sm:text-base";
}

// ── Grid helpers ──

let nextTileId = 1;

function createEmptyGrid(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function getEmptyCells(grid: number[][]): [number, number][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  return empty;
}

function spawnTile(grid: number[][], config: DifficultyConfig): number[][] {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return grid;

  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map((r) => [...r]);

  const rand = Math.random();
  if (config.spawnChance8 > 0 && rand < config.spawnChance8) {
    newGrid[row][col] = 8;
  } else if (rand < config.spawnChance8 + config.spawnChance2 * (1 - config.spawnChance8)) {
    newGrid[row][col] = 2;
  } else {
    newGrid[row][col] = 4;
  }

  return newGrid;
}

function gridToTiles(grid: number[][], mergedCells?: Set<string>, newCells?: Set<string>): TileData[] {
  const tiles: TileData[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== 0) {
        const key = `${r}-${c}`;
        tiles.push({
          id: nextTileId++,
          value: grid[r][c],
          row: r,
          col: c,
          mergedFrom: mergedCells?.has(key),
          isNew: newCells?.has(key),
        });
      }
    }
  }
  return tiles;
}

// ── Move logic ──

interface MoveResult {
  grid: number[][];
  score: number;
  moved: boolean;
  mergedCells: Set<string>;
}

function slideRow(row: number[], size: number): { newRow: number[]; rowScore: number; merged: boolean[]; moved: boolean } {
  // Filter out zeros
  const filtered = row.filter((v) => v !== 0);
  const merged: boolean[] = Array(size).fill(false);
  let rowScore = 0;
  let moved = false;
  const result: number[] = [];

  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const mergedVal = filtered[i] * 2;
      result.push(mergedVal);
      merged[result.length - 1] = true;
      rowScore += mergedVal;
      i++; // skip next
    } else {
      result.push(filtered[i]);
    }
  }

  while (result.length < size) result.push(0);

  // Check if anything moved
  for (let i = 0; i < size; i++) {
    if (row[i] !== result[i]) moved = true;
  }

  return { newRow: result, rowScore, merged, moved };
}

function moveLeft(grid: number[][]): MoveResult {
  const size = grid.length;
  const newGrid: number[][] = [];
  let totalScore = 0;
  let anyMoved = false;
  const mergedCells = new Set<string>();

  for (let r = 0; r < size; r++) {
    const { newRow, rowScore, merged, moved } = slideRow(grid[r], size);
    newGrid.push(newRow);
    totalScore += rowScore;
    if (moved) anyMoved = true;
    for (let c = 0; c < size; c++) {
      if (merged[c]) mergedCells.add(`${r}-${c}`);
    }
  }

  return { grid: newGrid, score: totalScore, moved: anyMoved, mergedCells };
}

function rotateGridCW(grid: number[][]): number[][] {
  const size = grid.length;
  const rotated = createEmptyGrid(size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      rotated[c][size - 1 - r] = grid[r][c];
    }
  }
  return rotated;
}

function rotateGridCCW(grid: number[][]): number[][] {
  const size = grid.length;
  const rotated = createEmptyGrid(size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      rotated[size - 1 - c][r] = grid[r][c];
    }
  }
  return rotated;
}

function rotateMergedCells(cells: Set<string>, size: number, direction: "cw" | "ccw", times: number): Set<string> {
  let result = new Set(cells);
  for (let t = 0; t < times; t++) {
    const next = new Set<string>();
    Array.from(result).forEach((key) => {
      const [r, c] = key.split("-").map(Number);
      if (direction === "cw") {
        next.add(`${c}-${size - 1 - r}`);
      } else {
        next.add(`${size - 1 - c}-${r}`);
      }
    });
    result = next;
  }
  return result;
}

function moveGrid(grid: number[][], direction: "left" | "right" | "up" | "down"): MoveResult {
  const size = grid.length;

  switch (direction) {
    case "left":
      return moveLeft(grid);

    case "right": {
      // Rotate 180, move left, rotate back 180
      let rotated = rotateGridCW(rotateGridCW(grid));
      const result = moveLeft(rotated);
      result.grid = rotateGridCW(rotateGridCW(result.grid));
      result.mergedCells = rotateMergedCells(result.mergedCells, size, "cw", 2);
      return result;
    }

    case "up": {
      // Rotate CCW, move left, rotate CW
      let rotated = rotateGridCCW(grid);
      const result = moveLeft(rotated);
      result.grid = rotateGridCW(result.grid);
      result.mergedCells = rotateMergedCells(result.mergedCells, size, "cw", 1);
      return result;
    }

    case "down": {
      // Rotate CW, move left, rotate CCW
      let rotated = rotateGridCW(grid);
      const result = moveLeft(rotated);
      result.grid = rotateGridCCW(result.grid);
      result.mergedCells = rotateMergedCells(result.mergedCells, size, "ccw", 1);
      return result;
    }
  }
}

function canMove(grid: number[][]): boolean {
  const size = grid.length;
  // Check for empty cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) return true;
    }
  }
  // Check for adjacent equal tiles
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < size && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWinTile(grid: number[][], target: number): boolean {
  for (const row of grid) {
    for (const val of row) {
      if (val >= target) return true;
    }
  }
  return false;
}

// ── Main Component ──

export default function TwentyFortyEight() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const config = DIFFICULTIES[difficulty];
  const [grid, setGrid] = useState<number[][]>(() => {
    let g = createEmptyGrid(config.gridSize);
    g = spawnTile(g, config);
    g = spawnTile(g, config);
    return g;
  });
  const [tiles, setTiles] = useState<TileData[]>(() => gridToTiles(grid));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [prevState, setPrevState] = useState<GameState | null>(null);
  const [animating, setAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize game
  const initGame = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTIES[diff];
    nextTileId = 1;
    let g = createEmptyGrid(cfg.gridSize);
    g = spawnTile(g, cfg);
    g = spawnTile(g, cfg);
    setGrid(g);
    setTiles(gridToTiles(g));
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setPrevState(null);
    setAnimating(false);
  }, []);

  // Handle move
  const handleMove = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (gameOver || animating) return;
      if (won && !keepPlaying) return;

      const result = moveGrid(grid, direction);
      if (!result.moved) return;

      // Save state for undo
      setPrevState({ grid, tiles, score });

      const newScore = score + result.score;

      // Find which cells are new spawns
      const beforeEmpty = getEmptyCells(result.grid);
      const afterGrid = spawnTile(result.grid, config);
      const newCells = new Set<string>();
      for (let r = 0; r < afterGrid.length; r++) {
        for (let c = 0; c < afterGrid[r].length; c++) {
          if (result.grid[r][c] === 0 && afterGrid[r][c] !== 0) {
            newCells.add(`${r}-${c}`);
          }
        }
      }

      setGrid(afterGrid);
      setTiles(gridToTiles(afterGrid, result.mergedCells, newCells));
      setScore(newScore);
      setBestScore((prev) => Math.max(prev, newScore));

      // Brief animation lock
      setAnimating(true);
      setTimeout(() => setAnimating(false), 150);

      // Check win
      if (!won && !keepPlaying && hasWinTile(afterGrid, config.winTarget)) {
        setWon(true);
        return;
      }

      // Check game over
      if (!canMove(afterGrid)) {
        setGameOver(true);
      }
    },
    [grid, tiles, score, gameOver, won, keepPlaying, config, animating]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (!prevState || gameOver) return;
    setGrid(prevState.grid);
    setTiles(prevState.tiles);
    setScore(prevState.score);
    setPrevState(null);
    setWon(false);
    setKeepPlaying(false);
    setGameOver(false);
  }, [prevState, gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if modal might need Escape
      if (e.key === "Escape") return;

      let direction: "left" | "right" | "up" | "down" | null = null;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          direction = "left";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          direction = "right";
          break;
        case "ArrowUp":
        case "w":
        case "W":
          direction = "up";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          direction = "down";
          break;
      }

      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // Determine direction from a point relative to the board center
  const getDirectionFromPoint = useCallback((clientX: number, clientY: number): "left" | "right" | "up" | "down" | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    } else {
      return dy > 0 ? "down" : "up";
    }
  }, []);

  // Click/tap controls — tap a side of the board to move that direction
  const handleBoardClick = useCallback((e: React.MouseEvent) => {
    const dir = getDirectionFromPoint(e.clientX, e.clientY);
    if (dir) handleMove(dir);
  }, [getDirectionFromPoint, handleMove]);

  // Touch/swipe controls (swipe overrides tap)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const startPos = touchStartRef.current;
      touchStartRef.current = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const threshold = 30;

      if (Math.max(absDx, absDy) >= threshold) {
        // Swipe detected
        if (absDx > absDy) {
          handleMove(dx > 0 ? "right" : "left");
        } else {
          handleMove(dy > 0 ? "down" : "up");
        }
      } else {
        // Tap — use tap position relative to board center
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const tapDx = touch.clientX - cx;
        const tapDy = touch.clientY - cy;

        if (Math.abs(tapDx) > Math.abs(tapDy)) {
          handleMove(tapDx > 0 ? "right" : "left");
        } else {
          handleMove(tapDy > 0 ? "down" : "up");
        }
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMove]);

  // Difficulty change
  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      initGame(diff);
    },
    [initGame]
  );

  const gridSize = config.gridSize;

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-fit mx-auto">
      {/* Difficulty selector */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <div className="flex gap-1.5 sm:gap-2">
          {DIFFICULTY_KEYS.map((key) => (
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
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          <button
            onClick={handleUndo}
            disabled={!prevState || gameOver}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
              prevState && !gameOver
                ? "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
                : "bg-wojak-card/50 border border-wojak-border/50 text-gray-600 cursor-not-allowed"
            }`}
          >
            Undo
          </button>

          <button
            onClick={() => initGame(difficulty)}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Score display */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex flex-col items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-wojak-card border border-wojak-border rounded-lg">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Score</span>
          <span className="text-base sm:text-lg font-bold text-white tabular-nums">{score}</span>
        </div>
        <div className="flex flex-col items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-wojak-card border border-wojak-border rounded-lg">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Best</span>
          <span className="text-base sm:text-lg font-bold text-wojak-green tabular-nums">{bestScore}</span>
        </div>
      </div>

      {/* Game board */}
      <div
        ref={containerRef}
        className="relative touch-none cursor-pointer"
        style={{ width: "min(85vw, " + (gridSize === 5 ? "380px" : "340px") + ")" }}
        onClick={handleBoardClick}
      >
        <div
          className="rounded-xl overflow-hidden border-2 border-wojak-border p-1.5 sm:p-2"
          style={{ backgroundColor: "#0d1117" }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gap: gridSize === 5 ? "4px" : "6px",
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const row = Math.floor(idx / gridSize);
              const col = idx % gridSize;
              const tile = tiles.find((t) => t.row === row && t.col === col);

              return (
                <div
                  key={`cell-${row}-${col}`}
                  className="relative aspect-square rounded-md sm:rounded-lg"
                  style={{ backgroundColor: "#1a1f2e" }}
                >
                  {tile && (
                    <div
                      className={`absolute inset-0 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-150 ${
                        tile.mergedFrom ? "animate-tile-pop" : ""
                      } ${tile.isNew ? "animate-tile-appear" : ""}`}
                      style={{
                        backgroundColor: getTileColor(tile.value),
                        boxShadow: getTileShadow(tile.value),
                      }}
                    >
                      <span
                        className={`font-bold text-white select-none ${getTileFontSize(tile.value, gridSize)}`}
                        style={{
                          textShadow: tile.value >= 128 ? "0 0 10px rgba(255,255,255,0.3)" : "none",
                        }}
                      >
                        {tile.value}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Win overlay */}
        {won && !keepPlaying && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-xl">
            <div className="bg-wojak-dark border border-wojak-border rounded-xl p-4 sm:p-6 flex flex-col items-center gap-3 mx-4">
              <span className="text-lg sm:text-xl font-bold text-wojak-green">
                You reached {config.winTarget}!
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setKeepPlaying(true)}
                  className="px-4 py-2 bg-wojak-green text-black font-bold rounded-lg hover:bg-wojak-green/80 transition-colors text-sm sm:text-base"
                >
                  Keep Playing
                </button>
                <button
                  onClick={() => initGame(difficulty)}
                  className="px-4 py-2 bg-wojak-card border border-wojak-border text-gray-300 font-bold rounded-lg hover:text-white hover:bg-white/5 transition-colors text-sm sm:text-base"
                >
                  New Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-xl">
            <div className="bg-wojak-dark border border-wojak-border rounded-xl p-4 sm:p-6 flex flex-col items-center gap-3 mx-4">
              <span className="text-lg sm:text-xl font-bold text-red-400">Game Over!</span>
              <span className="text-sm text-gray-400">Score: {score}</span>
              <button
                onClick={() => initGame(difficulty)}
                className="px-4 py-2 bg-wojak-green text-black font-bold rounded-lg hover:bg-wojak-green/80 transition-colors text-sm sm:text-base"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Arrow keys, WASD, or click a side of the board to slide tiles. Reach {config.winTarget}!
        </span>
        <span className="sm:hidden">Swipe or tap a side of the board to slide tiles</span>
      </div>

      {/* Tile animations - injected as inline style */}
      <style jsx global>{`
        @keyframes tile-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes tile-appear {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-tile-pop {
          animation: tile-pop 200ms ease-in-out;
        }
        .animate-tile-appear {
          animation: tile-appear 150ms ease-out;
        }
      `}</style>
    </div>
  );
}
