"use client";

import { useState, useRef, useEffect } from "react";
import { useGameModal } from "@/components/games/GameContext";

const GAMES = [
  { id: "minesweeper", name: "Minesweeper" },
  { id: "chess", name: "Chess" },
  { id: "breakout", name: "Breakout" },
  { id: "pong", name: "Pong" },
  { id: "snake", name: "Snake" },
  { id: "tetris", name: "Tetris" },
  { id: "connectfour", name: "Connect Four" },
  { id: "twentyfortyeight", name: "2048" },
  { id: "tictactoe", name: "Tic Tac Toe" },
  { id: "flappybird", name: "Flappy Bird" },
];

interface GamesDropdownProps {
  onGameOpen?: () => void;
  mobile?: boolean;
}

export default function GamesDropdown({ onGameOpen, mobile }: GamesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openGame } = useGameModal();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGameClick = (gameId: string) => {
    openGame(gameId);
    setIsOpen(false);
    onGameOpen?.();
  };

  // Mobile: simpler layout, no hover, just click
  if (mobile) {
    return (
      <div ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm"
        >
          Games
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div className="mt-2 space-y-1">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameClick(game.id)}
                className="block w-full text-left pl-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {game.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
      >
        Games
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 pt-1 w-48 z-50">
          <div className="bg-wojak-card border border-wojak-border rounded-lg shadow-xl overflow-hidden">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameClick(game.id)}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
