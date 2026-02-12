"use client";

import { useCallback } from "react";
import Cell from "./Cell";
import { CellData, GameState, DifficultyConfig } from "./types";

interface BoardProps {
  board: CellData[][];
  gameState: GameState;
  difficulty: DifficultyConfig;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
}

// Calculate cell size based on difficulty and viewport
function getCellSize(difficulty: DifficultyConfig): number {
  if (typeof window !== "undefined") {
    const vw = window.innerWidth;
    // On mobile, size cells to fit screen width (with some padding)
    if (vw < 640) {
      const availableWidth = vw - 32; // 16px padding each side
      const maxCellSize = Math.floor(availableWidth / difficulty.cols);
      // Clamp between 20px and 36px
      return Math.max(20, Math.min(maxCellSize, 36));
    }
  }
  // Desktop sizes
  if (difficulty.cols >= 30) return 28;
  if (difficulty.cols >= 16) return 32;
  return 36;
}

export default function Board({
  board,
  gameState,
  difficulty,
  onReveal,
  onFlag,
  onMouseDown,
  onMouseUp,
}: BoardProps) {
  const cellSize = getCellSize(difficulty);

  const handleReveal = useCallback(
    (row: number, col: number) => {
      onReveal(row, col);
    },
    [onReveal]
  );

  const handleFlag = useCallback(
    (row: number, col: number) => {
      onFlag(row, col);
    },
    [onFlag]
  );

  return (
    <div className="overflow-auto max-w-full py-2 touch-none-context">
      <div
        className="inline-grid border border-white/20 rounded"
        style={{
          gridTemplateColumns: `repeat(${difficulty.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${difficulty.rows}, ${cellSize}px)`,
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              cell={cell}
              row={rowIdx}
              col={colIdx}
              gameState={gameState}
              onReveal={handleReveal}
              onFlag={handleFlag}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              size={cellSize}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---- Game Logic Utilities ----

export function createEmptyBoard(rows: number, cols: number): CellData[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      adjacentMines: 0,
      state: "hidden" as const,
    }))
  );
}

export function placeMines(
  board: CellData[][],
  rows: number,
  cols: number,
  mines: number,
  safeRow: number,
  safeCol: number
): CellData[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  let placed = 0;

  // Safe zone: the first click and its neighbors
  const isSafe = (r: number, c: number) =>
    Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;

  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!newBoard[r][c].isMine && !isSafe(r, c)) {
      newBoard[r][c].isMine = true;
      placed++;
    }
  }

  return calculateNumbers(newBoard, rows, cols);
}

function calculateNumbers(
  board: CellData[][],
  rows: number,
  cols: number
): CellData[][] {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
            count++;
          }
        }
      }
      board[r][c].adjacentMines = count;
    }
  }
  return board;
}

export function revealCell(
  board: CellData[][],
  rows: number,
  cols: number,
  row: number,
  col: number
): { newBoard: CellData[][]; hitMine: boolean } {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const cell = newBoard[row][col];

  if (cell.state !== "hidden") return { newBoard, hitMine: false };

  if (cell.isMine) {
    cell.state = "revealed";
    return { newBoard, hitMine: true };
  }

  // Flood fill for empty cells
  floodFill(newBoard, rows, cols, row, col);

  return { newBoard, hitMine: false };
}

function floodFill(
  board: CellData[][],
  rows: number,
  cols: number,
  row: number,
  col: number
): void {
  const stack: [number, number][] = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;

    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    if (board[r][c].state !== "hidden") continue;
    if (board[r][c].isMine) continue;

    board[r][c].state = "revealed";

    // Only continue flood fill if this cell has 0 adjacent mines
    if (board[r][c].adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([r + dr, c + dc]);
        }
      }
    }
  }
}

export function toggleFlag(
  board: CellData[][],
  row: number,
  col: number
): CellData[][] {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const cell = newBoard[row][col];

  if (cell.state === "hidden") {
    cell.state = "flagged";
  } else if (cell.state === "flagged") {
    cell.state = "hidden";
  }

  return newBoard;
}

export function checkWin(board: CellData[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      // If any non-mine cell is not revealed, game is not won
      if (!cell.isMine && cell.state !== "revealed") return false;
    }
  }
  return true;
}

export function revealAllMines(board: CellData[][]): CellData[][] {
  return board.map((row) =>
    row.map((cell) => {
      if (cell.isMine && cell.state !== "flagged") {
        return { ...cell, state: "revealed" as const };
      }
      return { ...cell };
    })
  );
}

export function countFlags(board: CellData[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.state === "flagged") count++;
    }
  }
  return count;
}
