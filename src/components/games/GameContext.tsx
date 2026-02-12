"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface GameContextType {
  activeGame: string | null;
  openGame: (gameId: string) => void;
  closeGame: () => void;
}

const GameContext = createContext<GameContextType>({
  activeGame: null,
  openGame: () => {},
  closeGame: () => {},
});

export function useGameModal() {
  return useContext(GameContext);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const openGame = useCallback((gameId: string) => {
    setActiveGame(gameId);
  }, []);

  const closeGame = useCallback(() => {
    setActiveGame(null);
  }, []);

  return (
    <GameContext.Provider value={{ activeGame, openGame, closeGame }}>
      {children}
    </GameContext.Provider>
  );
}
