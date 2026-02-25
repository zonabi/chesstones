import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAudio, useAudioSettings, useChessGame, useReplay } from "@/hooks";
import { getMaterialBalance, getTension, getPieceCount, parseSquare } from "@/engine";
import { squareToFreq } from "@/constants";
import { tensionColor, tabStyle, smallBtnStyle, GOLD_GRADIENT, GLOBAL_CSS, GOLD } from "@/styles/theme";
import type { Piece } from "@/types";

import { AudioOverlay } from "./AudioOverlay";
import { AudioSettingsPanel } from "./AudioSettingsPanel";
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
  const audioSettingsHook = useAudioSettings();
  const { settings } = audioSettingsHook;

  const game = useChessGame(audioRef, audioStarted, settings);

  const replay = useReplay(audioRef, game.enterReplayMode, game.restoreState);

  // ─── THEME SYNC (push theme to AudioEngine when it changes) ────────

  useEffect(() => {
    if (audioRef.current?.isInitialized) {
      audioRef.current.setTheme(settings.theme);
    }
  }, [settings.theme, audioRef]);

  // ─── BOARD-REACTIVE AUDIO (syncs ambient to game tension) ─────────

  // tension is derived state — computed from board, never stored separately
  const tension = useMemo(() => getTension(game.board, game.turn), [game.board, game.turn]);

  useEffect(() => {
    if (!audioStarted || !audioRef.current) return;

    const mat = getMaterialBalance(game.board);
    const pc = getPieceCount(game.board);
    audioRef.current.updateTension(tension);

    const restartTimer = setTimeout(() => {
      if (audioRef.current?.isInitialized) {
        audioRef.current.startAmbient(tension, mat.balance, pc);
      }
    }, 500);

    return () => clearTimeout(restartTimer);
  }, [game.board, game.turn, tension, audioStarted, audioRef]);

  // ─── HOVER SOUND HANDLER (with debounce) ──────────────────────────

  const lastHoveredSq = useRef<string | null>(null);
  const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSquareHover = useCallback((sq: string, piece: Piece | undefined) => {
    if (!audioStarted || !settings.data.hoverSoundEnabled) return;
    if (sq === lastHoveredSq.current) return;

    lastHoveredSq.current = sq;

    // Debounce: clear any pending hover sound
    if (hoverDebounceRef.current) clearTimeout(hoverDebounceRef.current);

    hoverDebounceRef.current = setTimeout(() => {
      if (!audioRef.current?.isInitialized) return;
      const { file, rank } = parseSquare(sq);
      const rootNote = settings.data.rootNote;
      const freq = squareToFreq(file, rank, rootNote, settings.scale);
      const pieceType = piece?.type ?? "p";
      audioRef.current.playPreview(freq, pieceType);
    }, 40);
  }, [audioStarted, settings.data.hoverSoundEnabled, settings.data.rootNote, settings.scale, audioRef]);

  const handleSquareHoverEnd = useCallback((_sq: string) => {
    lastHoveredSq.current = null;
    if (hoverDebounceRef.current) {
      clearTimeout(hoverDebounceRef.current);
      hoverDebounceRef.current = null;
    }
  }, []);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverDebounceRef.current) {
        clearTimeout(hoverDebounceRef.current);
      }
    };
  }, []);

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
        <AudioSettingsPanel audioSettings={audioSettingsHook} />
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
          rootNote={settings.data.rootNote}
          scale={settings.scale}
          onSquareClick={game.handleSquareClick}
          onSquareHover={handleSquareHover}
          onSquareHoverEnd={handleSquareHoverEnd}
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

      {/* Descriptive blurb */}
      <div style={{
        maxWidth: 680,
        marginTop: 36,
        textAlign: "center",
        padding: "28px 32px",
        background: "rgba(20,20,32,0.6)",
        border: "1px solid rgba(201,168,76,0.15)",
        borderRadius: 12,
        backdropFilter: "blur(8px)",
      }}>
        <p style={{
          fontSize: 13,
          letterSpacing: 3,
          textTransform: "uppercase",
          background: GOLD_GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: "0 0 14px",
          fontWeight: 400,
        }}>
          The Idea &amp; Structure of Sound
        </p>
        <p style={{
          fontSize: 14,
          lineHeight: 1.85,
          color: "#aaa",
          margin: "0 0 16px",
          fontWeight: 300,
        }}>
          ChessTones maps the 8×8 board directly onto musical space. Each <em style={{ color: "#ccc" }}>file (a–h)</em> corresponds
          to a scale note — C through C — and each <em style={{ color: "#ccc" }}>rank (1–8)</em> shifts the octave, so every
          square on the board holds a unique pitch. Moving a piece plays a two-note phrase: the
          square you leave, then the square you arrive at — a melodic interval born from the move itself.
        </p>
        <p style={{
          fontSize: 14,
          lineHeight: 1.85,
          color: "#aaa",
          margin: "0 0 16px",
          fontWeight: 300,
        }}>
          Every piece type has its own synthesized voice. Pawns speak in pure sine waves. Knights carry
          a warm triangle tone. Bishops ring with rich sawtooth harmonics. Rooks sound bold and square.
          The Queen layers complexity; the King resonates with a subtle vibrato — regal, and exposed.
        </p>
        <p style={{
          fontSize: 14,
          lineHeight: 1.85,
          color: "#aaa",
          margin: 0,
          fontWeight: 300,
        }}>
          Beneath the moves, an ambient score listens to the board's tension. As material shifts and kings
          grow vulnerable, the harmony drifts from major to minor, the tempo quickens, and the texture
          thickens — until checkmate resolves the drama in one final, descending cadence.
        </p>
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
