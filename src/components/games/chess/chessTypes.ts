export type PieceColor = 'white' | 'black';
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
  promotion?: PieceType;
}

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';

export interface GameState {
  board: Board;
  currentTurn: PieceColor;
  status: GameStatus;
  selectedSquare: Position | null;
  validMoves: Position[];
  lastMove: Move | null;
  enPassantTarget: Position | null;
  capturedByWhite: Piece[];
  capturedByBlack: Piece[];
  winner: PieceColor | null;
  promotionPending: Position | null;
}

export type Difficulty = 'beginner' | 'advanced' | 'expert' | 'master';

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

export const PIECE_UNICODE: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '\u2654',
    queen: '\u2655',
    rook: '\u2656',
    bishop: '\u2657',
    knight: '\u2658',
    pawn: '\u2659',
  },
  black: {
    king: '\u265A',
    queen: '\u265B',
    rook: '\u265C',
    bishop: '\u265D',
    knight: '\u265E',
    pawn: '\u265F',
  },
};
