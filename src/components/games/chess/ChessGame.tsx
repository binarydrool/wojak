"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  GameState,
  Difficulty,
  Position,
  PieceType,
  PieceColor,
  Piece,
  PIECE_UNICODE,
  PIECE_VALUES,
} from "./chessTypes";
import {
  createInitialGameState,
  getLegalMoves,
  executeMove,
  completePromotion,
  isInCheck,
} from "./chessLogic";
import { getAIMove } from "./chessAI";

// ── Difficulty config ──

const DIFFICULTIES: { key: Difficulty; label: string; pepeImg: string }[] = [
  { key: "beginner", label: "Beginner", pepeImg: "/images/pepe1.jpg" },
  { key: "advanced", label: "Advanced", pepeImg: "/images/pepe2.jpg" },
  { key: "expert", label: "Expert", pepeImg: "/images/pepe3.jpg" },
  { key: "master", label: "Master", pepeImg: "/images/pepe4.jpg" },
];

const WOJAK_AVATAR = "/images/favicon.jpg";

const PROMOTION_PIECES: PieceType[] = ["queen", "rook", "bishop", "knight"];

// ── Board theme ──

type BoardTheme = "dark" | "light";

function getSquareColors(theme: BoardTheme) {
  if (theme === "dark") {
    return { light: "#4ade80", dark: "#1a1a1a" };
  }
  return { light: "#ffffff", dark: "#16a34a" };
}

// ── Captured pieces display ──

function CapturedPieces({ pieces, color }: { pieces: Piece[]; color: PieceColor }) {
  if (pieces.length === 0) return null;

  // Calculate material advantage
  const totalValue = pieces.reduce((sum, p) => sum + PIECE_VALUES[p.type], 0);

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="text-sm sm:text-base leading-none"
          style={{ opacity: 0.9 }}
        >
          {PIECE_UNICODE[p.color][p.type]}
        </span>
      ))}
      {totalValue > 0 && (
        <span className="text-xs text-gray-400 ml-1">+{totalValue}</span>
      )}
    </div>
  );
}

// ── Player info bar ──

function PlayerBar({
  name,
  avatarSrc,
  captured,
  capturedColor,
  isActive,
  isThinking,
}: {
  name: string;
  avatarSrc: string;
  captured: Piece[];
  capturedColor: PieceColor;
  isActive: boolean;
  isThinking?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${
        isActive ? "bg-wojak-green/10 border border-wojak-green/30" : "bg-wojak-card/50"
      }`}
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
        <img
          src={avatarSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isActive ? "text-wojak-green" : "text-gray-300"}`}>
            {name}
          </span>
          {isThinking && (
            <span className="text-xs text-yellow-400 animate-pulse">thinking...</span>
          )}
        </div>
        <CapturedPieces pieces={captured} color={capturedColor} />
      </div>
    </div>
  );
}

// Drag threshold in pixels before a click becomes a drag
const DRAG_THRESHOLD = 5;

// ── Main chess component ──

export default function ChessGame() {
  const [game, setGame] = useState<GameState>(createInitialGameState);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("dark");
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag-and-drop state
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragFrom, setDragFrom] = useState<Position | null>(null);
  const [dragPiece, setDragPiece] = useState<Piece | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    from: Position;
    piece: Piece;
    startX: number;
    startY: number;
    isDragging: boolean;
    validMoves: Position[];
  } | null>(null);
  const justDraggedRef = useRef(false);

  const isGameOver = game.status === "checkmate" || game.status === "stalemate";
  const isPlayerTurn = game.currentTurn === "white" && !isGameOver && !game.promotionPending;

  // Clean up AI timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  // Show result when game ends
  useEffect(() => {
    if (isGameOver) {
      const timer = setTimeout(() => setShowResult(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isGameOver]);

  // AI move
  useEffect(() => {
    if (game.currentTurn !== "black" || isGameOver || game.promotionPending) return;

    setIsAIThinking(true);

    const delay = difficulty === "expert" || difficulty === "master" ? 400 : 200;

    aiTimeoutRef.current = setTimeout(() => {
      const aiMove = getAIMove(game.board, difficulty, game.enPassantTarget);
      if (aiMove) {
        setGame((prev) => executeMove(prev, aiMove.from, aiMove.to, "queen"));
      }
      setIsAIThinking(false);
    }, delay);

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [game.currentTurn, game.board, game.enPassantTarget, game.promotionPending, difficulty, isGameOver]);

  // ── Click-to-move handler ──

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      // Skip click if it followed a drag release
      if (justDraggedRef.current) {
        justDraggedRef.current = false;
        return;
      }

      if (!isPlayerTurn) return;

      const clickedPiece = game.board[row][col];

      // If a square is already selected
      if (game.selectedSquare) {
        // Check if clicking on a valid move target
        const isValidTarget = game.validMoves.some(
          (m) => m.row === row && m.col === col
        );

        if (isValidTarget) {
          // Execute the move
          setGame((prev) => executeMove(prev, prev.selectedSquare!, { row, col }));
          return;
        }

        // If clicking own piece, select it instead
        if (clickedPiece && clickedPiece.color === "white") {
          const moves = getLegalMoves(game.board, { row, col }, game.enPassantTarget);
          setGame((prev) => ({
            ...prev,
            selectedSquare: { row, col },
            validMoves: moves,
          }));
          return;
        }

        // Deselect
        setGame((prev) => ({
          ...prev,
          selectedSquare: null,
          validMoves: [],
        }));
        return;
      }

      // Select own piece
      if (clickedPiece && clickedPiece.color === "white") {
        const moves = getLegalMoves(game.board, { row, col }, game.enPassantTarget);
        setGame((prev) => ({
          ...prev,
          selectedSquare: { row, col },
          validMoves: moves,
        }));
      }
    },
    [game, isPlayerTurn]
  );

  // ── Drag-and-drop handlers ──

  const getSquareFromPoint = useCallback(
    (clientX: number, clientY: number): Position | null => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const col = Math.floor((x / rect.width) * 8);
      const row = Math.floor((y / rect.height) * 8);
      if (row < 0 || row > 7 || col < 0 || col > 7) return null;
      return { row, col };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, row: number, col: number) => {
      // Clear any stale drag visual state
      if (dragStateRef.current) {
        setDragPos(null);
        setDragFrom(null);
        setDragPiece(null);
        dragStateRef.current = null;
      }

      if (!isPlayerTurn) return;
      const piece = game.board[row][col];
      if (!piece || piece.color !== "white") return;

      const moves = getLegalMoves(game.board, { row, col }, game.enPassantTarget);

      dragStateRef.current = {
        from: { row, col },
        piece,
        startX: e.clientX,
        startY: e.clientY,
        isDragging: false,
        validMoves: moves,
      };

      // Select the piece immediately so valid move indicators show
      setGame((prev) => ({
        ...prev,
        selectedSquare: { row, col },
        validMoves: moves,
      }));
    },
    [game.board, game.enPassantTarget, isPlayerTurn]
  );

  // Global pointer move/up listeners for drag tracking
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;

      if (!ds.isDragging && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        ds.isDragging = true;
        setDragFrom(ds.from);
        setDragPiece(ds.piece);
      }

      if (ds.isDragging) {
        e.preventDefault();
        setDragPos({ x: e.clientX, y: e.clientY });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      if (ds.isDragging) {
        const target = getSquareFromPoint(e.clientX, e.clientY);
        if (target) {
          const isValid = ds.validMoves.some(
            (m) => m.row === target.row && m.col === target.col
          );
          if (isValid) {
            setGame((prev) => executeMove(prev, ds.from, target));
          } else {
            // Invalid drop — deselect
            setGame((prev) => ({
              ...prev,
              selectedSquare: null,
              validMoves: [],
            }));
          }
        } else {
          // Dropped outside board — deselect
          setGame((prev) => ({
            ...prev,
            selectedSquare: null,
            validMoves: [],
          }));
        }

        setDragPos(null);
        setDragFrom(null);
        setDragPiece(null);
        justDraggedRef.current = true;
      }

      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [getSquareFromPoint]);

  const handlePromotion = useCallback(
    (choice: PieceType) => {
      setGame((prev) => completePromotion(prev, choice));
    },
    []
  );

  const resetGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setGame(createInitialGameState());
    setIsAIThinking(false);
    setShowResult(false);
  }, []);

  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      setGame(createInitialGameState());
      setIsAIThinking(false);
      setShowResult(false);
    },
    []
  );

  // ── Render helpers ──

  const sqColors = getSquareColors(boardTheme);
  const currentPepe = DIFFICULTIES.find((d) => d.key === difficulty)!;

  // Check if king is in check
  const whiteInCheck = (game.status === "check" || game.status === "checkmate") && game.currentTurn === "white";
  const blackInCheck = (game.status === "check" || game.status === "checkmate") && game.currentTurn === "black";

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-fit mx-auto">
      {/* Top controls row: Difficulty + Theme toggle */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        {/* Difficulty selector */}
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

        {/* Board theme toggle */}
        <button
          onClick={() => setBoardTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          title="Toggle board theme"
        >
          {boardTheme === "dark" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
          <span className="hidden sm:inline">{boardTheme === "dark" ? "Dark" : "Light"}</span>
        </button>

        {/* New game button */}
        <button
          onClick={resetGame}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          New Game
        </button>
      </div>

      {/* PEPE (top) */}
      <PlayerBar
        name="PEPE"
        avatarSrc={currentPepe.pepeImg}
        captured={game.capturedByBlack}
        capturedColor="white"
        isActive={game.currentTurn === "black"}
        isThinking={isAIThinking}
      />

      {/* Board */}
      <div className="relative">
        <div
          ref={boardRef}
          className="grid border-2 border-wojak-border rounded-sm overflow-hidden"
          style={{
            gridTemplateColumns: "repeat(8, 1fr)",
            width: "min(85vw, 400px)",
            height: "min(85vw, 400px)",
            touchAction: "none",
          }}
        >
          {game.board.map((boardRow, row) =>
            boardRow.map((piece, col) => {
              const isLight = (row + col) % 2 === 0;
              const bgColor = isLight ? sqColors.light : sqColors.dark;

              const isSelected =
                game.selectedSquare?.row === row &&
                game.selectedSquare?.col === col;

              const isValidMove = game.validMoves.some(
                (m) => m.row === row && m.col === col
              );

              const isLastMoveFrom =
                game.lastMove?.from.row === row &&
                game.lastMove?.from.col === col;
              const isLastMoveTo =
                game.lastMove?.to.row === row &&
                game.lastMove?.to.col === col;

              // King in check highlight
              const isKingInCheck =
                piece?.type === "king" &&
                ((piece.color === "white" && whiteInCheck) ||
                  (piece.color === "black" && blackInCheck));

              // Is this piece currently being dragged?
              const isBeingDragged =
                dragFrom !== null &&
                dragFrom.row === row &&
                dragFrom.col === col;

              let squareBg = bgColor;
              if (isKingInCheck) {
                squareBg = "#ef4444";
              } else if (isSelected) {
                squareBg = "#facc15";
              } else if (isLastMoveFrom || isLastMoveTo) {
                squareBg = isLight
                  ? boardTheme === "dark" ? "#86efac" : "#bbf7d0"
                  : boardTheme === "dark" ? "#2d2d2d" : "#22c55e";
              }

              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => handleSquareClick(row, col)}
                  onPointerDown={(e) => handlePointerDown(e, row, col)}
                  className="relative flex items-center justify-center transition-colors duration-75"
                  style={{
                    backgroundColor: squareBg,
                    aspectRatio: "1",
                  }}
                >
                  {/* Valid move indicator */}
                  {isValidMove && !piece && (
                    <div
                      className="absolute w-[28%] h-[28%] rounded-full"
                      style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                    />
                  )}
                  {isValidMove && piece && (
                    <div
                      className="absolute inset-0 border-[3px] rounded-sm"
                      style={{ borderColor: "rgba(0,0,0,0.35)" }}
                    />
                  )}

                  {/* Piece */}
                  {piece && (
                    <span
                      className="text-[clamp(1.2rem,5vw,2.5rem)] leading-none select-none pointer-events-none"
                      style={{
                        color: piece.color === "white" ? "#ffffff" : "#1a1a1a",
                        textShadow:
                          piece.color === "white"
                            ? "0 0 3px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)"
                            : "0 0 2px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.4)",
                        opacity: isBeingDragged ? 0.3 : 1,
                      }}
                    >
                      {PIECE_UNICODE[piece.color][piece.type]}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Promotion UI overlay */}
        {game.promotionPending && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="bg-wojak-dark border border-wojak-border rounded-xl p-3 sm:p-4 flex flex-col items-center gap-2">
              <span className="text-sm text-gray-300 font-medium">Promote pawn to:</span>
              <div className="flex gap-2">
                {PROMOTION_PIECES.map((pt) => (
                  <button
                    key={pt}
                    onClick={() => handlePromotion(pt)}
                    className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-wojak-card border border-wojak-border rounded-lg hover:bg-wojak-green/20 hover:border-wojak-green transition-colors text-2xl sm:text-3xl"
                  >
                    {PIECE_UNICODE.white[pt]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game result overlay */}
        {showResult && isGameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="bg-wojak-dark border border-wojak-border rounded-xl p-4 sm:p-6 flex flex-col items-center gap-3 mx-4">
              <span className="text-lg sm:text-xl font-bold text-center">
                {game.status === "checkmate" ? (
                  game.winner === "white" ? (
                    <span className="text-wojak-green">Checkmate! WOJAK wins!</span>
                  ) : (
                    <span className="text-red-400">Checkmate! PEPE wins!</span>
                  )
                ) : (
                  <span className="text-yellow-400">Stalemate! Draw!</span>
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

      {/* Floating dragged piece */}
      {dragPos && dragPiece && (
        <div
          style={{
            position: "fixed",
            left: dragPos.x,
            top: dragPos.y,
            transform: "translate(-50%, -50%) scale(1.2)",
            pointerEvents: "none",
            zIndex: 10000,
            fontSize: "clamp(1.2rem, 5vw, 2.5rem)",
            lineHeight: 1,
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
            color: dragPiece.color === "white" ? "#ffffff" : "#1a1a1a",
            textShadow:
              dragPiece.color === "white"
                ? "0 0 3px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)"
                : "0 0 2px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.4)",
          }}
        >
          {PIECE_UNICODE[dragPiece.color][dragPiece.type]}
        </div>
      )}

      {/* Rank/file labels */}
      <div
        className="flex justify-between px-0.5"
        style={{ width: "min(85vw, 400px)" }}
      >
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((f) => (
          <span key={f} className="text-[10px] text-gray-500 w-0 flex-1 text-center">
            {f}
          </span>
        ))}
      </div>

      {/* WOJAK (bottom) */}
      <PlayerBar
        name="WOJAK"
        avatarSrc={WOJAK_AVATAR}
        captured={game.capturedByWhite}
        capturedColor="black"
        isActive={game.currentTurn === "white"}
      />

      {/* Status message */}
      {game.status === "check" && !isGameOver && (
        <div className="text-yellow-400 text-sm font-medium animate-pulse">
          {game.currentTurn === "white" ? "WOJAK" : "PEPE"} is in check!
        </div>
      )}
    </div>
  );
}
