import { useEffect, useMemo, useState } from "react";
import { useAudio, useChessGame, useReplay } from "@/hooks";
import { getMaterialBalance, getTension, getPieceCount } from "@/engine";
import { tensionColor, tabStyle, smallBtnStyle, GOLD_GRADIENT, GLOBAL_CSS, GOLD } from "@/styles/theme";

import { AudioOverlay } from "./AudioOverlay";
import { ChessBoard } from "./ChessBoard";
import { StatusBar } from "./StatusBar";
import { SidePanel } from "./SidePanel";
import { PromotionDialog } from "./PromotionDialog";

/**
 * Root application component for ChessTones.
 * Orchestrates hooks and composes sub-components.
 */
export default function ChessTones() {
  const [boardFlipped, setBoardFlipped] = useState(false);

  // ─── HOOKS (order matters: audio first, then game uses audioRef) ───

  const { audioRef, audioStarted, volume, startAudio, setVolume } = useAudio();

  const game = useChessGame(audioRef, audioStarted);

  const replay = useReplay(audioRef, game.enterReplayMode, game.restoreState);

  // ─── BOARD-REACTIVE AUDIO (syncs ambient to game tension) ─────────

  const [tension, setTension] = useState(0);

  useEffect(() => {
    if (!audioStarted || !audioRef.current) return;

    const mat = getMaterialBalance(game.board);
    const t = getTension(game.board, game.turn);
    const pc = getPieceCount(game.board);
    setTension(t);
    audioRef.current.updateTension(t);

    const restartTimer = setTimeout(() => {
      if (audioRef.current?.isInitialized) {
        audioRef.current.startAmbient(t, mat.balance, pc);
      }
    }, 500);

    return () => clearTimeout(restartTimer);
  }, [game.board, game.turn, audioStarted, audioRef]);

  // ─── DERIVED STATE ────────────────────────────────────────────────

  const bgColor = useMemo(() => tensionColor(tension), [tension]);
  const materialDiff = useMemo(() => getMaterialBalance(game.board), [game.board]);

  // ─── RENDER ───────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${bgColor} 0%, #0a0a12 40%, #0f0f1a 100%)`,
      color: "#e0e0e0",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
      transition: "background 1s ease",
    }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{
          fontSize: 36, fontWeight: 300, letterSpacing: 8,
          background: GOLD_GRADIENT,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, textTransform: "uppercase",
        }}>
          ♔ ChessTones ♕
        </h1>
        <p style={{ fontSize: 13, color: "#888", letterSpacing: 3, margin: "4px 0 0" }}>
          WHERE EVERY MOVE IS MUSIC
        </p>
      </div>

      {/* Audio start overlay */}
      {!audioStarted && <AudioOverlay onStart={startAudio} />}

      {/* Mode tabs & controls */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 15,
        alignItems: "center", flexWrap: "wrap", justifyContent: "center",
      }}>
        <button onClick={game.newGame} style={tabStyle(game.mode === "play")}>
          ♟ Play vs AI
        </button>
        <button
          onClick={() => game.setMode(game.mode === "replay" ? "play" : "replay")}
          style={tabStyle(game.mode === "replay")}
        >
          📼 Replay
        </button>
        <button onClick={() => setBoardFlipped(!boardFlipped)} style={smallBtnStyle}>
          🔄 Flip
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#888" }}>🔊</span>
          <input
            type="range" min="0" max="1" step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: 80, accentColor: GOLD }}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        gameStatus={game.gameStatus}
        turn={game.turn}
        mode={game.mode}
        aiThinking={game.aiThinking}
        replayIndex={replay.replayIndex}
        replayMoves={replay.replayMoves}
        materialDiff={materialDiff}
      />

      {/* Main layout: board + side panel */}
      <div style={{
        display: "flex", gap: 20, alignItems: "flex-start",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        <ChessBoard
          board={game.board}
          turn={game.turn}
          selected={game.selected}
          legalSquares={game.legalSquares}
          lastMove={game.lastMove}
          squarePulse={game.squarePulse}
          tension={tension}
          mode={game.mode}
          audioStarted={audioStarted}
          boardFlipped={boardFlipped}
          capturedPieces={game.capturedPieces}
          onSquareClick={game.handleSquareClick}
        />

        <SidePanel
          tension={tension}
          moveNotation={game.moveNotation}
          mode={game.mode}
          replayMoves={replay.replayMoves}
          replayIndex={replay.replayIndex}
          isReplaying={replay.isReplaying}
          onStep={replay.stepReplay}
          onToggleAutoReplay={replay.toggleAutoReplay}
          onLoadPGN={replay.loadPGN}
        />
      </div>

      {/* Promotion dialog */}
      {game.showPromotion && (
        <PromotionDialog onSelect={game.handlePromotion} />
      )}

      {/* Global CSS animations */}
      <style>{GLOBAL_CSS}</style>
    </div>
  );
}
