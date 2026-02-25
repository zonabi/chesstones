import type { Board } from "@/types";
import { PIECE_VALUES } from "@/constants";
import { parseSquare } from "@/engine";

const CENTER_FILES = ["d", "e"];
const CENTER_RANKS = [4, 5];

/**
 * Static board evaluation from White's perspective.
 * Positive = White advantage, negative = Black advantage.
 *
 * Factors:
 *  - Material count (100 points per piece value unit)
 *  - Center control bonus (+10 for d4/d5/e4/e5)
 *  - Pawn advancement (5 per rank advanced)
 *  - King safety (castled position bonus +30)
 */
export function evaluateBoard(board: Board): number {
  let score = 0;

  for (const sq in board) {
    const p = board[sq];
    const { file, rank } = parseSquare(sq);
    const val = PIECE_VALUES[p.type];
    const sign = p.color === "w" ? 1 : -1;

    // Material
    score += sign * val * 100;

    // Center control bonus
    if (CENTER_FILES.includes(file) && CENTER_RANKS.includes(rank)) {
      score += sign * 10;
    }

    // Pawn advancement
    if (p.type === "p") {
      score += sign * (p.color === "w" ? rank - 2 : 7 - rank) * 5;
    }

    // King safety: reward castled position
    if (p.type === "k") {
      const homeRank = p.color === "w" ? 1 : 8;
      if (rank === homeRank && (file === "g" || file === "c")) {
        score += sign * 30;
      }
    }
  }

  return score;
}
