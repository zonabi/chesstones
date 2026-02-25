import type { Board, CastlingRights, Color, Move, Square } from "@/types";
import { KNIGHT_OFFSETS } from "@/constants";
import { parseSquare, sqStr, isOnBoard, fileOffset, findKing, makeMove } from "./board";

/** Sliding piece ray directions: [fileOffset, rankOffset, validPieceTypes] */
const SLIDE_DIRECTIONS: ReadonlyArray<{ df: number; dr: number; types: string[] }> = [
  { df: 0, dr: 1, types: ["r", "q"] },  { df: 0, dr: -1, types: ["r", "q"] },
  { df: 1, dr: 0, types: ["r", "q"] },  { df: -1, dr: 0, types: ["r", "q"] },
  { df: 1, dr: 1, types: ["b", "q"] },  { df: 1, dr: -1, types: ["b", "q"] },
  { df: -1, dr: 1, types: ["b", "q"] }, { df: -1, dr: -1, types: ["b", "q"] },
];

/** Check whether a square is attacked by pieces of the given color */
export function isSquareAttacked(board: Board, square: Square, byColor: Color): boolean {
  const { file, rank } = parseSquare(square);

  // Pawn attacks
  const pawnDir = byColor === "w" ? -1 : 1;
  for (const df of [-1, 1]) {
    const f = fileOffset(file, df);
    const r = rank + pawnDir;
    if (f && isOnBoard(f, r)) {
      const p = board[sqStr(f, r)];
      if (p?.type === "p" && p.color === byColor) return true;
    }
  }

  // Knight attacks
  for (const [df, dr] of KNIGHT_OFFSETS) {
    const f = fileOffset(file, df);
    const r = rank + dr;
    if (f && isOnBoard(f, r)) {
      const p = board[sqStr(f, r)];
      if (p?.type === "n" && p.color === byColor) return true;
    }
  }

  // King attacks
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const f = fileOffset(file, df);
      const r = rank + dr;
      if (f && isOnBoard(f, r)) {
        const p = board[sqStr(f, r)];
        if (p?.type === "k" && p.color === byColor) return true;
      }
    }
  }

  // Sliding pieces (bishop, rook, queen)
  for (const { df, dr, types } of SLIDE_DIRECTIONS) {
    let f: string | null = file;
    let r = rank;
    while (true) {
      f = fileOffset(f, df);
      r = r + dr;
      if (!f || !isOnBoard(f, r)) break;
      const p = board[sqStr(f, r)];
      if (p) {
        if (p.color === byColor && types.includes(p.type)) return true;
        break;
      }
    }
  }

  return false;
}

/** Check if a given color's king is in check */
export function isInCheck(board: Board, color: Color): boolean {
  const kingSq = findKing(board, color);
  if (!kingSq) return false;
  return isSquareAttacked(board, kingSq, color === "w" ? "b" : "w");
}

/** Generate all pseudo-legal moves (does not filter for self-check) */
export function generatePseudoLegalMoves(
  board: Board,
  color: Color,
  enPassantTarget: Square | null,
  castlingRights: CastlingRights
): Move[] {
  const moves: Move[] = [];
  const dir = color === "w" ? 1 : -1;
  const startRank = color === "w" ? 2 : 7;
  const promoRank = color === "w" ? 8 : 1;

  for (const sq in board) {
    const piece = board[sq];
    if (!piece || piece.color !== color) continue;
    const { file, rank } = parseSquare(sq);

    if (piece.type === "p") {
      // Forward push
      const f1 = sqStr(file, rank + dir);
      if (!board[f1]) {
        if (rank + dir === promoRank) {
          for (const promo of ["q", "r", "b", "n"] as const) {
            moves.push({ from: sq, to: f1, promotion: promo });
          }
        } else {
          moves.push({ from: sq, to: f1 });
        }
        // Double push from starting rank
        if (rank === startRank) {
          const f2 = sqStr(file, rank + 2 * dir);
          if (!board[f2]) moves.push({ from: sq, to: f2 });
        }
      }
      // Pawn captures (including en passant)
      for (const df of [-1, 1]) {
        const cf = fileOffset(file, df);
        if (!cf) continue;
        const csq = sqStr(cf, rank + dir);
        if (board[csq] && board[csq].color !== color) {
          if (rank + dir === promoRank) {
            for (const promo of ["q", "r", "b", "n"] as const) {
              moves.push({ from: sq, to: csq, promotion: promo });
            }
          } else {
            moves.push({ from: sq, to: csq });
          }
        }
        if (enPassantTarget && csq === enPassantTarget) {
          moves.push({ from: sq, to: csq, enPassant: true });
        }
      }
    } else if (piece.type === "n") {
      for (const [df, dr] of KNIGHT_OFFSETS) {
        const f = fileOffset(file, df);
        const r = rank + dr;
        if (f && isOnBoard(f, r)) {
          const tsq = sqStr(f, r);
          if (!board[tsq] || board[tsq].color !== color) {
            moves.push({ from: sq, to: tsq });
          }
        }
      }
    } else if (piece.type === "k") {
      // Normal king moves
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const f = fileOffset(file, df);
          const r = rank + dr;
          if (f && isOnBoard(f, r)) {
            const tsq = sqStr(f, r);
            if (!board[tsq] || board[tsq].color !== color) {
              moves.push({ from: sq, to: tsq });
            }
          }
        }
      }
      // Castling
      const cr = castlingRights;
      const homeRank = color === "w" ? 1 : 8;
      const enemy: Color = color === "w" ? "b" : "w";
      if (rank === homeRank && file === "e") {
        // Kingside
        if (
          cr[`${color}K` as keyof CastlingRights] &&
          !board[sqStr("f", homeRank)] &&
          !board[sqStr("g", homeRank)] &&
          board[sqStr("h", homeRank)]?.type === "r" &&
          board[sqStr("h", homeRank)]?.color === color &&
          !isSquareAttacked(board, sq, enemy) &&
          !isSquareAttacked(board, sqStr("f", homeRank), enemy) &&
          !isSquareAttacked(board, sqStr("g", homeRank), enemy)
        ) {
          moves.push({ from: sq, to: sqStr("g", homeRank), castling: "K" });
        }
        // Queenside
        if (
          cr[`${color}Q` as keyof CastlingRights] &&
          !board[sqStr("d", homeRank)] &&
          !board[sqStr("c", homeRank)] &&
          !board[sqStr("b", homeRank)] &&
          board[sqStr("a", homeRank)]?.type === "r" &&
          board[sqStr("a", homeRank)]?.color === color &&
          !isSquareAttacked(board, sq, enemy) &&
          !isSquareAttacked(board, sqStr("d", homeRank), enemy) &&
          !isSquareAttacked(board, sqStr("c", homeRank), enemy)
        ) {
          moves.push({ from: sq, to: sqStr("c", homeRank), castling: "Q" });
        }
      }
    } else {
      // Sliding pieces (rook, bishop, queen)
      const dirs: number[][] = [];
      if (piece.type === "r" || piece.type === "q") {
        dirs.push([0, 1], [0, -1], [1, 0], [-1, 0]);
      }
      if (piece.type === "b" || piece.type === "q") {
        dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      }
      for (const [df, dr] of dirs) {
        let f: string | null = file;
        let r = rank;
        while (true) {
          f = fileOffset(f, df);
          r = r + dr;
          if (!f || !isOnBoard(f, r)) break;
          const tsq = sqStr(f, r);
          if (board[tsq]) {
            if (board[tsq].color !== color) moves.push({ from: sq, to: tsq });
            break;
          }
          moves.push({ from: sq, to: tsq });
        }
      }
    }
  }

  return moves;
}

/** Generate all legal moves for a color (filters out moves that leave king in check) */
export function getLegalMoves(
  board: Board,
  color: Color,
  enPassantTarget: Square | null,
  castlingRights: CastlingRights
): Move[] {
  const pseudoMoves = generatePseudoLegalMoves(board, color, enPassantTarget, castlingRights);
  return pseudoMoves.filter((move) => {
    const newBoard = makeMove(board, move);
    return !isInCheck(newBoard, color);
  });
}
