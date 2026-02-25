import React from "react";
import type { PieceType } from "@/types";
import { PIECE_SYMBOLS } from "@/constants";

interface PromotionDialogProps {
  onSelect: (type: PieceType) => void;
}

const PROMO_PIECES: PieceType[] = ["q", "r", "b", "n"];

/** Modal dialog for pawn promotion piece selection */
export const PromotionDialog: React.FC<PromotionDialogProps> = ({ onSelect }) => (
  <div style={{
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 999,
  }}>
    <div style={{
      background: "#1e1e2e", borderRadius: 12, padding: 20,
      border: "1px solid #c9a84c44", textAlign: "center",
    }}>
      <p style={{ marginBottom: 12, fontSize: 14, color: "#c9a84c" }}>
        Promote pawn to:
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {PROMO_PIECES.map((type) => (
          <button key={type} onClick={() => onSelect(type)} style={{
            width: 56, height: 56, fontSize: 36, background: "#2a2a3a",
            border: "1px solid #c9a84c44", borderRadius: 8, cursor: "pointer",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {PIECE_SYMBOLS["w" + type]}
          </button>
        ))}
      </div>
    </div>
  </div>
);
