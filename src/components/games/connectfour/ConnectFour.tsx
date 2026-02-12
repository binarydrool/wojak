"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Types ──

type Difficulty = "beginner" | "advanced" | "expert" | "master";
type CellValue = 0 | 1 | 2; // 0 = empty, 1 = player (WOJAK), 2 = AI (PEPE)
type Board = CellValue[][];
type GameStatus = "playing" | "won" | "lost" | "draw";

interface WinningLine {
  cells: [number, number][];
}

// ── Constants ──

const ROWS = 6;
const COLS = 7;

const DIFFICULTIES: { key: Difficulty; label: string; pepeImg: string }[] = [
  { key: "beginner", label: "Beginner", pepeImg: "/images/pepe1.jpg" },
  { key: "advanced", label: "Advanced", pepeImg: "/images/pepe2.jpg" },
  { key: "expert", label: "Expert", pepeImg: "/images/pepe3.jpg" },
  { key: "master", label: "Master", pepeImg: "/images/pepe4.jpg" },
];

const WOJAK_AVATAR = "/images/favicon.jpg";
const PLAYER_COLOR = "#00ff41";
const AI_COLOR = "#ff4444";

// ── Board helpers ──

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function getLowestEmptyRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) return row;
  }
  return -1;
}

function getValidColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === 0) cols.push(c);
  }
  return cols;
}

function dropPiece(board: Board, col: number, piece: CellValue): Board {
  const row = getLowestEmptyRow(board, col);
  if (row === -1) return board;
  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = piece;
  return newBoard;
}

function checkWin(board: Board, piece: CellValue): WinningLine | null {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (
        board[r][c] === piece &&
        board[r][c + 1] === piece &&
        board[r][c + 2] === piece &&
        board[r][c + 3] === piece
      ) {
        return { cells: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]] };
      }
    }
  }
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      if (
        board[r][c] === piece &&
        board[r + 1][c] === piece &&
        board[r + 2][c] === piece &&
        board[r + 3][c] === piece
      ) {
        return { cells: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]] };
      }
    }
  }
  // Diagonal (down-right)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (
        board[r][c] === piece &&
        board[r + 1][c + 1] === piece &&
        board[r + 2][c + 2] === piece &&
        board[r + 3][c + 3] === piece
      ) {
        return {
          cells: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]],
        };
      }
    }
  }
  // Diagonal (down-left)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      if (
        board[r][c] === piece &&
        board[r + 1][c - 1] === piece &&
        board[r + 2][c - 2] === piece &&
        board[r + 3][c - 3] === piece
      ) {
        return {
          cells: [[r, c], [r + 1, c - 1], [r + 2, c - 2], [r + 3, c - 3]],
        };
      }
    }
  }
  return null;
}

function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== 0);
}

// ── AI Logic ──

function scoreWindow(window: CellValue[], piece: CellValue, opp: CellValue): number {
  const pieceCount = window.filter((c) => c === piece).length;
  const oppCount = window.filter((c) => c === opp).length;
  const emptyCount = window.filter((c) => c === 0).length;

  if (pieceCount === 4) return 100;
  if (pieceCount === 3 && emptyCount === 1) return 5;
  if (pieceCount === 2 && emptyCount === 2) return 2;
  if (oppCount === 3 && emptyCount === 1) return -4;
  return 0;
}

function evaluateBoard(board: Board, piece: CellValue): number {
  const opp: CellValue = piece === 1 ? 2 : 1;
  let score = 0;

  // Center column preference
  const centerCol = Math.floor(COLS / 2);
  const centerCount = board.reduce((sum, row) => sum + (row[centerCol] === piece ? 1 : 0), 0);
  score += centerCount * 3;

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
      score += scoreWindow(window, piece, opp);
    }
  }

  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
      score += scoreWindow(window, piece, opp);
    }
  }

  // Diagonal (down-right)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
      score += scoreWindow(window, piece, opp);
    }
  }

  // Diagonal (down-left)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const window = [board[r][c], board[r + 1][c - 1], board[r + 2][c - 2], board[r + 3][c - 3]];
      score += scoreWindow(window, piece, opp);
    }
  }

  return score;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): [number | null, number] {
  const validCols = getValidColumns(board);

  if (checkWin(board, 2)) return [null, 100000 + depth];
  if (checkWin(board, 1)) return [null, -100000 - depth];
  if (validCols.length === 0) return [null, 0];
  if (depth === 0) return [null, evaluateBoard(board, 2)];

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestCol = validCols[Math.floor(Math.random() * validCols.length)];

    for (const col of validCols) {
      const newBoard = dropPiece(board, col, 2);
      const [, score] = minimax(newBoard, depth - 1, alpha, beta, false);
      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return [bestCol, bestScore];
  } else {
    let bestScore = Infinity;
    let bestCol = validCols[Math.floor(Math.random() * validCols.length)];

    for (const col of validCols) {
      const newBoard = dropPiece(board, col, 1);
      const [, score] = minimax(newBoard, depth - 1, alpha, beta, true);
      if (score < bestScore) {
        bestScore = score;
        bestCol = col;
      }
      beta = Math.min(beta, score);
      if (alpha >= beta) break;
    }
    return [bestCol, bestScore];
  }
}

function getAIMove(board: Board, difficulty: Difficulty): number {
  const validCols = getValidColumns(board);
  if (validCols.length === 0) return -1;

  // Check for immediate AI win
  for (const col of validCols) {
    const testBoard = dropPiece(board, col, 2);
    if (checkWin(testBoard, 2)) return col;
  }

  // Check for immediate player win to block
  for (const col of validCols) {
    const testBoard = dropPiece(board, col, 1);
    if (checkWin(testBoard, 1)) return col;
  }

  switch (difficulty) {
    case "beginner": {
      // Random with occasional blocking (already handled above ~50% of the time)
      if (Math.random() < 0.4) {
        // Sometimes pick center-ish columns
        const centerCols = validCols.filter((c) => c >= 2 && c <= 4);
        if (centerCols.length > 0) {
          return centerCols[Math.floor(Math.random() * centerCols.length)];
        }
      }
      return validCols[Math.floor(Math.random() * validCols.length)];
    }
    case "advanced": {
      // Already blocks wins and takes wins (above). Use simple evaluation.
      let bestCol = validCols[0];
      let bestScore = -Infinity;
      for (const col of validCols) {
        const newBoard = dropPiece(board, col, 2);
        const score = evaluateBoard(newBoard, 2);
        if (score > bestScore) {
          bestScore = score;
          bestCol = col;
        }
      }
      return bestCol;
    }
    case "expert": {
      // Minimax with depth 4
      const [col] = minimax(board, 4, -Infinity, Infinity, true);
      return col ?? validCols[0];
    }
    case "master": {
      // Minimax with depth 6, center column preference built into eval
      const [col] = minimax(board, 6, -Infinity, Infinity, true);
      return col ?? validCols[0];
    }
  }
}

// ── Drop animation helper ──

interface DroppingPiece {
  col: number;
  targetRow: number;
  currentRow: number;
  piece: CellValue;
}

// ── Main component ──

export default function ConnectFour() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [winLine, setWinLine] = useState<WinningLine | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [dropping, setDropping] = useState<DroppingPiece | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGameOver = status !== "playing";
  const currentPepe = DIFFICULTIES.find((d) => d.key === difficulty)!;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      if (dropAnimRef.current) clearTimeout(dropAnimRef.current);
    };
  }, []);

  // Animate a piece dropping then commit the move
  const animateDrop = useCallback(
    (col: number, targetRow: number, piece: CellValue, onComplete: (newBoard: Board) => void) => {
      let currentRow = -1;
      const speed = 50; // ms per row

      const step = () => {
        if (currentRow < targetRow) {
          currentRow++;
          setDropping({ col, targetRow, currentRow, piece });
          dropAnimRef.current = setTimeout(step, speed);
        } else {
          setDropping(null);
          // Commit the piece to the board
          setBoard((prev) => {
            const newBoard = prev.map((r) => [...r]);
            newBoard[targetRow][col] = piece;
            onComplete(newBoard);
            return newBoard;
          });
        }
      };

      step();
    },
    []
  );

  // Handle player column click
  const handleColumnClick = useCallback(
    (col: number) => {
      if (!isPlayerTurn || isGameOver || dropping) return;

      const row = getLowestEmptyRow(board, col);
      if (row === -1) return;

      animateDrop(col, row, 1, (newBoard) => {
        const win = checkWin(newBoard, 1);
        if (win) {
          setWinLine(win);
          setStatus("won");
          return;
        }
        if (isBoardFull(newBoard)) {
          setStatus("draw");
          return;
        }
        setIsPlayerTurn(false);
      });
    },
    [board, isPlayerTurn, isGameOver, dropping, animateDrop]
  );

  // AI move
  useEffect(() => {
    if (isPlayerTurn || isGameOver || dropping) return;

    setIsAIThinking(true);

    const delay = difficulty === "expert" || difficulty === "master" ? 400 : 200;

    aiTimeoutRef.current = setTimeout(() => {
      const col = getAIMove(board, difficulty);
      if (col === -1) {
        setIsAIThinking(false);
        return;
      }

      const row = getLowestEmptyRow(board, col);
      if (row === -1) {
        setIsAIThinking(false);
        return;
      }

      setIsAIThinking(false);

      animateDrop(col, row, 2, (newBoard) => {
        const win = checkWin(newBoard, 2);
        if (win) {
          setWinLine(win);
          setStatus("lost");
          return;
        }
        if (isBoardFull(newBoard)) {
          setStatus("draw");
          return;
        }
        setIsPlayerTurn(true);
      });
    }, delay);

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [isPlayerTurn, isGameOver, board, difficulty, dropping, animateDrop]);

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (dropAnimRef.current) clearTimeout(dropAnimRef.current);
    setBoard(createEmptyBoard());
    setIsPlayerTurn(true);
    setStatus("playing");
    setWinLine(null);
    setIsAIThinking(false);
    setDropping(null);
  }, []);

  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      if (dropAnimRef.current) clearTimeout(dropAnimRef.current);
      setBoard(createEmptyBoard());
      setIsPlayerTurn(true);
      setStatus("playing");
      setWinLine(null);
      setIsAIThinking(false);
      setDropping(null);
    },
    []
  );

  // Check if a cell is part of winning line
  const isWinCell = (row: number, col: number): boolean => {
    if (!winLine) return false;
    return winLine.cells.some(([r, c]) => r === row && c === col);
  };

  // Get the displayed piece for a cell, accounting for drop animation
  const getDisplayPiece = (row: number, col: number): CellValue => {
    if (dropping && dropping.col === col && dropping.currentRow === row) {
      return dropping.piece;
    }
    return board[row][col];
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
        style={{ maxWidth: "min(85vw, 420px)" }}
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
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex-shrink-0"
            style={{
              backgroundColor: PLAYER_COLOR,
              borderColor: PLAYER_COLOR,
              boxShadow: `0 0 8px ${PLAYER_COLOR}60`,
            }}
          />
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
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex-shrink-0"
            style={{
              backgroundColor: AI_COLOR,
              borderColor: AI_COLOR,
              boxShadow: `0 0 8px ${AI_COLOR}60`,
            }}
          />
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

      {/* Board */}
      <div className="relative">
        <div
          className="rounded-xl overflow-hidden border-2 border-wojak-border"
          style={{
            width: "min(85vw, 420px)",
            backgroundColor: "#0d1117",
          }}
        >
          {/* Column hover indicators */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {Array.from({ length: COLS }).map((_, col) => {
              const canDrop = !isGameOver && isPlayerTurn && !dropping && board[0][col] === 0;
              return (
                <div
                  key={`indicator-${col}`}
                  className="flex items-center justify-center h-6 sm:h-8"
                >
                  {hoverCol === col && canDrop && (
                    <div
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full animate-bounce"
                      style={{
                        backgroundColor: PLAYER_COLOR,
                        boxShadow: `0 0 10px ${PLAYER_COLOR}80`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Board grid */}
          <div
            className="grid gap-[2px] sm:gap-1 p-1 sm:p-2"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {Array.from({ length: ROWS }).map((_, row) =>
              Array.from({ length: COLS }).map((_, col) => {
                const piece = getDisplayPiece(row, col);
                const isWin = isWinCell(row, col);

                return (
                  <button
                    key={`${row}-${col}`}
                    onClick={() => handleColumnClick(col)}
                    onMouseEnter={() => setHoverCol(col)}
                    onMouseLeave={() => setHoverCol(null)}
                    className="relative aspect-square rounded-full transition-all duration-150"
                    style={{
                      backgroundColor: "#1a1f2e",
                      cursor:
                        !isGameOver && isPlayerTurn && !dropping && board[0][col] === 0
                          ? "pointer"
                          : "default",
                    }}
                    disabled={isGameOver || !isPlayerTurn || !!dropping}
                  >
                    {piece !== 0 && (
                      <div
                        className={`absolute inset-[8%] rounded-full transition-all duration-200 ${
                          isWin ? "animate-pulse" : ""
                        }`}
                        style={{
                          backgroundColor: piece === 1 ? PLAYER_COLOR : AI_COLOR,
                          boxShadow: isWin
                            ? `0 0 20px ${piece === 1 ? PLAYER_COLOR : AI_COLOR}, 0 0 40px ${
                                piece === 1 ? PLAYER_COLOR : AI_COLOR
                              }60`
                            : `0 0 8px ${piece === 1 ? PLAYER_COLOR : AI_COLOR}40, inset 0 -2px 4px rgba(0,0,0,0.3)`,
                        }}
                      >
                        {/* Inner shine */}
                        <div
                          className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full"
                          style={{
                            background: `radial-gradient(ellipse, rgba(255,255,255,0.35) 0%, transparent 70%)`,
                          }}
                        />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
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
          Click a column to drop your piece. Connect 4 in a row to win!
        </span>
        <span className="sm:hidden">Tap a column to drop your piece</span>
      </div>
    </div>
  );
}
