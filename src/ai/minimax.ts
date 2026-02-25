import type { Board, CastlingRights, Move, Square } from "@/types";
import { PIECE_VALUES } from "@/constants";
import { makeMove, sqStr } from "@/engine";
import { getLegalMoves, isInCheck } from "@/engine";
import { getPieceCount } from "@/engine";
import { evaluateBoard } from "./evaluation";

interface MinimaxResult {
  score: number;
  move: Move | null;
}

/**
 * Minimax search with alpha-beta pruning.
 * Move ordering: captures sorted by victim value for better pruning.
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  enPassant: Square | null,
  castling: CastlingRights
): MinimaxResult {
  if (depth === 0) {
    return { score: evaluateBoard(board), move: null };
  }

  const currentColor = maximizing ? "w" : "b";
  const moves = getLegalMoves(board, currentColor, enPassant, castling);

  if (moves.length === 0) {
    if (isInCheck(board, currentColor)) {
      return { score: maximizing ? -99999 : 99999, move: null };
    }
    return { score: 0, move: null }; // stalemate
  }

  // Move ordering: captures first, sorted by victim value (MVV-LVA idea)
  moves.sort((a, b) => {
    const aCapture = board[a.to] ? PIECE_VALUES[board[a.to].type] : 0;
    const bCapture = board[b.to] ? PIECE_VALUES[board[b.to].type] : 0;
    return bCapture - aCapture;
  });

  let bestMove = moves[0];

  if (maximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      const newEP = computeEnPassantTarget(board, move);
      const newCastling = computeNextCastling(board, move, castling);
      const { score } = minimax(newBoard, depth - 1, alpha, beta, false, newEP, newCastling);
      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      const newEP = computeEnPassantTarget(board, move);
      const newCastling = computeNextCastling(board, move, castling);
      const { score } = minimax(newBoard, depth - 1, alpha, beta, true, newEP, newCastling);
      if (score < minScore) {
        minScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: minScore, move: bestMove };
  }
}

/** Compute the en passant target square after a move (if it was a double pawn push) */
function computeEnPassantTarget(board: Board, move: Move): Square | null {
  if (
    board[move.from]?.type === "p" &&
    Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2
  ) {
    return sqStr(
      move.from[0],
      (parseInt(move.from[1]) + parseInt(move.to[1])) / 2
    );
  }
  return null;
}

/**
 * Derive updated castling rights after a move.
 * King moves revoke both castling rights for that color.
 * Rook moves from a corner revoke the corresponding right.
 */
function computeNextCastling(board: Board, move: Move, castling: CastlingRights): CastlingRights {
  const piece = board[move.from];
  if (!piece) return castling;

  let next = castling;

  if (piece.type === "k") {
    next = {
      ...next,
      [`${piece.color}K`]: false,
      [`${piece.color}Q`]: false,
    } as CastlingRights;
  }

  if (piece.type === "r") {
    if (move.from === "a1" && next.wQ) next = { ...next, wQ: false };
    if (move.from === "h1" && next.wK) next = { ...next, wK: false };
    if (move.from === "a8" && next.bQ) next = { ...next, bQ: false };
    if (move.from === "h8" && next.bK) next = { ...next, bK: false };
  }

  return next;
}

/**
 * Get the best move for Black using minimax with alpha-beta pruning.
 * Search depth adapts to piece count (deeper in endgames).
 */
export function getAIMove(
  board: Board,
  enPassant: Square | null,
  castling: CastlingRights
): Move | null {
  const pieceCount = getPieceCount(board);
  const depth = pieceCount < 10 ? 4 : 3;
  const result = minimax(board, depth, -Infinity, Infinity, false, enPassant, castling);
  return result.move;
}
