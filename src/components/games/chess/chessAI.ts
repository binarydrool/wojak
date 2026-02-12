import {
  Board,
  PieceColor,
  PieceType,
  Position,
  Piece,
  Difficulty,
  PIECE_VALUES,
} from './chessTypes';
import {
  getAllLegalMoves,
  cloneBoard,
  isInCheck,
  isSquareAttackedBy,
  getLegalMoves,
} from './chessLogic';

// ── Position evaluation tables (from white's perspective, flipped for black) ──

const PAWN_TABLE = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0],
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const ROOK_TABLE = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0],
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const KING_MIDDLEGAME_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20],
];

const POSITION_TABLES: Record<PieceType, number[][]> = {
  pawn: PAWN_TABLE,
  knight: KNIGHT_TABLE,
  bishop: BISHOP_TABLE,
  rook: ROOK_TABLE,
  queen: QUEEN_TABLE,
  king: KING_MIDDLEGAME_TABLE,
};

// ── Evaluation functions ──

function materialScore(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const val = PIECE_VALUES[p.type] * 100;
        score += p.color === 'white' ? -val : val;
      }
    }
  }
  return score;
}

function positionalScore(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const table = POSITION_TABLES[p.type];
        // For black, read the table as-is (row 0 = black's back rank)
        // For white, flip the table (row 7 = white's back rank)
        const tableRow = p.color === 'white' ? 7 - r : r;
        const val = table[tableRow][c];
        score += p.color === 'white' ? -val : val;
      }
    }
  }
  return score;
}

function mobilityScore(board: Board, enPassantTarget: Position | null): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const moves = getLegalMoves(board, { row: r, col: c }, enPassantTarget);
        const val = moves.length * 2;
        score += p.color === 'white' ? -val : val;
      }
    }
  }
  return score;
}

function pawnStructureScore(board: Board): number {
  let score = 0;

  for (let c = 0; c < 8; c++) {
    let whitePawns = 0;
    let blackPawns = 0;
    for (let r = 0; r < 8; r++) {
      const p = board[r][c];
      if (p && p.type === 'pawn') {
        if (p.color === 'white') whitePawns++;
        else blackPawns++;
      }
    }
    // Doubled pawns penalty
    if (whitePawns > 1) score += (whitePawns - 1) * 10; // penalty for white = positive for black
    if (blackPawns > 1) score -= (blackPawns - 1) * 10;
  }

  // Isolated pawns penalty
  for (let c = 0; c < 8; c++) {
    for (let r = 0; r < 8; r++) {
      const p = board[r][c];
      if (p && p.type === 'pawn') {
        let hasNeighbor = false;
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc >= 0 && nc < 8) {
            for (let nr = 0; nr < 8; nr++) {
              const np = board[nr][nc];
              if (np && np.type === 'pawn' && np.color === p.color) {
                hasNeighbor = true;
                break;
              }
            }
          }
          if (hasNeighbor) break;
        }
        if (!hasNeighbor) {
          score += p.color === 'white' ? 15 : -15;
        }
      }
    }
  }

  return score;
}

function kingSafetyScore(board: Board): number {
  let score = 0;

  for (const color of ['white', 'black'] as PieceColor[]) {
    let safety = 0;
    // Find king
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'king' && p.color === color) {
          // Check pawn shield
          const dir = color === 'white' ? -1 : 1;
          for (const dc of [-1, 0, 1]) {
            const sr = r + dir;
            const sc = c + dc;
            if (sr >= 0 && sr < 8 && sc >= 0 && sc < 8) {
              const sp = board[sr][sc];
              if (sp && sp.type === 'pawn' && sp.color === color) {
                safety += 10;
              }
            }
          }
        }
      }
    }
    score += color === 'white' ? -safety : safety;
  }

  return score;
}

// ── Evaluation levels ──

// Simple material only (for Advanced)
function evaluateSimple(board: Board): number {
  return materialScore(board);
}

// Material + position (for Expert)
function evaluateExpert(board: Board, enPassantTarget: Position | null): number {
  return materialScore(board) + positionalScore(board);
}

// Full evaluation (for Master)
function evaluateMaster(board: Board, enPassantTarget: Position | null): number {
  return (
    materialScore(board) +
    positionalScore(board) +
    pawnStructureScore(board) +
    kingSafetyScore(board) +
    mobilityScore(board, enPassantTarget)
  );
}

// ── Move simulation ──

function simulateMove(
  board: Board,
  from: Position,
  to: Position,
  enPassantTarget: Position | null
): { newBoard: Board; newEnPassant: Position | null } {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.row][from.col];
  if (!piece) return { newBoard, newEnPassant: null };

  // En passant capture
  if (
    piece.type === 'pawn' &&
    enPassantTarget &&
    to.row === enPassantTarget.row &&
    to.col === enPassantTarget.col &&
    !newBoard[to.row][to.col]
  ) {
    const capturedRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    newBoard[capturedRow][to.col] = null;
  }

  // Castling
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    const baseRow = from.row;
    if (to.col === 6) {
      newBoard[baseRow][5] = newBoard[baseRow][7];
      newBoard[baseRow][7] = null;
      if (newBoard[baseRow][5]) newBoard[baseRow][5]!.hasMoved = true;
    } else if (to.col === 2) {
      newBoard[baseRow][3] = newBoard[baseRow][0];
      newBoard[baseRow][0] = null;
      if (newBoard[baseRow][3]) newBoard[baseRow][3]!.hasMoved = true;
    }
  }

  newBoard[to.row][to.col] = { ...piece, hasMoved: true };
  newBoard[from.row][from.col] = null;

  // Auto-promote to queen for AI
  if (piece.type === 'pawn') {
    const promoRow = piece.color === 'white' ? 0 : 7;
    if (to.row === promoRow) {
      newBoard[to.row][to.col] = { type: 'queen', color: piece.color, hasMoved: true };
    }
  }

  // New en passant target
  let newEnPassant: Position | null = null;
  if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
    newEnPassant = {
      row: (from.row + to.row) / 2,
      col: from.col,
    };
  }

  return { newBoard, newEnPassant };
}

// ── Minimax with alpha-beta pruning ──

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean, // true = black (AI), false = white (player)
  enPassantTarget: Position | null,
  evalFn: (board: Board, ep: Position | null) => number
): number {
  if (depth === 0) {
    return evalFn(board, enPassantTarget);
  }

  const color: PieceColor = isMaximizing ? 'black' : 'white';
  const moves = getAllLegalMoves(board, color, enPassantTarget);

  if (moves.length === 0) {
    if (isInCheck(board, color)) {
      // Checkmate: very bad for current player
      return isMaximizing ? -100000 + (10 - depth) : 100000 - (10 - depth);
    }
    // Stalemate
    return 0;
  }

  // Move ordering: captures first for better pruning
  moves.sort((a, b) => {
    const capA = board[a.to.row][a.to.col] ? PIECE_VALUES[board[a.to.row][a.to.col]!.type] : 0;
    const capB = board[b.to.row][b.to.col] ? PIECE_VALUES[board[b.to.row][b.to.col]!.type] : 0;
    return capB - capA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const { newBoard, newEnPassant } = simulateMove(board, move.from, move.to, enPassantTarget);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, newEnPassant, evalFn);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const { newBoard, newEnPassant } = simulateMove(board, move.from, move.to, enPassantTarget);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, newEnPassant, evalFn);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// ── AI move selection per difficulty ──

function getBeginnerMove(
  board: Board,
  enPassantTarget: Position | null
): { from: Position; to: Position } | null {
  const moves = getAllLegalMoves(board, 'black', enPassantTarget);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

function getAdvancedMove(
  board: Board,
  enPassantTarget: Position | null
): { from: Position; to: Position } | null {
  const moves = getAllLegalMoves(board, 'black', enPassantTarget);
  if (moves.length === 0) return null;

  // Evaluate each move with simple material scoring, depth 1-2
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const { newBoard, newEnPassant } = simulateMove(board, move.from, move.to, enPassantTarget);
    const score = minimax(newBoard, 1, -Infinity, Infinity, false, newEnPassant, evaluateSimple);

    // Add some randomness for sub-optimal play
    const jitter = (Math.random() - 0.5) * 40;

    if (score + jitter > bestScore) {
      bestScore = score + jitter;
      bestMove = move;
    }
  }

  return bestMove;
}

function getExpertMove(
  board: Board,
  enPassantTarget: Position | null
): { from: Position; to: Position } | null {
  const moves = getAllLegalMoves(board, 'black', enPassantTarget);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const { newBoard, newEnPassant } = simulateMove(board, move.from, move.to, enPassantTarget);
    const score = minimax(newBoard, 2, -Infinity, Infinity, false, newEnPassant, evaluateExpert);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function getMasterMove(
  board: Board,
  enPassantTarget: Position | null
): { from: Position; to: Position } | null {
  const moves = getAllLegalMoves(board, 'black', enPassantTarget);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  // Use deeper search with full evaluation
  for (const move of moves) {
    const { newBoard, newEnPassant } = simulateMove(board, move.from, move.to, enPassantTarget);
    const score = minimax(newBoard, 3, -Infinity, Infinity, false, newEnPassant, evaluateMaster);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// ── Public API ──

export function getAIMove(
  board: Board,
  difficulty: Difficulty,
  enPassantTarget: Position | null
): { from: Position; to: Position } | null {
  switch (difficulty) {
    case 'beginner':
      return getBeginnerMove(board, enPassantTarget);
    case 'advanced':
      return getAdvancedMove(board, enPassantTarget);
    case 'expert':
      return getExpertMove(board, enPassantTarget);
    case 'master':
      return getMasterMove(board, enPassantTarget);
  }
}
