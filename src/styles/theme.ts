import type { GameStatus } from "@/types";

/** Gold accent used throughout the UI */
export const GOLD = "#c9a84c";
export const GOLD_GRADIENT = `linear-gradient(90deg, ${GOLD}, #f0d878, ${GOLD})`;

/** Dark background base colors */
export const BG_PRIMARY = "#0a0a12";
export const BG_PANEL = "rgba(30,30,45,0.6)";

/** Shared button styles */
export function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 18px",
    fontSize: 13,
    background: active ? "rgba(201,168,76,0.2)" : "rgba(30,30,45,0.4)",
    border: `1px solid ${active ? "#c9a84c66" : "#ffffff10"}`,
    color: active ? GOLD : "#888",
    borderRadius: 6,
    cursor: "pointer",
    letterSpacing: 1,
    fontWeight: 300,
    transition: "all 0.3s",
  };
}

export const smallBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 12,
  background: BG_PANEL,
  border: "1px solid #ffffff10",
  color: "#aaa",
  borderRadius: 4,
  cursor: "pointer",
  transition: "all 0.3s",
};

/** Compute the status bar background based on game state */
export function statusBarBg(status: GameStatus): string {
  switch (status) {
    case "checkmate": return "rgba(200,50,50,0.3)";
    case "check": return "rgba(200,150,50,0.3)";
    case "stalemate": return "rgba(100,100,100,0.3)";
    default: return "rgba(60,60,80,0.3)";
  }
}

/** Compute the background gradient color shift based on tension */
export function tensionColor(tension: number): string {
  const t = tension / 20;
  const r = Math.round(40 + t * 80);
  const g = Math.round(35 - t * 20);
  const b = Math.round(55 - t * 30);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Global CSS injected into the page */
export const GLOBAL_CSS = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #c9a84c44; border-radius: 2px; }
  input[type="range"] { height: 4px; }
`;
