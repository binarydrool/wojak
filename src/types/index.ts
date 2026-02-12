// Recent trade from GeckoTerminal API
export interface Trade {
  hash: string;
  type: "buy" | "sell";
  amount: string;
  wallet: string;
  timestamp: number;
  priceUsd: string;
  volumeUsd: string;
}

// Liquidity / pool info
export interface LiquidityInfo {
  tvl: string;
  lpLocked: boolean;
  lockExpiry: string;
  poolAddress: string;
}

// Game definition for the games dropdown/modal system
export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType;
}

// Minesweeper cell state
export interface MinesweeperCell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

// Minesweeper difficulty
export interface MinesweeperDifficulty {
  label: string;
  rows: number;
  cols: number;
  mines: number;
}

// Crypto 101 accordion section
export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

// Pool data from /api/pool (GeckoTerminal)
export interface PoolData {
  tvlUsd: number | null;
  wojakReserve: number | null;
  ethReserve: number | null;
  wojakPrice: number | null;
  ethPrice: number | null;
  volume24h: number | null;
  volume6h: number | null;
  volume1h: number | null;
  fees24h: number | null;
  buys24h: number | null;
  sells24h: number | null;
  buyers24h: number | null;
  sellers24h: number | null;
  source: string;
  lastUpdated: string | null;
}

