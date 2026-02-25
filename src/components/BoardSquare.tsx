import React from "react";
import type { Board, Color, GameMode, Piece, PulseType } from "@/types";
import { FILES, PIECE_SYMBOLS } from "@/constants";
import { squareToNote } from "@/constants";
import { isSquareAttacked } from "@/engine";

interface BoardSquareProps {
  sq: string;
  file: string;
  rank: number;
  piece: Piece | undefined;
  board: Board;
  isSelected: boolean;
  isLegalTarget: boolean;
  isLastMoveSquare: boolean;
  isLastMoveDest: boolean;
  pulse: PulseType | undefined;
  tension: number;
  turn: Color;
  mode: GameMode;
  audioStarted: boolean;
  boardFlipped: boolean;
  onClick: () => void;
}

/** A single square on the chess board with dynamic coloring and piece display */
export const BoardSquare: React.FC<BoardSquareProps> = React.memo(({
  sq, file, rank, piece, board,
  isSelected, isLegalTarget, isLastMoveSquare, isLastMoveDest,
  pulse, tension, turn, mode, audioStarted, boardFlipped,
  onClick,
}) => {
  const isLight = (FILES.indexOf(file) + rank) % 2 === 1;

  // Dynamic square color based on tension + state
  let bgColor: string;
  if (isSelected) {
    bgColor = "#c9a84c88";
  } else if (pulse === "arrival") {
    bgColor = "#c9a84caa";
  } else if (pulse === "departure") {
    bgColor = "#c9a84c44";
  } else if (isLastMoveSquare) {
    bgColor = isLight ? "#b8c96c55" : "#8aa84c55";
  } else {
    const tensionShift = tension / 20;
    bgColor = isLight
      ? `rgb(${180 + tensionShift * 30}, ${170 - tensionShift * 30}, ${150 - tensionShift * 40})`
      : `rgb(${80 + tensionShift * 40}, ${60 - tensionShift * 20}, ${70 - tensionShift * 20})`;
  }

  // Piece glow when attacked
  let pieceGlow = "none";
  if (piece && audioStarted) {
    const enemy: Color = piece.color === "w" ? "b" : "w";
    if (isSquareAttacked(board, sq, enemy)) {
      pieceGlow = piece.type === "k"
        ? "0 0 15px rgba(255,50,50,0.8)"
        : "0 0 8px rgba(255,150,50,0.5)";
    }
  }

  // Coordinate labels
  const showFileLabel = rank === (boardFlipped ? 8 : 1);
  const showRankLabel = file === (boardFlipped ? "h" : "a");

  return (
    <div onClick={onClick} style={{
      width: 60, height: 60,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: bgColor,
      cursor: mode === "play" ? "pointer" : "default",
      position: "relative",
      transition: "background 0.3s ease",
      animation: pulse ? "pulse 0.6s ease" : undefined,
    }}>
      {/* Legal move indicator */}
      {isLegalTarget && (
        <div style={{
          position: "absolute",
          width: piece ? 54 : 18,
          height: piece ? 54 : 18,
          borderRadius: "50%",
          background: piece ? "transparent" : "rgba(201,168,76,0.4)",
          border: piece ? "3px solid rgba(201,168,76,0.5)" : "none",
        }} />
      )}

      {/* Piece */}
      {piece && (
        <span style={{
          fontSize: 40, lineHeight: 1, userSelect: "none",
          textShadow: pieceGlow,
          filter: isSelected ? "brightness(1.3)" : "none",
          transition: "all 0.3s",
          cursor: mode === "play" && piece.color === turn ? "grab" : "default",
        }}>
          {PIECE_SYMBOLS[piece.color + piece.type]}
        </span>
      )}

      {/* Coordinate labels */}
      {(showFileLabel || showRankLabel) && (
        <span style={{
          position: "absolute",
          fontSize: 9,
          color: isLight ? "#66605090" : "#aa9a8090",
          bottom: showFileLabel ? 1 : undefined,
          right: showFileLabel ? 2 : undefined,
          left: showRankLabel ? 2 : undefined,
          top: showRankLabel ? 1 : undefined,
        }}>
          {showFileLabel ? file : ""}
          {showRankLabel ? rank : ""}
        </span>
      )}

      {/* Musical note label on last move destination */}
      {isLastMoveDest && (
        <span style={{
          position: "absolute", top: 1, right: 2, fontSize: 8,
          color: "#c9a84c", opacity: 0.7, fontFamily: "monospace",
        }}>
          {squareToNote(file, rank)}
        </span>
      )}
    </div>
  );
});

BoardSquare.displayName = "BoardSquare";
