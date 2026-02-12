"use client";

import { useState, useRef, useEffect } from "react";
import { useGameModal } from "@/components/games/GameContext";

/* ── Two-column layout: left 10 games, right 10 games ── */
const LEFT_SECTIONS = [
  {
    name: "Arcade",
    icon: "arcade" as const,
    games: [
      { id: "breakout", name: "Breakout" },
      { id: "pong", name: "Pong" },
      { id: "snake", name: "Snake" },
      { id: "flappybird", name: "Flappy Bird" },
      { id: "spaceinvaders", name: "Space Invaders" },
      { id: "skifree", name: "SkiFree" },
      { id: "whackamole", name: "Whack-a-PEPE" },
    ],
  },
  {
    name: "Board",
    icon: "board" as const,
    games: [
      { id: "chess", name: "Chess" },
      { id: "tictactoe", name: "Tic Tac Toe" },
      { id: "connectfour", name: "Connect Four" },
    ],
  },
];

const RIGHT_SECTIONS = [
  {
    name: "Puzzle",
    icon: "puzzle" as const,
    games: [
      { id: "minesweeper", name: "Minesweeper" },
      { id: "tetris", name: "Tetris" },
      { id: "twentyfortyeight", name: "2048" },
      { id: "simonsays", name: "Simon Says" },
    ],
  },
  {
    name: "Card",
    icon: "card" as const,
    games: [
      { id: "solitaire", name: "Solitaire" },
      { id: "blackjack", name: "Blackjack" },
      { id: "war", name: "War" },
      { id: "texasholdem", name: "Texas Hold'em" },
      { id: "spades", name: "Spades" },
      { id: "ginrummy", name: "Gin Rummy" },
    ],
  },
];

type IconType = "arcade" | "puzzle" | "board" | "card";

/* ── Inline SVG icons (all #00ff41 green, 14×14) ── */
function CategoryIcon({ type }: { type: IconType }) {
  const cls = "shrink-0";
  switch (type) {
    case "arcade":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cls}>
          <rect x="2" y="7" width="20" height="11" rx="3" stroke="#00ff41" strokeWidth="1.5" />
          <path d="M7 11h4M9 9v4" stroke="#00ff41" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="10.5" r="1.2" fill="#00ff41" />
          <circle cx="18.5" cy="13" r="1.2" fill="#00ff41" />
        </svg>
      );
    case "puzzle":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cls}>
          <path
            d="M5 7h3.5a2.5 2.5 0 0 1 5 0H17v3.5a2.5 2.5 0 0 1 0 5V19H5V7z"
            stroke="#00ff41"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "board":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cls}>
          <ellipse cx="12" cy="5.5" rx="2.5" ry="2.5" fill="#00ff41" />
          <path d="M10 8l-1.5 6h7L14 8" fill="#00ff41" />
          <rect x="7.5" y="14.5" width="9" height="2" rx="0.5" fill="#00ff41" />
          <rect x="6" y="17.5" width="12" height="2.5" rx="1" fill="#00ff41" />
        </svg>
      );
    case "card":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={cls}>
          <path
            d="M12 4C10 7 7.5 9.5 7.5 12c0 2 1.5 3.5 3.5 4 .3.08.7.08 1 0 2-.5 3.5-2 3.5-4C15.5 9.5 14 7 12 4z"
            fill="#00ff41"
          />
          <path d="M12 16v4M9.5 18.5l2.5-2 2.5 2" stroke="#00ff41" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

interface Section {
  name: string;
  icon: IconType;
  games: { id: string; name: string }[];
}

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

  const chevron = (
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
  );

  const renderColumn = (sections: Section[]) => (
    <div className="min-w-0 flex-1">
      {sections.map((section, i) => (
        <div key={section.name}>
          {i > 0 && <div className="border-t border-white/[0.06] my-2.5" />}
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00cc33]/70 mb-1.5 px-2">
            {section.name}
          </div>
          {section.games.map((game) => (
            <button
              key={game.id}
              onClick={() => handleGameClick(game.id)}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:text-[#00ff41] hover:bg-white/5 rounded transition-colors whitespace-nowrap"
            >
              <CategoryIcon type={section.icon} />
              {game.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  /* ── Mobile ── */
  if (mobile) {
    return (
      <div ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm"
        >
          Games
          {chevron}
        </button>

        {isOpen && (
          <div className="mt-3 flex gap-6 animate-games-dropdown-in">
            {renderColumn(LEFT_SECTIONS)}
            {renderColumn(RIGHT_SECTIONS)}
          </div>
        )}
      </div>
    );
  }

  /* ── Desktop ── */
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
        {chevron}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 pt-2 z-50 animate-games-dropdown-in" style={{ width: 380 }}>
          <div className="w-full bg-[#1a1a1a] rounded-xl shadow-xl shadow-black/80 p-4 flex gap-6">
            {renderColumn(LEFT_SECTIONS)}
            {renderColumn(RIGHT_SECTIONS)}
          </div>
        </div>
      )}
    </div>
  );
}
