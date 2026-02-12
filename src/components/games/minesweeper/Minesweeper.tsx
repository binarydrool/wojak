"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Board, {
  createEmptyBoard,
  placeMines,
  revealCell,
  toggleFlag,
  checkWin,
  revealAllMines,
  countFlags,
} from "./Board";
import { CellData, GameState, DifficultyConfig, DIFFICULTIES } from "./types";

type FaceState = "happy" | "nervous" | "dead" | "cool";

function FaceIcon({ state, size = 24 }: { state: FaceState; size?: number }) {
  const s = size;
  const cx = s / 2, cy = s / 2, r = s / 2 - 1;
  const eyeY = cy - s * 0.08;
  const eyeL = cx - s * 0.15;
  const eyeR = cx + s * 0.15;

  if (state === "dead") {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <circle cx={cx} cy={cy} r={r} fill="#1a1a1a" stroke="#888" strokeWidth="1.5" />
        <line x1={eyeL - 3} y1={eyeY - 3} x2={eyeL + 3} y2={eyeY + 3} stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
        <line x1={eyeL + 3} y1={eyeY - 3} x2={eyeL - 3} y2={eyeY + 3} stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
        <line x1={eyeR - 3} y1={eyeY - 3} x2={eyeR + 3} y2={eyeY + 3} stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
        <line x1={eyeR + 3} y1={eyeY - 3} x2={eyeR - 3} y2={eyeY + 3} stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
        <path d={`M${cx - 4} ${cy + 5} Q${cx} ${cy + 2} ${cx + 4} ${cy + 5}`} fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (state === "nervous") {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <circle cx={cx} cy={cy} r={r} fill="#1a1a1a" stroke="#facc15" strokeWidth="1.5" />
        <circle cx={eyeL} cy={eyeY} r="2.5" fill="#facc15" />
        <circle cx={eyeR} cy={eyeY} r="2.5" fill="#facc15" />
        <ellipse cx={cx} cy={cy + 5} rx="4" ry="3" fill="none" stroke="#facc15" strokeWidth="1.5" />
      </svg>
    );
  }

  if (state === "cool") {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <circle cx={cx} cy={cy} r={r} fill="#1a1a1a" stroke="#4ade80" strokeWidth="1.5" />
        <rect x={eyeL - 4.5} y={eyeY - 2} width="9" height="4" rx="1" fill="#4ade80" />
        <rect x={eyeR - 4.5} y={eyeY - 2} width="9" height="4" rx="1" fill="#4ade80" />
        <line x1={eyeL + 4.5} y1={eyeY} x2={eyeR - 4.5} y2={eyeY} stroke="#4ade80" strokeWidth="1.5" />
        <path d={`M${cx - 4} ${cy + 4} Q${cx} ${cy + 8} ${cx + 4} ${cy + 4}`} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // happy (default)
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <circle cx={cx} cy={cy} r={r} fill="#1a1a1a" stroke="#4ade80" strokeWidth="1.5" />
      <circle cx={eyeL} cy={eyeY} r="2" fill="#4ade80" />
      <circle cx={eyeR} cy={eyeY} r="2" fill="#4ade80" />
      <path d={`M${cx - 4} ${cy + 3} Q${cx} ${cy + 8} ${cx + 4} ${cy + 3}`} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Minesweeper() {
  const [difficultyKey, setDifficultyKey] = useState<string>("easy");
  const difficulty: DifficultyConfig = DIFFICULTIES[difficultyKey];

  const [board, setBoard] = useState<CellData[][]>(() =>
    createEmptyBoard(difficulty.rows, difficulty.cols)
  );
  const [gameState, setGameState] = useState<GameState>("idle");
  const [face, setFace] = useState<FaceState>("happy");
  const [timer, setTimer] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstClickRef = useRef(true);

  // Start timer
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset game
  const resetGame = useCallback(
    (diff?: DifficultyConfig) => {
      const d = diff || difficulty;
      stopTimer();
      setBoard(createEmptyBoard(d.rows, d.cols));
      setGameState("idle");
      setFace("happy");
      setTimer(0);
      firstClickRef.current = true;
    },
    [difficulty, stopTimer]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback(
    (key: string) => {
      setDifficultyKey(key);
      const newDiff = DIFFICULTIES[key];
      resetGame(newDiff);
    },
    [resetGame]
  );

  // Handle cell reveal
  const handleReveal = useCallback(
    (row: number, col: number) => {
      if (gameState === "won" || gameState === "lost") return;

      let currentBoard = board;

      // First click: place mines (never on first click cell)
      if (firstClickRef.current) {
        firstClickRef.current = false;
        currentBoard = placeMines(
          board,
          difficulty.rows,
          difficulty.cols,
          difficulty.mines,
          row,
          col
        );
        setGameState("playing");
        startTimer();
      }

      const { newBoard, hitMine } = revealCell(
        currentBoard,
        difficulty.rows,
        difficulty.cols,
        row,
        col
      );

      if (hitMine) {
        const finalBoard = revealAllMines(newBoard);
        setBoard(finalBoard);
        setGameState("lost");
        setFace("dead");
        stopTimer();
        return;
      }

      setBoard(newBoard);

      if (checkWin(newBoard)) {
        setGameState("won");
        setFace("cool");
        stopTimer();
      }
    },
    [board, gameState, difficulty, startTimer, stopTimer]
  );

  // Handle flag toggle
  const handleFlag = useCallback(
    (row: number, col: number) => {
      if (gameState === "won" || gameState === "lost") return;
      if (gameState === "idle") return; // Can't flag before first click
      const newBoard = toggleFlag(board, row, col);
      setBoard(newBoard);
    },
    [board, gameState]
  );

  // Mouse down on board = nervous face
  const handleMouseDown = useCallback(() => {
    if (gameState === "playing") {
      setIsMouseDown(true);
      setFace("nervous");
    }
  }, [gameState]);

  const handleMouseUp = useCallback(() => {
    if (gameState === "playing") {
      setIsMouseDown(false);
      setFace("happy");
    }
  }, [gameState]);

  // Also reset face on mouse leave from the board area
  useEffect(() => {
    if (!isMouseDown) return;
    const handleGlobalUp = () => {
      setIsMouseDown(false);
      if (gameState === "playing") setFace("happy");
    };
    window.addEventListener("mouseup", handleGlobalUp);
    return () => window.removeEventListener("mouseup", handleGlobalUp);
  }, [isMouseDown, gameState]);

  const flagCount = countFlags(board);
  const minesRemaining = difficulty.mines - flagCount;

  // Format timer as 3-digit display
  const timerDisplay = String(Math.min(timer, 999)).padStart(3, "0");
  const mineDisplay = String(Math.max(minesRemaining, -99)).padStart(3, "0");

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 p-2 sm:p-4 select-none w-full max-w-fit mx-auto">
      {/* Difficulty Selector */}
      <div className="flex gap-2">
        {Object.entries(DIFFICULTIES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleDifficultyChange(key)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              difficultyKey === key
                ? "bg-wojak-green text-black"
                : "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Top Bar: Mine Counter | Face | Timer */}
      <div className="flex items-center gap-3 sm:gap-4 bg-wojak-card border border-wojak-border rounded-xl px-3 sm:px-4 py-2 min-w-[240px] sm:min-w-[280px] justify-between">
        {/* Mine counter */}
        <div
          className="font-mono text-lg sm:text-xl font-bold tracking-widest text-red-500 bg-black/50 px-2 sm:px-3 py-1 rounded"
          title="Mines remaining"
        >
          {mineDisplay}
        </div>

        {/* Face button */}
        <button
          onClick={() => resetGame()}
          className="text-xl sm:text-2xl hover:scale-110 active:scale-95 transition-transform px-2"
          title="New game"
        >
          <FaceIcon state={face} size={28} />
        </button>

        {/* Timer */}
        <div
          className="font-mono text-lg sm:text-xl font-bold tracking-widest text-red-500 bg-black/50 px-2 sm:px-3 py-1 rounded"
          title="Time"
        >
          {timerDisplay}
        </div>
      </div>

      {/* Game Board */}
      <Board
        board={board}
        gameState={gameState}
        difficulty={difficulty}
        onReveal={handleReveal}
        onFlag={handleFlag}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />

      {/* Game status message */}
      {gameState === "won" && (
        <div className="text-wojak-green font-bold text-base sm:text-lg animate-pulse flex items-center gap-2 justify-center">
          You won! All mines cleared! <FaceIcon state="cool" size={20} />
        </div>
      )}
      {gameState === "lost" && (
        <div className="text-red-400 font-bold text-base sm:text-lg text-center flex items-center gap-2 justify-center">
          Game over! <FaceIcon state="dead" size={20} /> Click the face to try again.
        </div>
      )}

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">Left click to reveal · Right click to flag</span>
        <span className="sm:hidden">Tap to reveal · Long-press to flag</span>
      </div>
    </div>
  );
}
