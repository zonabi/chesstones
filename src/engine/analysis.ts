import type { Board, Color, MaterialBalance } from "@/types";
import { PIECE_VALUES } from "@/constants";
import { isSquareAttacked, isInCheck } from "./moves";

/** Calculate material totals for both sides */
export function getMaterialBalance(board: Board): MaterialBalance {
  let white = 0;
  let black = 0;
  for (const sq in board) {
    const p = board[sq];
    if (p.color === "w") white += PIECE_VALUES[p.type];
    else black += PIECE_VALUES[p.type];
  }
  return { white, black, balance: white - black };
}

/**
 * Compute a "tension" score (0-20) representing how dangerous the position is.
 * Higher tension = more attacked pieces + check.
 */
export function getTension(board: Board, color: Color): number {
  let tension = 0;
  const enemy: Color = color === "w" ? "b" : "w";

  if (isInCheck(board, color)) tension += 5;

  for (const sq in board) {
    const p = board[sq];
    if (p?.color === color && isSquareAttacked(board, sq, enemy)) {
      tension += PIECE_VALUES[p.type];
    }
  }

  return Math.min(tension, 20);
}

/** Count total pieces on the board */
export function getPieceCount(board: Board): number {
  return Object.keys(board).length;
}
