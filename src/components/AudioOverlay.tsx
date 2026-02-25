import React from "react";
import { GOLD } from "@/styles/theme";

interface AudioOverlayProps {
  onStart: () => void;
}

/** Full-screen overlay prompting the user to begin (required for Web Audio API) */
export const AudioOverlay: React.FC<AudioOverlayProps> = ({ onStart }) => (
  <div style={{
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, flexDirection: "column", gap: 20,
  }}>
    <h2 style={{ fontSize: 28, fontWeight: 300, letterSpacing: 4, color: GOLD }}>
      ♔ ChessTones
    </h2>
    <p style={{
      color: "#aaa", fontSize: 14, maxWidth: 400,
      textAlign: "center", lineHeight: 1.6,
    }}>
      Experience chess as a living musical composition. Every piece, every move, every moment of tension
      becomes part of the soundtrack.
    </p>
    <button onClick={onStart} style={{
      padding: "14px 40px", fontSize: 16,
      background: `linear-gradient(135deg, ${GOLD}, #a07830)`,
      border: "none", color: "#fff", borderRadius: 8, cursor: "pointer",
      letterSpacing: 2, fontWeight: 300, transition: "all 0.3s",
    }}>
      ▶ BEGIN
    </button>
  </div>
);
