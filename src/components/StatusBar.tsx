import React from "react";
import type { Color, GameMode, GameStatus, MaterialBalance, PlayerRole, ReplayMove } from "@/types";
import { statusBarBg } from "@/styles/theme";

interface StatusBarProps {
  gameStatus: GameStatus;
  turn: Color;
  mode: GameMode;
  aiThinking: boolean;
  replayIndex: number;
  replayMoves: ReplayMove[];
  materialDiff: MaterialBalance;
  // Multiplayer props
  onlineRole?: PlayerRole | null;
  onlineColor?: Color | null;
}

/** Displays current game state: turn, check, material balance */
export const StatusBar: React.FC<StatusBarProps> = ({
  gameStatus, turn, mode, aiThinking,
  replayIndex, replayMoves, materialDiff,
  onlineRole, onlineColor,
}) => {
  let text: string;
  if (gameStatus === "checkmate") {
    text = `♚ CHECKMATE — ${turn === "w" ? "Black" : "White"} wins!`;
  } else if (gameStatus === "stalemate") {
    text = "½ STALEMATE — Draw";
  } else if (gameStatus === "check") {
    if (mode === "online" && onlineRole === "spectator") {
      text = `⚠ ${turn === "w" ? "White" : "Black"} is in CHECK`;
    } else if (mode === "online" && onlineColor) {
      text = turn === onlineColor ? "⚠ You are in CHECK!" : "⚠ Opponent is in CHECK";
    } else {
      text = `⚠ ${turn === "w" ? "White" : "Black"} is in CHECK`;
    }
  } else if (aiThinking) {
    text = "🤔 AI is thinking...";
  } else if (mode === "replay") {
    text = `📼 Replay — Move ${replayIndex}/${replayMoves.length}`;
  } else if (mode === "online") {
    if (onlineRole === "spectator") {
      text = `👁 Spectating — ${turn === "w" ? "White" : "Black"} to move`;
    } else if (onlineColor) {
      text = turn === onlineColor ? "🎯 Your turn" : "⏳ Opponent's turn";
    } else {
      text = `${turn === "w" ? "White" : "Black"} to move`;
    }
  } else if (mode === "local") {
    text = `${turn === "w" ? "⬜ White" : "⬛ Black"} to move`;
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
      {(mode === "play" || mode === "local" || mode === "online") && (
        <span style={{ marginLeft: 12, color: "#888", fontSize: 11 }}>
          Material: W{materialDiff.white} / B{materialDiff.black}
        </span>
      )}
    </div>
  );
};
