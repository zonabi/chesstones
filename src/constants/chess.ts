import type { PieceType } from "@/types";

/** Board file letters, a through h */
export const FILES: readonly string[] = ["a", "b", "c", "d", "e", "f", "g", "h"];

/** Board rank numbers, 1 through 8 */
export const RANKS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8];

/** Named piece type constants */
export const PIECE_TYPES = {
  PAWN: "p",
  KNIGHT: "n",
  BISHOP: "b",
  ROOK: "r",
  QUEEN: "q",
  KING: "k",
} as const satisfies Record<string, PieceType>;

/** Named color constants */
export const COLORS = {
  WHITE: "w",
  BLACK: "b",
} as const;

/** Unicode symbols for each color+piece combination */
export const PIECE_SYMBOLS: Record<string, string> = {
  wp: "\u2659", wn: "\u2658", wb: "\u2657", wr: "\u2656", wq: "\u2655", wk: "\u2654",
  bp: "\u265F", bn: "\u265E", bb: "\u265D", br: "\u265C", bq: "\u265B", bk: "\u265A",
};

/** Material value for each piece type (king = 0 since it can't be captured) */
export const PIECE_VALUES: Record<PieceType, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

/** Knight move offsets: [file delta, rank delta] */
export const KNIGHT_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];
