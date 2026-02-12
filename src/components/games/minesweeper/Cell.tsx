"use client";

import { useCallback, useRef, useMemo } from "react";
import { CellData, NUMBER_COLORS, GameState } from "./types";

const MINE_IMAGES = Array.from({ length: 10 }, (_, i) => `/images/${i + 1}.jpg`);

interface CellProps {
  cell: CellData;
  row: number;
  col: number;
  gameState: GameState;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  size: number;
}

export default function Cell({
  cell,
  row,
  col,
  gameState,
  onReveal,
  onFlag,
  onMouseDown,
  onMouseUp,
  size,
}: CellProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  // Each mine cell gets a random image, stable across re-renders
  const mineImageSrc = useMemo(() => {
    return MINE_IMAGES[Math.floor(Math.random() * MINE_IMAGES.length)];
  }, []);

  const handleClick = useCallback(() => {
    if (gameState === "won" || gameState === "lost") return;
    if (cell.state === "flagged" || cell.state === "revealed") return;
    onReveal(row, col);
  }, [gameState, cell.state, onReveal, row, col]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (gameState === "won" || gameState === "lost") return;
      if (cell.state === "revealed") return;
      onFlag(row, col);
    },
    [gameState, cell.state, onFlag, row, col]
  );

  // Touch: long press to flag, tap to reveal
  const handleTouchStart = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (gameState === "won" || gameState === "lost") return;
      if (cell.state === "revealed") return;
      onFlag(row, col);
    }, 400);
  }, [gameState, cell.state, onFlag, row, col]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (didLongPress.current) {
        e.preventDefault();
        return;
      }
    },
    []
  );

  const renderContent = () => {
    // Game over: show random wojak images as mines
    if (gameState === "lost" && cell.isMine && cell.state !== "flagged") {
      return (
        <img
          src={mineImageSrc}
          alt="mine"
          className="w-full h-full object-cover rounded-sm"
        />
      );
    }

    // Correctly flagged mine on win
    if (gameState === "won" && cell.isMine) {
      return (
        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400" aria-label="flag">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="currentColor" />
          <line x1="4" y1="22" x2="4" y2="15" /><line x1="4" y1="15" x2="4" y2="3" />
        </svg>
      );
    }

    if (cell.state === "flagged") {
      return (
        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500" aria-label="flag">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="currentColor" />
          <line x1="4" y1="22" x2="4" y2="15" /><line x1="4" y1="15" x2="4" y2="3" />
        </svg>
      );
    }

    if (cell.state === "revealed") {
      if (cell.isMine) {
        // This cell was the one clicked that caused game over
        return (
          <img
            src={mineImageSrc}
            alt="mine"
            className="w-full h-full object-cover rounded-sm"
          />
        );
      }
      if (cell.adjacentMines > 0) {
        return (
          <span
            className="text-sm font-bold leading-none"
            style={{ color: NUMBER_COLORS[cell.adjacentMines] }}
          >
            {cell.adjacentMines}
          </span>
        );
      }
      return null; // blank revealed cell
    }

    return null; // hidden cell
  };

  const isRevealed = cell.state === "revealed";
  const isDeadMine =
    gameState === "lost" && cell.isMine && cell.state === "revealed";

  return (
    <button
      className={`
        flex items-center justify-center select-none transition-colors duration-75
        border border-white/10
        ${
          isRevealed
            ? isDeadMine
              ? "bg-red-900/60"
              : "bg-wojak-dark/80"
            : "bg-wojak-card hover:bg-white/10 active:bg-wojak-dark/80 cursor-pointer"
        }
        ${gameState === "won" || gameState === "lost" ? "cursor-default" : ""}
      `}
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.45 }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={gameState === "won" || gameState === "lost"}
      aria-label={`Cell ${row},${col}`}
    >
      {renderContent()}
    </button>
  );
}
