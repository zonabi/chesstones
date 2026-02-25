/** Single-character piece type codes */
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

/** Player color codes */
export type Color = "w" | "b";

/** File letters a-h */
export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

/** Rank numbers 1-8 */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Square string like "e4", "a1", etc. */
export type Square = string;

/** A piece on the board */
export interface Piece {
  type: PieceType;
  color: Color;
}

/** Board representation: square string -> piece (or absent if empty) */
export type Board = Record<string, Piece>;

/** A chess move */
export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
  enPassant?: boolean;
  castling?: "K" | "Q";
}

/** Castling availability flags */
export interface CastlingRights {
  wK: boolean;
  wQ: boolean;
  bK: boolean;
  bQ: boolean;
}

/** Material balance summary */
export interface MaterialBalance {
  white: number;
  black: number;
  balance: number;
}

/** Game status states */
export type GameStatus = "playing" | "check" | "checkmate" | "stalemate";

/** Game mode */
export type GameMode = "play" | "replay";

/** Parsed square coordinates */
export interface SquareCoords {
  file: string;
  rank: number;
}

/** A resolved replay move with context */
export interface ReplayMove {
  san: string;
  move: Move;
  boardBefore: Board;
}

/** Visual pulse state for square animations */
export type PulseType = "departure" | "arrival";

/** Captured pieces by color */
export interface CapturedPieces {
  w: PieceType[];
  b: PieceType[];
}
