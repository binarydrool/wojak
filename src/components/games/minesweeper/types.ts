export type CellVisualState = "hidden" | "revealed" | "flagged";

export interface CellData {
  isMine: boolean;
  adjacentMines: number;
  state: CellVisualState;
}

export type GameState = "idle" | "playing" | "won" | "lost";

export interface DifficultyConfig {
  label: string;
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy: { label: "Easy", rows: 9, cols: 9, mines: 10 },
  medium: { label: "Medium", rows: 16, cols: 16, mines: 40 },
  hard: { label: "Hard", rows: 16, cols: 30, mines: 99 },
};

// Classic minesweeper number colors
export const NUMBER_COLORS: Record<number, string> = {
  1: "#3b82f6", // blue
  2: "#22c55e", // green
  3: "#ef4444", // red
  4: "#a855f7", // purple
  5: "#7f1d1d", // maroon
  6: "#14b8a6", // teal
  7: "#d1d5db", // black in classic, light gray for dark theme
  8: "#6b7280", // gray
};
