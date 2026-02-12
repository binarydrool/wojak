import {
  Board,
  Square,
  Piece,
  PieceColor,
  PieceType,
  Position,
  Move,
  GameState,
  GameStatus,
  PIECE_VALUES,
} from './chessTypes';

// ── Board setup ──

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black', hasMoved: false };
    board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
    board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
    board[7][col] = { type: backRow[col], color: 'white', hasMoved: false };
  }

  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: 'white',
    status: 'playing',
    selectedSquare: null,
    validMoves: [],
    lastMove: null,
    enPassantTarget: null,
    capturedByWhite: [],
    capturedByBlack: [],
    winner: null,
    promotionPending: null,
  };
}

// ── Helpers ──

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function cloneBoard(board: Board): Board {
  return board.map(row =>
    row.map(sq => (sq ? { ...sq } : null))
  );
}

function findKing(board: Board, color: PieceColor): Position {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === color) {
        return { row: r, col: c };
      }
    }
  }
  // Should never happen in a valid game
  return { row: 0, col: 0 };
}

// ── Attack detection ──

export function isSquareAttackedBy(board: Board, pos: Position, byColor: PieceColor): boolean {
  const { row, col } = pos;

  // Knight attacks
  const knightOffsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightOffsets) {
    const r = row + dr, c = col + dc;
    if (inBounds(r, c)) {
      const p = board[r][c];
      if (p && p.color === byColor && p.type === 'knight') return true;
    }
  }

  // Pawn attacks
  const pawnDir = byColor === 'white' ? -1 : 1;
  // Pawns attack from their perspective: a white pawn at (row+1, col±1) attacks (row, col)
  // So we look for enemy pawns that could attack this square
  const pawnRow = row - pawnDir;
  for (const dc of [-1, 1]) {
    const c = col + dc;
    if (inBounds(pawnRow, c)) {
      const p = board[pawnRow][c];
      if (p && p.color === byColor && p.type === 'pawn') return true;
    }
  }

  // King attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (inBounds(r, c)) {
        const p = board[r][c];
        if (p && p.color === byColor && p.type === 'king') return true;
      }
    }
  }

  // Sliding pieces: bishop/queen (diagonals), rook/queen (straights)
  const diagonals = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const straights = [[-1,0],[1,0],[0,-1],[0,1]];

  for (const [dr, dc] of diagonals) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === 'bishop' || p.type === 'queen')) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  for (const [dr, dc] of straights) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === 'rook' || p.type === 'queen')) return true;
        break;
      }
      r += dr; c += dc;
    }
  }

  return false;
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  const opponent = color === 'white' ? 'black' : 'white';
  return isSquareAttackedBy(board, kingPos, opponent);
}

// ── Raw move generation (pseudo-legal — doesn't filter for check) ──

function getRawMoves(board: Board, from: Position, enPassantTarget: Position | null): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { row, col } = from;
  const color = piece.color;
  const opponent = color === 'white' ? 'black' : 'white';

  switch (piece.type) {
    case 'pawn': {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;

      // Forward one
      if (inBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push({ row: row + dir, col });
        // Forward two from start
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push({ row: row + 2 * dir, col });
        }
      }

      // Captures (including en passant)
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (!inBounds(row + dir, nc)) continue;
        const target = board[row + dir][nc];
        if (target && target.color === opponent) {
          moves.push({ row: row + dir, col: nc });
        }
        // En passant
        if (enPassantTarget && enPassantTarget.row === row + dir && enPassantTarget.col === nc) {
          moves.push({ row: row + dir, col: nc });
        }
      }
      break;
    }

    case 'knight': {
      const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of offsets) {
        const r = row + dr, c = col + dc;
        if (inBounds(r, c)) {
          const target = board[r][c];
          if (!target || target.color === opponent) {
            moves.push({ row: r, col: c });
          }
        }
      }
      break;
    }

    case 'bishop': {
      const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
      for (const [dr, dc] of dirs) {
        let r = row + dr, c = col + dc;
        while (inBounds(r, c)) {
          const target = board[r][c];
          if (!target) {
            moves.push({ row: r, col: c });
          } else {
            if (target.color === opponent) moves.push({ row: r, col: c });
            break;
          }
          r += dr; c += dc;
        }
      }
      break;
    }

    case 'rook': {
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dr, dc] of dirs) {
        let r = row + dr, c = col + dc;
        while (inBounds(r, c)) {
          const target = board[r][c];
          if (!target) {
            moves.push({ row: r, col: c });
          } else {
            if (target.color === opponent) moves.push({ row: r, col: c });
            break;
          }
          r += dr; c += dc;
        }
      }
      break;
    }

    case 'queen': {
      const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of dirs) {
        let r = row + dr, c = col + dc;
        while (inBounds(r, c)) {
          const target = board[r][c];
          if (!target) {
            moves.push({ row: r, col: c });
          } else {
            if (target.color === opponent) moves.push({ row: r, col: c });
            break;
          }
          r += dr; c += dc;
        }
      }
      break;
    }

    case 'king': {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = row + dr, c = col + dc;
          if (inBounds(r, c)) {
            const target = board[r][c];
            if (!target || target.color === opponent) {
              moves.push({ row: r, col: c });
            }
          }
        }
      }

      // Castling
      if (!piece.hasMoved && !isInCheck(board, color)) {
        const baseRow = color === 'white' ? 7 : 0;
        if (row === baseRow) {
          // Kingside: king at col 4, rook at col 7
          const kRook = board[baseRow][7];
          if (kRook && kRook.type === 'rook' && kRook.color === color && !kRook.hasMoved) {
            if (!board[baseRow][5] && !board[baseRow][6]) {
              const opp = color === 'white' ? 'black' : 'white';
              if (!isSquareAttackedBy(board, { row: baseRow, col: 5 }, opp) &&
                  !isSquareAttackedBy(board, { row: baseRow, col: 6 }, opp)) {
                moves.push({ row: baseRow, col: 6 });
              }
            }
          }

          // Queenside: king at col 4, rook at col 0
          const qRook = board[baseRow][0];
          if (qRook && qRook.type === 'rook' && qRook.color === color && !qRook.hasMoved) {
            if (!board[baseRow][1] && !board[baseRow][2] && !board[baseRow][3]) {
              const opp = color === 'white' ? 'black' : 'white';
              if (!isSquareAttackedBy(board, { row: baseRow, col: 2 }, opp) &&
                  !isSquareAttackedBy(board, { row: baseRow, col: 3 }, opp)) {
                moves.push({ row: baseRow, col: 2 });
              }
            }
          }
        }
      }
      break;
    }
  }

  return moves;
}

// ── Legal move filtering (removes moves that leave own king in check) ──

export function getLegalMoves(board: Board, from: Position, enPassantTarget: Position | null): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, from, enPassantTarget);
  const legalMoves: Position[] = [];

  for (const to of rawMoves) {
    const testBoard = cloneBoard(board);
    // Perform the move on the test board
    applyMoveToBoard(testBoard, from, to, piece, enPassantTarget);
    // Check if own king is in check after this move
    if (!isInCheck(testBoard, piece.color)) {
      legalMoves.push(to);
    }
  }

  return legalMoves;
}

// Apply a move to a board (mutates the board). Used for testing legality.
function applyMoveToBoard(
  board: Board,
  from: Position,
  to: Position,
  piece: Piece,
  enPassantTarget: Position | null
): void {
  const isEnPassant =
    piece.type === 'pawn' &&
    enPassantTarget &&
    to.row === enPassantTarget.row &&
    to.col === enPassantTarget.col &&
    !board[to.row][to.col];

  // En passant capture
  if (isEnPassant) {
    const capturedRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    board[capturedRow][to.col] = null;
  }

  // Castling rook move
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    const baseRow = from.row;
    if (to.col === 6) {
      // Kingside
      board[baseRow][5] = board[baseRow][7];
      board[baseRow][7] = null;
      if (board[baseRow][5]) board[baseRow][5]!.hasMoved = true;
    } else if (to.col === 2) {
      // Queenside
      board[baseRow][3] = board[baseRow][0];
      board[baseRow][0] = null;
      if (board[baseRow][3]) board[baseRow][3]!.hasMoved = true;
    }
  }

  board[to.row][to.col] = { ...piece, hasMoved: true };
  board[from.row][from.col] = null;

  // Promotion (default to queen for test purposes)
  if (piece.type === 'pawn') {
    const promoRow = piece.color === 'white' ? 0 : 7;
    if (to.row === promoRow) {
      board[to.row][to.col] = { type: 'queen', color: piece.color, hasMoved: true };
    }
  }
}

// ── Execute a move on the game state ──

export function executeMove(
  state: GameState,
  from: Position,
  to: Position,
  promotionChoice?: PieceType
): GameState {
  const board = cloneBoard(state.board);
  const piece = board[from.row][from.col];
  if (!piece) return state;

  let captured: Piece | undefined;
  let isEnPassant = false;
  let castlingSide: 'kingside' | 'queenside' | undefined;

  // Check for en passant
  if (
    piece.type === 'pawn' &&
    state.enPassantTarget &&
    to.row === state.enPassantTarget.row &&
    to.col === state.enPassantTarget.col &&
    !board[to.row][to.col]
  ) {
    isEnPassant = true;
    const capturedRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    captured = board[capturedRow][to.col] || undefined;
    board[capturedRow][to.col] = null;
  } else {
    captured = board[to.row][to.col] || undefined;
  }

  // Castling
  if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
    const baseRow = from.row;
    if (to.col === 6) {
      castlingSide = 'kingside';
      board[baseRow][5] = board[baseRow][7];
      board[baseRow][7] = null;
      if (board[baseRow][5]) board[baseRow][5]!.hasMoved = true;
    } else if (to.col === 2) {
      castlingSide = 'queenside';
      board[baseRow][3] = board[baseRow][0];
      board[baseRow][0] = null;
      if (board[baseRow][3]) board[baseRow][3]!.hasMoved = true;
    }
  }

  // Move piece
  board[to.row][to.col] = { ...piece, hasMoved: true };
  board[from.row][from.col] = null;

  // Pawn promotion
  if (piece.type === 'pawn') {
    const promoRow = piece.color === 'white' ? 0 : 7;
    if (to.row === promoRow) {
      // If no promotion choice and this is a human move, signal promotion pending
      if (!promotionChoice) {
        return {
          ...state,
          board,
          promotionPending: to,
          lastMove: {
            from,
            to,
            piece,
            captured,
            isEnPassant,
            isCastling: castlingSide,
          },
        };
      }
      board[to.row][to.col] = { type: promotionChoice, color: piece.color, hasMoved: true };
    }
  }

  // Update en passant target
  let enPassantTarget: Position | null = null;
  if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
    enPassantTarget = {
      row: (from.row + to.row) / 2,
      col: from.col,
    };
  }

  // Update captured pieces
  const capturedByWhite = [...state.capturedByWhite];
  const capturedByBlack = [...state.capturedByBlack];
  if (captured) {
    if (piece.color === 'white') {
      capturedByWhite.push(captured);
    } else {
      capturedByBlack.push(captured);
    }
  }

  // Sort captured pieces by value
  const sortCaptures = (pieces: Piece[]) =>
    pieces.sort((a, b) => PIECE_VALUES[a.type] - PIECE_VALUES[b.type]);
  sortCaptures(capturedByWhite);
  sortCaptures(capturedByBlack);

  const nextTurn: PieceColor = piece.color === 'white' ? 'black' : 'white';

  // Determine game status
  const { status, winner } = getGameStatus(board, nextTurn, enPassantTarget);

  const move: Move = {
    from,
    to,
    piece,
    captured,
    isEnPassant,
    isCastling: castlingSide,
    promotion: promotionChoice,
  };

  return {
    board,
    currentTurn: nextTurn,
    status,
    selectedSquare: null,
    validMoves: [],
    lastMove: move,
    enPassantTarget,
    capturedByWhite,
    capturedByBlack,
    winner,
    promotionPending: null,
  };
}

// Complete a pending promotion
export function completePromotion(state: GameState, choice: PieceType): GameState {
  if (!state.promotionPending || !state.lastMove) return state;

  const board = cloneBoard(state.board);
  const pos = state.promotionPending;
  const piece = board[pos.row][pos.col];
  if (!piece) return state;

  board[pos.row][pos.col] = { type: choice, color: piece.color, hasMoved: true };

  // Update en passant target
  let enPassantTarget: Position | null = null;
  // (Promotion can't happen on a double pawn push, so no en passant target needed)

  const nextTurn: PieceColor = piece.color === 'white' ? 'black' : 'white';
  const { status, winner } = getGameStatus(board, nextTurn, enPassantTarget);

  return {
    ...state,
    board,
    currentTurn: nextTurn,
    status,
    selectedSquare: null,
    validMoves: [],
    enPassantTarget,
    winner,
    promotionPending: null,
    lastMove: {
      ...state.lastMove,
      promotion: choice,
    },
  };
}

// ── Game status evaluation ──

function getGameStatus(
  board: Board,
  currentTurn: PieceColor,
  enPassantTarget: Position | null
): { status: GameStatus; winner: PieceColor | null } {
  // Check if current player has any legal moves
  const hasLegalMoves = playerHasLegalMoves(board, currentTurn, enPassantTarget);
  const inCheck = isInCheck(board, currentTurn);

  if (!hasLegalMoves) {
    if (inCheck) {
      const winner = currentTurn === 'white' ? 'black' : 'white';
      return { status: 'checkmate', winner };
    }
    return { status: 'stalemate', winner: null };
  }

  if (inCheck) {
    return { status: 'check', winner: null };
  }

  return { status: 'playing', winner: null };
}

function playerHasLegalMoves(
  board: Board,
  color: PieceColor,
  enPassantTarget: Position | null
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { row: r, col: c }, enPassantTarget);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
}

// ── Export utility for AI ──

export function getAllLegalMoves(
  board: Board,
  color: PieceColor,
  enPassantTarget: Position | null
): { from: Position; to: Position }[] {
  const allMoves: { from: Position; to: Position }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { row: r, col: c }, enPassantTarget);
        for (const to of moves) {
          allMoves.push({ from: { row: r, col: c }, to });
        }
      }
    }
  }
  return allMoves;
}

export { cloneBoard, findKing };
