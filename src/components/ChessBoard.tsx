import React, { useEffect, useRef, useState } from "react";
import type { Board, CapturedPieces, Color, GameMode, Move, Piece, PulseType, Square } from "@/types";
import type { RootNote, ScaleDefinition } from "@/audio/scales";
import { FILES, RANKS, PIECE_SYMBOLS, PIECE_VALUES } from "@/constants";
import { sqStr } from "@/engine";
import { BoardSquare } from "./BoardSquare";

interface ChessBoardProps {
  board: Board;
  turn: Color;
  selected: Square | null;
  legalSquares: Move[];
  lastMove: Move | null;
  squarePulse: Record<string, PulseType>;
  tension: number;
  mode: GameMode;
  audioStarted: boolean;
  boardFlipped: boolean;
  capturedPieces: CapturedPieces;
  rootNote?: RootNote;
  scale?: ScaleDefinition;
  onSquareClick: (sq: Square) => void;
  onSquareHover?: (sq: string, piece: Piece | undefined) => void;
  onSquareHoverEnd?: (sq: string) => void;
}

/** Duration of the sliding animation in ms */
const SLIDE_DURATION = 350;

/** Size of a single board square in pixels */
const SQUARE_SIZE = 60;

/** Compute pixel position of a square on the board */
function squareToPixel(sq: string, flipped: boolean): { x: number; y: number } {
  const file = sq[0];
  const rank = parseInt(sq[1]);
  const colIdx = flipped ? (7 - FILES.indexOf(file)) : FILES.indexOf(file);
  const rowIdx = flipped ? (rank - 1) : (8 - rank);
  return { x: colIdx * SQUARE_SIZE, y: rowIdx * SQUARE_SIZE };
}

/** The full chess board with captured pieces displayed above and below */
export const ChessBoard: React.FC<ChessBoardProps> = ({
  board, turn, selected, legalSquares, lastMove, squarePulse,
  tension, mode, audioStarted, boardFlipped, capturedPieces,
  rootNote, scale,
  onSquareClick, onSquareHover, onSquareHoverEnd,
}) => {
  const ranks = boardFlipped ? [...RANKS] : [...RANKS].reverse();
  const files = boardFlipped ? [...FILES].reverse() : [...FILES];

  // ─── SLIDING PIECE ANIMATION ─────────────────────────
  const [animating, setAnimating] = useState<{
    symbol: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  const [animPhase, setAnimPhase] = useState<"start" | "end">("start");
  const prevLastMove = useRef<Move | null>(null);

  useEffect(() => {
    // Detect a new move (lastMove changed to something non-null)
    if (lastMove && lastMove !== prevLastMove.current) {
      // Look up the piece that just moved — it's now at the destination
      const piece = board[lastMove.to];
      if (piece) {
        const symbol = PIECE_SYMBOLS[piece.color + piece.type];
        const from = squareToPixel(lastMove.from, boardFlipped);
        const to = squareToPixel(lastMove.to, boardFlipped);

        // Start animation at source position
        setAnimPhase("start");
        setAnimating({ symbol, from, to });

        // Trigger transition to destination on next frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimPhase("end");
          });
        });

        // Clear animation after transition completes
        const timer = setTimeout(() => {
          setAnimating(null);
          setAnimPhase("start");
        }, SLIDE_DURATION + 50);

        prevLastMove.current = lastMove;
        return () => clearTimeout(timer);
      }
    }
    prevLastMove.current = lastMove;
  }, [lastMove, board, boardFlipped]);

  return (
    <div>
      {/* Captured by black (shown on top) */}
      <div style={{ height: 28, marginBottom: 4, display: "flex", gap: 2, justifyContent: "center" }}>
        {[...capturedPieces.w]
          .sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a])
          .map((t, i) => (
            <span key={i} style={{ fontSize: 18, opacity: 0.6 }}>
              {PIECE_SYMBOLS["w" + t]}
            </span>
          ))}
      </div>

      {/* Board grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 60px)",
        gridTemplateRows: "repeat(8, 60px)",
        border: "2px solid #c9a84c44",
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: `0 0 ${20 + tension * 3}px rgba(201,168,76,${0.1 + tension * 0.02})`,
        transition: "box-shadow 1s ease",
        position: "relative",
      }}>
        {ranks.map((rank) =>
          files.map((file) => {
            const sq = sqStr(file, rank);
            const piece = board[sq];
            const isLastMoveSquare = !!(lastMove && (lastMove.from === sq || lastMove.to === sq));
            const isLastMoveDest = !!(isLastMoveSquare && lastMove && lastMove.to === sq);

            // Hide the piece at the destination while the slide animation is playing
            const hideForAnimation = animating && isLastMoveDest;

            return (
              <BoardSquare
                key={sq}
                sq={sq}
                file={file}
                rank={rank}
                piece={hideForAnimation ? undefined : piece}
                board={board}
                isSelected={selected === sq}
                isLegalTarget={legalSquares.some((m) => m.to === sq)}
                isLastMoveSquare={isLastMoveSquare}
                isLastMoveDest={isLastMoveDest}
                pulse={squarePulse[sq]}
                tension={tension}
                turn={turn}
                mode={mode}
                audioStarted={audioStarted}
                boardFlipped={boardFlipped}
                rootNote={rootNote}
                scale={scale}
                onClick={() => onSquareClick(sq)}
                onHover={onSquareHover}
                onHoverEnd={onSquareHoverEnd}
              />
            );
          })
        )}

        {/* Sliding piece overlay */}
        {animating && (
          <span
            style={{
              position: "absolute",
              width: 60,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
              zIndex: 10,
              left: animPhase === "start" ? animating.from.x : animating.to.x,
              top: animPhase === "start" ? animating.from.y : animating.to.y,
              transition: `left ${SLIDE_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1), top ${SLIDE_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            }}
          >
            {animating.symbol}
          </span>
        )}
      </div>

      {/* Captured by white (shown below) */}
      <div style={{ height: 28, marginTop: 4, display: "flex", gap: 2, justifyContent: "center" }}>
        {[...capturedPieces.b]
          .sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a])
          .map((t, i) => (
            <span key={i} style={{ fontSize: 18, opacity: 0.6 }}>
              {PIECE_SYMBOLS["b" + t]}
            </span>
          ))}
      </div>
    </div>
  );
};
