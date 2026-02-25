import type { Board, Color, Move, SquareCoords } from "@/types";
import { FILES } from "@/constants";

/** Create the standard chess starting position */
export function createInitialBoard(): Board {
  const board: Board = {};

  // White back rank
  board["a1"] = { type: "r", color: "w" }; board["b1"] = { type: "n", color: "w" };
  board["c1"] = { type: "b", color: "w" }; board["d1"] = { type: "q", color: "w" };
  board["e1"] = { type: "k", color: "w" }; board["f1"] = { type: "b", color: "w" };
  board["g1"] = { type: "n", color: "w" }; board["h1"] = { type: "r", color: "w" };

  // White pawns
  for (let i = 0; i < 8; i++) board[FILES[i] + "2"] = { type: "p", color: "w" };

  // Black back rank
  board["a8"] = { type: "r", color: "b" }; board["b8"] = { type: "n", color: "b" };
  board["c8"] = { type: "b", color: "b" }; board["d8"] = { type: "q", color: "b" };
  board["e8"] = { type: "k", color: "b" }; board["f8"] = { type: "b", color: "b" };
  board["g8"] = { type: "n", color: "b" }; board["h8"] = { type: "r", color: "b" };

  // Black pawns
  for (let i = 0; i < 8; i++) board[FILES[i] + "7"] = { type: "p", color: "b" };

  return board;
}

/** Parse a square string like "e4" into file and rank */
export function parseSquare(sq: string): SquareCoords {
  return { file: sq[0], rank: parseInt(sq[1]) };
}

/** Build a square string from file letter and rank number */
export function sqStr(file: string, rank: number): string {
  return file + rank;
}

/** Check if file+rank is within bounds */
export function isOnBoard(file: string, rank: number): boolean {
  return FILES.includes(file) && rank >= 1 && rank <= 8;
}

/** Shift a file letter by an offset, returning null if out of bounds */
export function fileOffset(file: string, offset: number): string | null {
  const idx = FILES.indexOf(file) + offset;
  return idx >= 0 && idx < 8 ? FILES[idx] : null;
}

/** Deep clone a board (pieces are shallow-cloned) */
export function cloneBoard(board: Board): Board {
  const newBoard: Board = {};
  for (const sq in board) newBoard[sq] = { ...board[sq] };
  return newBoard;
}

/** Find the square containing the king for a given color */
export function findKing(board: Board, color: Color): string | null {
  for (const sq in board) {
    if (board[sq]?.type === "k" && board[sq].color === color) return sq;
  }
  return null;
}

/** Apply a move to a board, returning a new board (immutable) */
export function makeMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from];
  if (!piece) return newBoard;

  // En passant capture: remove the captured pawn
  if (move.enPassant) {
    const { file } = parseSquare(move.to);
    const capturedRank = piece.color === "w"
      ? parseInt(move.to[1]) - 1
      : parseInt(move.to[1]) + 1;
    delete newBoard[sqStr(file, capturedRank)];
  }

  // Castling: move the rook
  if (move.castling) {
    const rank = piece.color === "w" ? 1 : 8;
    if (move.castling === "K") {
      newBoard[sqStr("f", rank)] = newBoard[sqStr("h", rank)];
      delete newBoard[sqStr("h", rank)];
    } else {
      newBoard[sqStr("d", rank)] = newBoard[sqStr("a", rank)];
      delete newBoard[sqStr("a", rank)];
    }
  }

  // Move the piece
  newBoard[move.to] = { ...piece };
  delete newBoard[move.from];

  // Promotion
  if (move.promotion) {
    newBoard[move.to].type = move.promotion;
  }

  return newBoard;
}
