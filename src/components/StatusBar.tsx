import React from "react";
import type { Color, GameMode, GameStatus, MaterialBalance, ReplayMove } from "@/types";
import { statusBarBg } from "@/styles/theme";

interface StatusBarProps {
  gameStatus: GameStatus;
  turn: Color;
  mode: GameMode;
  aiThinking: boolean;
  replayIndex: number;
  replayMoves: ReplayMove[];
  materialDiff: MaterialBalance;
}

/** Displays current game state: turn, check, material balance */
export const StatusBar: React.FC<StatusBarProps> = ({
  gameStatus, turn, mode, aiThinking,
  replayIndex, replayMoves, materialDiff,
}) => {
  let text: string;
  if (gameStatus === "checkmate") {
    text = `♚ CHECKMATE — ${turn === "w" ? "Black" : "White"} wins!`;
  } else if (gameStatus === "stalemate") {
    text = "½ STALEMATE — Draw";
  } else if (gameStatus === "check") {
    text = `⚠ ${turn === "w" ? "White" : "Black"} is in CHECK`;
  } else if (aiThinking) {
    text = "🤔 AI is thinking...";
  } else if (mode === "replay") {
    text = `📼 Replay — Move ${replayIndex}/${replayMoves.length}`;
  } else {
    text = `${turn === "w" ? "White" : "Black"} to move`;
  }

  return (
    <div style={{
      marginBottom: 12, padding: "6px 20px", borderRadius: 20,
      background: statusBarBg(gameStatus),
      fontSize: 13, letterSpacing: 1, textAlign: "center",
      border: `1px solid ${gameStatus === "check" ? "#c9a84c44" : "#ffffff10"}`,
      transition: "all 0.5s",
    }}>
      {text}
      {mode === "play" && (
        <span style={{ marginLeft: 12, color: "#888", fontSize: 11 }}>
          Material: W{materialDiff.white} / B{materialDiff.black}
        </span>
      )}
    </div>
  );
};
