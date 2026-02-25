import React from "react";
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

/** The full chess board with captured pieces displayed above and below */
export const ChessBoard: React.FC<ChessBoardProps> = ({
  board, turn, selected, legalSquares, lastMove, squarePulse,
  tension, mode, audioStarted, boardFlipped, capturedPieces,
  rootNote, scale,
  onSquareClick, onSquareHover, onSquareHoverEnd,
}) => {
  const ranks = boardFlipped ? [...RANKS] : [...RANKS].reverse();
  const files = boardFlipped ? [...FILES].reverse() : [...FILES];

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
      }}>
        {ranks.map((rank) =>
          files.map((file) => {
            const sq = sqStr(file, rank);
            const piece = board[sq];
            const isLastMoveSquare = !!(lastMove && (lastMove.from === sq || lastMove.to === sq));
            const isLastMoveDest = !!(isLastMoveSquare && lastMove && lastMove.to === sq);

            return (
              <BoardSquare
                key={sq}
                sq={sq}
                file={file}
                rank={rank}
                piece={piece}
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
