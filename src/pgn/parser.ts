import type { Board, CastlingRights, Color, Move, Square } from "@/types";
import { getLegalMoves } from "@/engine";
import { sqStr } from "@/engine";

/**
 * Parse a PGN string into an array of SAN move tokens.
 * Strips headers, comments, variations, and the result marker.
 */
export function parsePGN(pgn: string): string[] {
  let moveText = pgn
    .replace(/\[.*?\]\s*/g, "")     // Strip headers
    .trim();
  moveText = moveText
    .replace(/\{[^}]*\}/g, "")      // Strip comments
    .replace(/\([^)]*\)/g, "");     // Strip variations
  moveText = moveText
    .replace(/\s*(1-0|0-1|1\/2-1\/2|\*)?\s*$/, ""); // Strip result

  return moveText
    .split(/\s+/)
    .filter((t) => !t.match(/^\d+\.+$/)); // Remove move numbers
}

/**
 * Convert a SAN (Standard Algebraic Notation) string to a Move object
 * by matching it against the legal moves in the current position.
 */
export function sanToMove(
  san: string,
  board: Board,
  color: Color,
  enPassant: Square | null,
  castling: CastlingRights
): Move | undefined {
  const legalMoves = getLegalMoves(board, color, enPassant, castling);
  let cleanSan = san.replace(/[+#!?]+$/, "");

  // Castling
  if (cleanSan === "O-O" || cleanSan === "0-0") {
    return legalMoves.find((m) => m.castling === "K");
  }
  if (cleanSan === "O-O-O" || cleanSan === "0-0-0") {
    return legalMoves.find((m) => m.castling === "Q");
  }

  // Promotion
  let promotion: string | null = null;
  if (cleanSan.includes("=")) {
    promotion = cleanSan.split("=")[1].toLowerCase();
    cleanSan = cleanSan.split("=")[0];
  }

  // Capture marker
  cleanSan = cleanSan.replace("x", "");

  // Piece type
  let pieceType: string;
  if (cleanSan[0] >= "A" && cleanSan[0] <= "Z") {
    pieceType = cleanSan[0].toLowerCase();
    if (pieceType === "o") pieceType = "k"; // safety
    cleanSan = cleanSan.slice(1);
  } else {
    pieceType = "p";
  }

  // Target square is always the last two characters
  const toFile = cleanSan[cleanSan.length - 2];
  const toRank = parseInt(cleanSan[cleanSan.length - 1]);
  const disambig = cleanSan.slice(0, cleanSan.length - 2);

  let disambigFile: string | undefined;
  let disambigRank: number | undefined;

  if (disambig.length >= 1) {
    if (disambig[0] >= "a" && disambig[0] <= "h") disambigFile = disambig[0];
    else if (disambig[0] >= "1" && disambig[0] <= "8") disambigRank = parseInt(disambig[0]);
  }
  if (disambig.length >= 2) {
    disambigRank = parseInt(disambig[1]);
  }

  const target = sqStr(toFile, toRank);

  return legalMoves.find((m) => {
    const piece = board[m.from];
    if (!piece || piece.type !== pieceType) return false;
    if (m.to !== target) return false;
    if (promotion && m.promotion !== promotion) return false;
    if (disambigFile && m.from[0] !== disambigFile) return false;
    if (disambigRank && parseInt(m.from[1]) !== disambigRank) return false;
    return true;
  });
}
