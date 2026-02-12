"use client";

import { useEffect, lazy, Suspense } from "react";
import { useGameModal } from "./GameContext";

// Lazy load game components
const Minesweeper = lazy(() => import("./minesweeper/Minesweeper"));
const ChessGame = lazy(() => import("./chess/ChessGame"));
const Breakout = lazy(() => import("./breakout/Breakout"));
const Pong = lazy(() => import("./pong/Pong"));
const Snake = lazy(() => import("./snake/Snake"));
const Tetris = lazy(() => import("./tetris/Tetris"));
const ConnectFour = lazy(() => import("./connectfour/ConnectFour"));
const TwentyFortyEight = lazy(() => import("./twentyfortyeight/TwentyFortyEight"));
const TicTacToe = lazy(() => import("./tictactoe/TicTacToe"));
const FlappyBird = lazy(() => import("./flappybird/FlappyBird"));
const SimonSays = lazy(() => import("./simonsays/SimonSays"));
const WhackAMole = lazy(() => import("./whackamole/WhackAMole"));
const SpaceInvaders = lazy(() => import("./spaceinvaders/SpaceInvaders"));
const Solitaire = lazy(() => import("./solitaire/Solitaire"));
const TexasHoldem = lazy(() => import("./texasholdem/TexasHoldem"));
const Spades = lazy(() => import("./spades/Spades"));
const GinRummy = lazy(() => import("./ginrummy/GinRummy"));
const Blackjack = lazy(() => import("./blackjack/Blackjack"));
const War = lazy(() => import("./war/War"));

const GAME_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  minesweeper: Minesweeper,
  chess: ChessGame,
  breakout: Breakout,
  pong: Pong,
  snake: Snake,
  tetris: Tetris,
  connectfour: ConnectFour,
  twentyfortyeight: TwentyFortyEight,
  tictactoe: TicTacToe,
  flappybird: FlappyBird,
  simonsays: SimonSays,
  whackamole: WhackAMole,
  spaceinvaders: SpaceInvaders,
  solitaire: Solitaire,
  texasholdem: TexasHoldem,
  spades: Spades,
  ginrummy: GinRummy,
  blackjack: Blackjack,
  war: War,
};

const GAME_NAMES: Record<string, string> = {
  minesweeper: "Minesweeper",
  chess: "Chess",
  breakout: "Breakout",
  pong: "Pong",
  snake: "Snake",
  tetris: "Tetris",
  connectfour: "Connect Four",
  twentyfortyeight: "2048",
  tictactoe: "Tic Tac Toe",
  flappybird: "Flappy Bird",
  simonsays: "Simon Says",
  whackamole: "Whack-a-PEPE",
  spaceinvaders: "Space Invaders",
  solitaire: "Solitaire",
  texasholdem: "Texas Hold'em",
  spades: "Spades",
  ginrummy: "Gin Rummy",
  blackjack: "Blackjack",
  war: "War",
};

export default function GameModal() {
  const { activeGame, closeGame } = useGameModal();

  // Escape key closes modal
  useEffect(() => {
    if (!activeGame) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeGame, closeGame]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeGame) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeGame]);

  if (!activeGame) return null;

  const GameComponent = GAME_COMPONENTS[activeGame];

  if (!GameComponent) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeGame();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 overflow-auto bg-wojak-dark rounded-2xl border border-wojak-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-wojak-border shrink-0">
          <h2 className="text-lg font-bold text-white">
            {GAME_NAMES[activeGame] || activeGame}
          </h2>
          <button
            onClick={closeGame}
            className="text-gray-400 hover:text-white transition-colors p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close game"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-auto flex items-start justify-center py-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-wojak-green border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <GameComponent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
