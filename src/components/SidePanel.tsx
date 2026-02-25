import React, { useState } from "react";
import type { GameMode, ReplayMove } from "@/types";
import { PIECE_AUDIO, PIECE_SYMBOLS } from "@/constants";
import { SAMPLE_GAMES } from "@/constants";
import { BG_PANEL, smallBtnStyle, GOLD } from "@/styles/theme";

const panelStyle: React.CSSProperties = {
  background: BG_PANEL,
  borderRadius: 8,
  padding: 12,
  border: "1px solid #ffffff08",
};

// ─── Tension Meter ──────────────────────────────────────

interface TensionMeterProps {
  tension: number;
}

const TensionMeter: React.FC<TensionMeterProps> = ({ tension }) => {
  const pct = (tension / 20) * 100;
  const gradient =
    tension > 12
      ? `linear-gradient(90deg, ${GOLD}, #e04040)`
      : tension > 6
        ? `linear-gradient(90deg, #4c8ac9, ${GOLD})`
        : "linear-gradient(90deg, #4cc94c, #4c8ac9)";

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 6, letterSpacing: 1 }}>TENSION</div>
      <div style={{ height: 6, background: "#1a1a2a", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: gradient,
          transition: "width 0.5s, background 0.5s",
          borderRadius: 3,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "#666" }}>
        <span>Calm</span><span>Intense</span>
      </div>
    </div>
  );
};

// ─── Piece Voices ───────────────────────────────────────

const PieceVoices: React.FC = () => (
  <div style={{ ...panelStyle, fontSize: 11, color: "#999" }}>
    <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>PIECE VOICES</div>
    {Object.entries(PIECE_AUDIO).map(([type, audio]) => (
      <div key={type} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span>{PIECE_SYMBOLS["w" + type]} {type.toUpperCase()}</span>
        <span style={{ color: "#666" }}>{audio.wave}</span>
      </div>
    ))}
  </div>
);

// ─── Move History ───────────────────────────────────────

interface MoveHistoryProps {
  moveNotation: string[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moveNotation }) => {
  const rows = moveNotation.reduce<{ num: number; white: string; black: string }[]>((acc, san, i) => {
    if (i % 2 === 0) {
      acc.push({ num: Math.floor(i / 2) + 1, white: san, black: "" });
    } else {
      acc[acc.length - 1].black = san;
    }
    return acc;
  }, []);

  return (
    <div style={{ ...panelStyle, maxHeight: 200, overflowY: "auto" }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>MOVES</div>
      <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.8 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <span style={{ color: "#555", width: 24 }}>{row.num}.</span>
            <span style={{ width: 52, color: "#ccc" }}>{row.white}</span>
            <span style={{ color: "#aaa" }}>{row.black}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Replay Controls ────────────────────────────────────

interface ReplayControlsProps {
  replayMoves: ReplayMove[];
  replayIndex: number;
  isReplaying: boolean;
  onStep: (idx: number) => void;
  onToggleAutoReplay: () => void;
  onLoadPGN: (pgn: string) => void;
}

const ReplayControls: React.FC<ReplayControlsProps> = ({
  replayMoves, replayIndex, isReplaying,
  onStep, onToggleAutoReplay, onLoadPGN,
}) => {
  const [pgnInput, setPgnInput] = useState("");

  return (
    <>
      {/* Transport controls */}
      <div style={panelStyle}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>REPLAY</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8 }}>
          <button onClick={() => onStep(0)} style={smallBtnStyle}>⏮</button>
          <button onClick={() => onStep(Math.max(0, replayIndex - 1))} style={smallBtnStyle}>◀</button>
          <button onClick={onToggleAutoReplay} style={smallBtnStyle}>{isReplaying ? "⏸" : "▶"}</button>
          <button onClick={() => onStep(Math.min(replayMoves.length, replayIndex + 1))} style={smallBtnStyle}>▶</button>
          <button onClick={() => onStep(replayMoves.length)} style={smallBtnStyle}>⏭</button>
        </div>
        <input
          type="range"
          min={0}
          max={replayMoves.length}
          value={replayIndex}
          onChange={(e) => onStep(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: GOLD }}
        />
      </div>

      {/* Game loader */}
      <div style={panelStyle}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>LOAD GAME</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(SAMPLE_GAMES).map(([name, pgn]) => (
            <button key={name} onClick={() => onLoadPGN(pgn)} style={{
              ...smallBtnStyle, width: "100%", fontSize: 11, padding: "6px 8px", textAlign: "left" as const,
            }}>
              🎵 {name}
            </button>
          ))}
        </div>
        <textarea
          value={pgnInput}
          onChange={(e) => setPgnInput(e.target.value)}
          placeholder="Paste PGN here..."
          style={{
            width: "100%", height: 60, marginTop: 8, background: "#1a1a2a",
            border: "1px solid #333", color: "#ccc", borderRadius: 4, padding: 6,
            fontSize: 11, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box",
          }}
        />
        <button onClick={() => onLoadPGN(pgnInput)} style={{
          ...smallBtnStyle, width: "100%", marginTop: 6, padding: "6px",
        }}>
          Load PGN
        </button>
      </div>
    </>
  );
};

// ─── Composed Side Panel ────────────────────────────────

interface SidePanelProps {
  tension: number;
  moveNotation: string[];
  mode: GameMode;
  replayMoves: ReplayMove[];
  replayIndex: number;
  isReplaying: boolean;
  onStep: (idx: number) => void;
  onToggleAutoReplay: () => void;
  onLoadPGN: (pgn: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  tension, moveNotation, mode,
  replayMoves, replayIndex, isReplaying,
  onStep, onToggleAutoReplay, onLoadPGN,
}) => (
  <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 12 }}>
    <TensionMeter tension={tension} />
    <PieceVoices />
    <MoveHistory moveNotation={moveNotation} />
    {mode === "replay" && (
      <ReplayControls
        replayMoves={replayMoves}
        replayIndex={replayIndex}
        isReplaying={isReplaying}
        onStep={onStep}
        onToggleAutoReplay={onToggleAutoReplay}
        onLoadPGN={onLoadPGN}
      />
    )}
  </div>
);
