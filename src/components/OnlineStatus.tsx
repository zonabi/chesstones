import type { PlayerRole } from "@/types";
import { GOLD } from "@/styles/theme";

interface OnlineStatusProps {
  roomCode: string;
  role: PlayerRole;
  connectedPeers: number;
  opponentName: string;
  onDisconnect: () => void;
}

export function OnlineStatus({
  roomCode,
  role,
  connectedPeers,
  opponentName,
  onDisconnect,
}: OnlineStatusProps) {
  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#room=${roomCode}`;
    navigator.clipboard.writeText(url);
  };

  const roleLabel = role === "host" ? "Host (White)" : role === "guest" ? "Guest (Black)" : "Spectator";
  const spectatorCount = role === "spectator" ? connectedPeers : Math.max(0, connectedPeers - 1);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "6px 14px",
      background: "rgba(20,20,35,0.7)",
      border: "1px solid rgba(201,168,76,0.15)",
      borderRadius: 8,
      fontSize: 12,
      flexWrap: "wrap",
      justifyContent: "center",
    }}>
      {/* Connection indicator */}
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: connectedPeers > 0 ? "#4caf50" : "#ff9800",
          display: "inline-block",
          boxShadow: connectedPeers > 0 ? "0 0 4px #4caf50" : "0 0 4px #ff9800",
        }} />
        <span style={{ color: "#aaa" }}>Online</span>
      </span>

      {/* Room code */}
      <span style={{ color: "#888" }}>
        Room: <span style={{ color: GOLD, fontFamily: "monospace", fontWeight: 600, letterSpacing: 2 }}>
          {roomCode}
        </span>
      </span>

      {/* Role */}
      <span style={{ color: "#aaa" }}>{roleLabel}</span>

      {/* Opponent / peers */}
      {role !== "spectator" && connectedPeers > 0 && (
        <span style={{ color: "#aaa" }}>
          vs {opponentName}
        </span>
      )}

      {/* Spectator count */}
      {spectatorCount > 0 && (
        <span style={{ color: "#888" }}>
          👁 {spectatorCount} watching
        </span>
      )}

      {/* Copy link */}
      <button
        onClick={copyLink}
        style={{
          background: "none", border: `1px solid rgba(201,168,76,0.2)`,
          borderRadius: 4, padding: "2px 8px", color: "#aaa",
          cursor: "pointer", fontSize: 11,
        }}
      >
        📋 Copy Link
      </button>

      {/* Disconnect */}
      <button
        onClick={onDisconnect}
        style={{
          background: "none", border: `1px solid rgba(255,100,100,0.2)`,
          borderRadius: 4, padding: "2px 8px", color: "#ff6b6b",
          cursor: "pointer", fontSize: 11,
        }}
      >
        ✕ Leave
      </button>
    </div>
  );
}
