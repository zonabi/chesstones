import { useState, useCallback, useEffect, useRef } from "react";
import type { Board, CapturedPieces, CastlingRights, Color, Move, PulseType, ReplayMove, Square } from "@/types";
import { AudioEngine } from "@/audio";
import { createInitialBoard, makeMove, sqStr } from "@/engine";
import { parsePGN, sanToMove } from "@/pgn";

interface UseReplayReturn {
  replayMoves: ReplayMove[];
  replayIndex: number;
  isReplaying: boolean;
  loadPGN: (pgn: string) => void;
  stepReplay: (idx: number) => void;
  toggleAutoReplay: () => void;
}

/**
 * Manages PGN game replay: loading, stepping, auto-play.
 */
export function useReplay(
  audioRef: React.RefObject<AudioEngine | null>,
  enterReplayMode: () => void,
  restoreState: (state: {
    board: Board;
    turn: Color;
    castling: CastlingRights;
    enPassant: Square | null;
    lastMove: Move | null;
    moveNotation: string[];
    capturedPieces: CapturedPieces;
    squarePulse: Record<string, PulseType>;
  }) => void
): UseReplayReturn {
  const [replayMoves, setReplayMoves] = useState<ReplayMove[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, []);

  // ─── LOAD PGN ─────────────────────────────────────────

  const loadPGN = useCallback((pgn: string) => {
    const sanMoves = parsePGN(pgn);
    let currentBoard: Board = createInitialBoard();
    let currentColor: Color = "w";
    let currentEP: Square | null = null;
    let currentCastling: CastlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    const movesResolved: ReplayMove[] = [];

    for (const san of sanMoves) {
      const move = sanToMove(san, currentBoard, currentColor, currentEP, currentCastling);
      if (!move) {
        console.warn("Failed to parse move:", san);
        break;
      }
      movesResolved.push({ san, move, boardBefore: currentBoard });

      const piece = currentBoard[move.from];
      currentBoard = makeMove(currentBoard, move);

      if (piece?.type === "k") {
        currentCastling = {
          ...currentCastling,
          [`${currentColor}K`]: false,
          [`${currentColor}Q`]: false,
        } as CastlingRights;
      }
      if (piece?.type === "r") {
        if (move.from === "a1") currentCastling = { ...currentCastling, wQ: false };
        if (move.from === "h1") currentCastling = { ...currentCastling, wK: false };
        if (move.from === "a8") currentCastling = { ...currentCastling, bQ: false };
        if (move.from === "h8") currentCastling = { ...currentCastling, bK: false };
      }

      currentEP = piece?.type === "p" && Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2
        ? sqStr(move.from[0], (parseInt(move.from[1]) + parseInt(move.to[1])) / 2)
        : null;

      currentColor = currentColor === "w" ? "b" : "w";
    }

    setReplayMoves(movesResolved);
    setReplayIndex(0);
    setIsReplaying(false);
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    enterReplayMode();
  }, [enterReplayMode]);

  // ─── STEP REPLAY ──────────────────────────────────────

  const stepReplay = useCallback((idx: number) => {
    if (idx < 0 || idx > replayMoves.length) return;

    let currentBoard: Board = createInitialBoard();
    const currentCastling: CastlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    let currentEP: Square | null = null;
    const notations: string[] = [];
    const caps: CapturedPieces = { w: [], b: [] };

    for (let i = 0; i < idx; i++) {
      const { move, san } = replayMoves[i];
      const piece = currentBoard[move.from];
      const captured = currentBoard[move.to];

      notations.push(san);
      if (captured) caps[captured.color].push(captured.type);

      // Play sound for the most recent move only
      if (i === idx - 1 && audioRef.current?.isInitialized) {
        audioRef.current.playMove(
          move.from, move.to, piece?.type || "p",
          !!captured, !!move.castling, false
        );
      }

      currentBoard = makeMove(currentBoard, move);

      if (piece?.type === "k") {
        currentCastling[`${piece.color}K` as keyof CastlingRights] = false;
        currentCastling[`${piece.color}Q` as keyof CastlingRights] = false;
      }
      if (piece?.type === "r") {
        if (move.from === "a1") currentCastling.wQ = false;
        if (move.from === "h1") currentCastling.wK = false;
        if (move.from === "a8") currentCastling.bQ = false;
        if (move.from === "h8") currentCastling.bK = false;
      }
      currentEP = piece?.type === "p" && Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2
        ? sqStr(move.from[0], (parseInt(move.from[1]) + parseInt(move.to[1])) / 2)
        : null;
    }

    setReplayIndex(idx);

    const lastReplayMove = idx > 0 ? replayMoves[idx - 1].move : null;
    restoreState({
      board: currentBoard,
      turn: (idx % 2 === 0 ? "w" : "b") as Color,
      castling: currentCastling,
      enPassant: currentEP,
      lastMove: lastReplayMove,
      moveNotation: notations,
      capturedPieces: caps,
      squarePulse: lastReplayMove
        ? { [lastReplayMove.from]: "departure" as PulseType, [lastReplayMove.to]: "arrival" as PulseType }
        : {},
    });
  }, [replayMoves, audioRef, restoreState]);

  // ─── AUTO-REPLAY TOGGLE ───────────────────────────────

  const toggleAutoReplay = useCallback(() => {
    if (isReplaying) {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
      setIsReplaying(false);
    } else {
      setIsReplaying(true);
      let idx = replayIndex;
      replayTimerRef.current = setInterval(() => {
        idx++;
        if (idx > replayMoves.length) {
          if (replayTimerRef.current) clearInterval(replayTimerRef.current);
          setIsReplaying(false);
          return;
        }
        stepReplay(idx);
      }, 1500);
    }
  }, [isReplaying, replayIndex, replayMoves, stepReplay]);

  return { replayMoves, replayIndex, isReplaying, loadPGN, stepReplay, toggleAutoReplay };
}
