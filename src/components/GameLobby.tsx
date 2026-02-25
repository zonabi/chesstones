import { useState } from "react";
import type { GameMode } from "@/types";
import { GOLD, GOLD_GRADIENT } from "@/styles/theme";

interface GameLobbyProps {
  onSelectMode: (mode: GameMode) => void;
  onHostGame: () => Promise<void>;
  onJoinGame: (code: string) => Promise<void>;
  onSpectateGame: (code: string) => Promise<void>;
  roomCode: string;
  isConnected: boolean;
  error: string | null;
  connectedPeers: number;
}

type LobbyView = "main" | "online" | "hosting" | "joining" | "spectating";

export function GameLobby({
  onSelectMode,
  onHostGame,
  onJoinGame,
  onSpectateGame,
  roomCode,
  isConnected: _isConnected,
  error,
  connectedPeers,
}: GameLobbyProps) {
  const [view, setView] = useState<LobbyView>("main");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleHost = async () => {
    setIsLoading(true);
    try {
      await onHostGame();
      setView("hosting");
    } catch {
      // error handled by hook
    }
    setIsLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setIsLoading(true);
    try {
      await onJoinGame(joinCode.trim());
      onSelectMode("online");
    } catch {
      // error handled
    }
    setIsLoading(false);
  };

  const handleSpectate = async () => {
    if (!joinCode.trim()) return;
    setIsLoading(true);
    try {
      await onSpectateGame(joinCode.trim());
      onSelectMode("online");
    } catch {
      // error handled
    }
    setIsLoading(false);
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#room=${roomCode}`;
    navigator.clipboard.writeText(url);
  };

  const startHostedGame = () => {
    onSelectMode("online");
  };

  // ─── STYLES ────────────────────────────────────────────

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(5,5,15,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(10px)",
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(20,20,35,0.98), rgba(10,10,20,0.98))",
    border: `1px solid rgba(201,168,76,0.2)`,
    borderRadius: 16,
    padding: "40px 48px",
    maxWidth: 500,
    width: "90%",
    textAlign: "center",
  };

  const modeBtn = (emoji: string, label: string, desc: string, onClick: () => void): React.ReactElement => (
    <button
      key={label}
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        background: "rgba(30,30,50,0.6)", border: `1px solid rgba(201,168,76,0.15)`,
        borderRadius: 12, padding: "20px 24px", cursor: "pointer",
        transition: "all 0.2s", width: "100%",
        color: "#e0e0e0",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = GOLD;
        e.currentTarget.style.background = "rgba(201,168,76,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.15)";
        e.currentTarget.style.background = "rgba(30,30,50,0.6)";
      }}
    >
      <span style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</span>
      <span style={{ fontSize: 16, fontWeight: 500, color: "#e0e0e0" }}>{label}</span>
      <span style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{desc}</span>
    </button>
  );

  const inputStyle: React.CSSProperties = {
    background: "rgba(20,20,35,0.8)",
    border: `1px solid rgba(201,168,76,0.3)`,
    borderRadius: 8,
    padding: "12px 16px",
    color: "#e0e0e0",
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 6,
    fontFamily: "monospace",
    textTransform: "uppercase",
    outline: "none",
    width: "100%",
    maxWidth: 220,
  };

  const actionBtn = (label: string, onClick: () => void, primary = false): React.ReactElement => (
    <button
      key={label}
      onClick={onClick}
      disabled={isLoading}
      style={{
        background: primary
          ? "linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.15))"
          : "rgba(40,40,60,0.6)",
        border: `1px solid ${primary ? GOLD : "rgba(201,168,76,0.2)"}`,
        borderRadius: 8,
        padding: "10px 24px",
        color: primary ? GOLD : "#ccc",
        cursor: isLoading ? "wait" : "pointer",
        fontSize: 14,
        fontWeight: primary ? 600 : 400,
        transition: "all 0.2s",
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? "Connecting..." : label}
    </button>
  );

  const backBtn = (
    <button
      onClick={() => { setView("main"); setJoinCode(""); }}
      style={{
        background: "none", border: "none", color: "#888",
        cursor: "pointer", fontSize: 13, marginTop: 16,
      }}
    >
      ← Back
    </button>
  );

  // ─── MAIN VIEW ─────────────────────────────────────────

  if (view === "main") {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <h1 style={{
            fontSize: 32, fontWeight: 300, letterSpacing: 6,
            background: GOLD_GRADIENT,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            margin: "0 0 8px", textTransform: "uppercase",
          }}>
            ♔ ChessTones ♕
          </h1>
          <p style={{ color: "#888", fontSize: 12, letterSpacing: 3, margin: "0 0 32px" }}>
            CHOOSE YOUR MODE
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {modeBtn("♟", "Play vs AI", "Challenge the computer with musical moves", () => onSelectMode("play"))}
            {modeBtn("👥", "Local 2 Player", "Two players, one screen, shared music", () => onSelectMode("local"))}
            {modeBtn("🌍", "Online Multiplayer", "Play & listen together across the internet", () => setView("online"))}
          </div>
        </div>
      </div>
    );
  }

  // ─── ONLINE SUB-MENU ───────────────────────────────────

  if (view === "online") {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <h2 style={{ color: "#e0e0e0", fontSize: 20, fontWeight: 400, margin: "0 0 24px" }}>
            🌍 Online Multiplayer
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {modeBtn("🏠", "Host Game", "Create a room and invite someone to play", handleHost)}
            {modeBtn("🎮", "Join Game", "Enter a room code to play as black", () => setView("joining"))}
            {modeBtn("👁", "Spectate", "Watch a live game with shared music", () => setView("spectating"))}
          </div>
          {error && (
            <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 16 }}>{error}</p>
          )}
          {backBtn}
        </div>
      </div>
    );
  }

  // ─── HOSTING VIEW ──────────────────────────────────────

  if (view === "hosting") {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <h2 style={{ color: "#e0e0e0", fontSize: 20, fontWeight: 400, margin: "0 0 16px" }}>
            🏠 Room Created
          </h2>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 20px" }}>
            Share this code with your opponent:
          </p>
          <div style={{
            background: "rgba(201,168,76,0.08)",
            border: `2px solid ${GOLD}`,
            borderRadius: 12,
            padding: "16px 24px",
            marginBottom: 16,
          }}>
            <span style={{
              fontSize: 36, fontFamily: "monospace", letterSpacing: 8,
              color: GOLD, fontWeight: 700,
            }}>
              {roomCode}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {actionBtn("📋 Copy Link", copyRoomLink)}
            {actionBtn("Start Game →", startHostedGame, true)}
          </div>
          <p style={{ color: "#888", fontSize: 12, marginTop: 16 }}>
            {connectedPeers > 0
              ? `✅ ${connectedPeers} player${connectedPeers > 1 ? "s" : ""} connected`
              : "⏳ Waiting for opponent..."}
          </p>
          <p style={{ color: "#666", fontSize: 11, marginTop: 8 }}>
            You can start the game and your opponent can join anytime
          </p>
          {backBtn}
        </div>
      </div>
    );
  }

  // ─── JOIN VIEW ─────────────────────────────────────────

  if (view === "joining" || view === "spectating") {
    const isSpectate = view === "spectating";
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <h2 style={{ color: "#e0e0e0", fontSize: 20, fontWeight: 400, margin: "0 0 16px" }}>
            {isSpectate ? "👁 Spectate Game" : "🎮 Join Game"}
          </h2>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 20px" }}>
            Enter the room code:
          </p>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && (isSpectate ? handleSpectate() : handleJoin())}
            placeholder="ABC123"
            maxLength={6}
            style={inputStyle}
            autoFocus
          />
          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
            {actionBtn(
              isSpectate ? "👁 Spectate" : "🎮 Join",
              isSpectate ? handleSpectate : handleJoin,
              true
            )}
          </div>
          {error && (
            <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 16 }}>{error}</p>
          )}
          {backBtn}
        </div>
      </div>
    );
  }

  return null;
}
