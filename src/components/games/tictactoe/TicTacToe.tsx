"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Types ──

type Difficulty = "beginner" | "advanced" | "expert" | "master";
type CellValue = 0 | 1 | 2; // 0 = empty, 1 = player (WOJAK/X), 2 = AI (PEPE/O)
type Board = CellValue[];
type GameStatus = "playing" | "won" | "lost" | "draw";

interface WinningLine {
  cells: number[];
}

interface SeriesScore {
  wojak: number;
  pepe: number;
  draws: number;
}

// ── Constants ──

const DIFFICULTIES: { key: Difficulty; label: string; pepeImg: string }[] = [
  { key: "beginner", label: "Beginner", pepeImg: "/images/pepe1.jpg" },
  { key: "advanced", label: "Advanced", pepeImg: "/images/pepe2.jpg" },
  { key: "expert", label: "Expert", pepeImg: "/images/pepe3.jpg" },
  { key: "master", label: "Master", pepeImg: "/images/pepe4.jpg" },
];

const WOJAK_AVATAR = "/images/wojak.jpg";
const PLAYER_COLOR = "#00ff41";
const AI_COLOR = "#ffffff";

const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

// ── Board helpers ──

function createEmptyBoard(): Board {
  return Array(9).fill(0);
}

function getAvailableCells(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === 0) acc.push(i);
    return acc;
  }, []);
}

function checkWin(board: Board, piece: CellValue): WinningLine | null {
  for (const line of WIN_LINES) {
    if (line.every((i) => board[i] === piece)) {
      return { cells: line };
    }
  }
  return null;
}

function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== 0);
}

// ── AI Logic ──

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  if (checkWin(board, 2)) return 10 - depth;
  if (checkWin(board, 1)) return depth - 10;
  if (isBoardFull(board)) return 0;

  const available = getAvailableCells(board);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const i of available) {
      board[i] = 2;
      const score = minimax(board, depth + 1, false, alpha, beta);
      board[i] = 0;
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const i of available) {
      board[i] = 1;
      const score = minimax(board, depth + 1, true, alpha, beta);
      board[i] = 0;
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return bestScore;
  }
}

function getBestMove(board: Board): number {
  const available = getAvailableCells(board);
  let bestScore = -Infinity;
  let bestMove = available[0];

  for (const i of available) {
    board[i] = 2;
    const score = minimax(board, 0, false, -Infinity, Infinity);
    board[i] = 0;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function getAIMove(board: Board, difficulty: Difficulty): number {
  const available = getAvailableCells(board);
  if (available.length === 0) return -1;

  // Check for immediate AI win
  for (const i of available) {
    board[i] = 2;
    if (checkWin(board, 2)) {
      board[i] = 0;
      return i;
    }
    board[i] = 0;
  }

  // Check for immediate player win to block
  for (const i of available) {
    board[i] = 1;
    if (checkWin(board, 1)) {
      board[i] = 0;
      return i;
    }
    board[i] = 0;
  }

  switch (difficulty) {
    case "beginner":
      // Pure random
      return available[Math.floor(Math.random() * available.length)];

    case "advanced":
      // Blocks and takes wins (handled above), otherwise prefer center then corners then random
      if (board[4] === 0) return 4;
      {
        const corners = [0, 2, 6, 8].filter((i) => board[i] === 0);
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
      }
      return available[Math.floor(Math.random() * available.length)];

    case "expert":
      // 15% chance of random move, otherwise minimax
      if (Math.random() < 0.15) {
        return available[Math.floor(Math.random() * available.length)];
      }
      return getBestMove([...board]);

    case "master":
      // Full minimax, unbeatable
      return getBestMove([...board]);
  }
}

// ── Main component ──

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [winLine, setWinLine] = useState<WinningLine | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [seriesScore, setSeriesScore] = useState<SeriesScore>({ wojak: 0, pepe: 0, draws: 0 });
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGameOver = status !== "playing";
  const currentPepe = DIFFICULTIES.find((d) => d.key === difficulty)!;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  // Handle player cell click
  const handleCellClick = useCallback(
    (index: number) => {
      if (!isPlayerTurn || isGameOver || board[index] !== 0) return;

      const newBoard = [...board];
      newBoard[index] = 1;
      setBoard(newBoard);

      const win = checkWin(newBoard, 1);
      if (win) {
        setWinLine(win);
        setStatus("won");
        setSeriesScore((prev) => ({ ...prev, wojak: prev.wojak + 1 }));
        return;
      }
      if (isBoardFull(newBoard)) {
        setStatus("draw");
        setSeriesScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
        return;
      }
      setIsPlayerTurn(false);
    },
    [board, isPlayerTurn, isGameOver]
  );

  // AI move
  useEffect(() => {
    if (isPlayerTurn || isGameOver) return;

    setIsAIThinking(true);

    const delay = 300 + Math.random() * 200; // 300-500ms

    aiTimeoutRef.current = setTimeout(() => {
      const move = getAIMove([...board], difficulty);
      if (move === -1) {
        setIsAIThinking(false);
        return;
      }

      const newBoard = [...board];
      newBoard[move] = 2;
      setBoard(newBoard);
      setIsAIThinking(false);

      const win = checkWin(newBoard, 2);
      if (win) {
        setWinLine(win);
        setStatus("lost");
        setSeriesScore((prev) => ({ ...prev, pepe: prev.pepe + 1 }));
        return;
      }
      if (isBoardFull(newBoard)) {
        setStatus("draw");
        setSeriesScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
        return;
      }
      setIsPlayerTurn(true);
    }, delay);

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [isPlayerTurn, isGameOver, board, difficulty]);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setBoard(createEmptyBoard());
    setIsPlayerTurn(true);
    setStatus("playing");
    setWinLine(null);
    setIsAIThinking(false);
  }, []);

  const handleDifficultyChange = useCallback((diff: Difficulty) => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setDifficulty(diff);
    setBoard(createEmptyBoard());
    setIsPlayerTurn(true);
    setStatus("playing");
    setWinLine(null);
    setIsAIThinking(false);
    setSeriesScore({ wojak: 0, pepe: 0, draws: 0 });
  }, []);

  const isWinCell = (index: number): boolean => {
    if (!winLine) return false;
    return winLine.cells.includes(index);
  };

  // Render X mark
  const renderX = (index: number) => {
    const isWin = isWinCell(index);
    return (
      <svg
        viewBox="0 0 100 100"
        className={`w-[60%] h-[60%] ${isWin ? "animate-pulse" : ""}`}
        style={{
          filter: isWin ? `drop-shadow(0 0 12px ${PLAYER_COLOR}) drop-shadow(0 0 24px ${PLAYER_COLOR}60)` : `drop-shadow(0 0 4px ${PLAYER_COLOR}60)`,
        }}
      >
        <line
          x1="15" y1="15" x2="85" y2="85"
          stroke={PLAYER_COLOR}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <line
          x1="85" y1="15" x2="15" y2="85"
          stroke={PLAYER_COLOR}
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  // Render O mark
  const renderO = (index: number) => {
    const isWin = isWinCell(index);
    return (
      <svg
        viewBox="0 0 100 100"
        className={`w-[60%] h-[60%] ${isWin ? "animate-pulse" : ""}`}
        style={{
          filter: isWin ? `drop-shadow(0 0 12px ${AI_COLOR}) drop-shadow(0 0 24px ${AI_COLOR}60)` : `drop-shadow(0 0 4px ${AI_COLOR}60)`,
        }}
      >
        <circle
          cx="50" cy="50" r="35"
          stroke={AI_COLOR}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-fit mx-auto">
      {/* Difficulty selector */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <div className="flex gap-1.5 sm:gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => handleDifficultyChange(d.key)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                difficulty === d.key
                  ? "bg-wojak-green text-black"
                  : "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <button
          onClick={resetGame}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          New Game
        </button>
      </div>

      {/* Player info row */}
      <div
        className="flex items-center justify-between w-full gap-2"
        style={{ maxWidth: "min(85vw, 360px)" }}
      >
        {/* WOJAK (player) */}
        <div
          className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
            status === "won"
              ? "bg-wojak-green/10 border border-wojak-green/30"
              : isPlayerTurn && !isGameOver
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
          <div className="flex flex-col">
            <span
              className={`text-sm font-bold ${
                isPlayerTurn && !isGameOver ? "text-wojak-green" : "text-gray-300"
              }`}
            >
              WOJAK
            </span>
            {isPlayerTurn && !isGameOver && !isAIThinking && (
              <span className="text-[10px] text-gray-500">Your turn</span>
            )}
          </div>
          {/* X indicator */}
          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <line x1="20" y1="20" x2="80" y2="80" stroke={PLAYER_COLOR} strokeWidth="16" strokeLinecap="round" />
              <line x1="80" y1="20" x2="20" y2="80" stroke={PLAYER_COLOR} strokeWidth="16" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <span className="text-gray-500 text-sm font-mono">VS</span>

        {/* PEPE (AI) */}
        <div
          className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
            status === "lost"
              ? "bg-red-500/10 border border-red-500/30"
              : !isPlayerTurn && !isGameOver
              ? "bg-red-500/10 border border-red-500/30"
              : "bg-wojak-card/50"
          }`}
        >
          {/* O indicator */}
          <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="32" stroke={AI_COLOR} strokeWidth="16" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={`text-sm font-bold ${
                !isPlayerTurn && !isGameOver ? "text-red-400" : "text-gray-300"
              }`}
            >
              PEPE
            </span>
            {isAIThinking && (
              <span className="text-[10px] text-yellow-400 animate-pulse">thinking...</span>
            )}
          </div>
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

      {/* Series score */}
      <div className="flex items-center gap-3 text-xs sm:text-sm">
        <span className="text-wojak-green font-mono">{seriesScore.wojak}</span>
        <span className="text-gray-500">-</span>
        <span className="text-yellow-400 font-mono">{seriesScore.draws}</span>
        <span className="text-gray-500">-</span>
        <span className="text-red-400 font-mono">{seriesScore.pepe}</span>
      </div>

      {/* Board */}
      <div className="relative">
        <div
          className="grid grid-cols-3 rounded-xl overflow-hidden border-2 border-wojak-border"
          style={{
            width: "min(85vw, 320px)",
            height: "min(85vw, 320px)",
            backgroundColor: "#0d1117",
          }}
        >
          {board.map((cell, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const canClick = !isGameOver && isPlayerTurn && cell === 0 && !isAIThinking;

            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                className={`relative flex items-center justify-center transition-all duration-150 ${
                  canClick ? "hover:bg-white/5 cursor-pointer" : "cursor-default"
                }`}
                style={{
                  borderRight: col < 2 ? "2px solid #1e3a1e" : "none",
                  borderBottom: row < 2 ? "2px solid #1e3a1e" : "none",
                }}
                disabled={!canClick}
              >
                {cell === 1 && renderX(index)}
                {cell === 2 && renderO(index)}
              </button>
            );
          })}
        </div>

        {/* Game result overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-xl">
            <div className="bg-wojak-dark border border-wojak-border rounded-xl p-4 sm:p-6 flex flex-col items-center gap-3 mx-4">
              <span className="text-lg sm:text-xl font-bold text-center">
                {status === "won" && (
                  <span className="text-wojak-green">WOJAK wins!</span>
                )}
                {status === "lost" && (
                  <span className="text-red-400">PEPE wins!</span>
                )}
                {status === "draw" && (
                  <span className="text-yellow-400">Draw!</span>
                )}
              </span>
              <button
                onClick={resetGame}
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
          Click a cell to place your X. Get 3 in a row to win!
        </span>
        <span className="sm:hidden">Tap a cell to place your X</span>
      </div>
    </div>
  );
}
