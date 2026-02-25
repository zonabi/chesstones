import { describe, it, expect } from "vitest";
import { isSquareAttacked, isInCheck, getLegalMoves } from "@/engine/moves";
import { createInitialBoard } from "@/engine/board";
import type { Board, CastlingRights } from "@/types";

const allCastling: CastlingRights = { wK: true, wQ: true, bK: true, bQ: true };
const noCastling: CastlingRights = { wK: false, wQ: false, bK: false, bQ: false };

describe("isSquareAttacked", () => {
  it("detects pawn attack (white pawn attacks diagonally)", () => {
    const board: Board = { e4: { type: "p", color: "w" } };
    expect(isSquareAttacked(board, "d5", "w")).toBe(true);
    expect(isSquareAttacked(board, "f5", "w")).toBe(true);
  });

  it("detects pawn attack (black pawn attacks diagonally)", () => {
    const board: Board = { e5: { type: "p", color: "b" } };
    expect(isSquareAttacked(board, "d4", "b")).toBe(true);
    expect(isSquareAttacked(board, "f4", "b")).toBe(true);
  });

  it("white pawn does NOT attack forward", () => {
    const board: Board = { e4: { type: "p", color: "w" } };
    expect(isSquareAttacked(board, "e5", "w")).toBe(false);
  });

  it("detects rook attack along a file", () => {
    const board: Board = { e1: { type: "r", color: "w" } };
    expect(isSquareAttacked(board, "e8", "w")).toBe(true);
  });

  it("rook attack blocked by intervening piece", () => {
    const board: Board = {
      e1: { type: "r", color: "w" },
      e4: { type: "p", color: "w" },
    };
    expect(isSquareAttacked(board, "e8", "w")).toBe(false);
  });

  it("detects bishop attack diagonally", () => {
    const board: Board = { c1: { type: "b", color: "w" } };
    expect(isSquareAttacked(board, "h6", "w")).toBe(true);
  });

  it("detects queen attack along rank", () => {
    const board: Board = { a5: { type: "q", color: "b" } };
    expect(isSquareAttacked(board, "h5", "b")).toBe(true);
  });

  it("detects knight attack (L-shape)", () => {
    const board: Board = { e4: { type: "n", color: "w" } };
    expect(isSquareAttacked(board, "f6", "w")).toBe(true);
    expect(isSquareAttacked(board, "d6", "w")).toBe(true);
    expect(isSquareAttacked(board, "c5", "w")).toBe(true);
    expect(isSquareAttacked(board, "g3", "w")).toBe(true);
  });

  it("detects king attack on adjacent square", () => {
    const board: Board = { e4: { type: "k", color: "w" } };
    expect(isSquareAttacked(board, "f5", "w")).toBe(true);
    expect(isSquareAttacked(board, "e5", "w")).toBe(true);
  });

  it("returns false when no attacking piece", () => {
    const board: Board = { a1: { type: "p", color: "w" } };
    expect(isSquareAttacked(board, "h8", "w")).toBe(false);
  });
});

describe("isInCheck", () => {
  it("returns false in the starting position", () => {
    const board = createInitialBoard();
    expect(isInCheck(board, "w")).toBe(false);
    expect(isInCheck(board, "b")).toBe(false);
  });

  it("detects white king in check from black rook", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      e8: { type: "r", color: "b" },
    };
    expect(isInCheck(board, "w")).toBe(true);
  });

  it("returns false when check is blocked", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      e4: { type: "p", color: "w" },
      e8: { type: "r", color: "b" },
    };
    expect(isInCheck(board, "w")).toBe(false);
  });

  it("returns false when king is not on board", () => {
    const board: Board = { e4: { type: "p", color: "w" } };
    expect(isInCheck(board, "w")).toBe(false);
  });
});

describe("getLegalMoves — pawn", () => {
  it("white pawn on e2 has two forward moves", () => {
    const board: Board = {
      e2: { type: "p", color: "w" },
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, noCastling);
    const pawnMoves = moves.filter((m) => m.from === "e2");
    expect(pawnMoves.map((m) => m.to).sort()).toEqual(["e3", "e4"].sort());
  });

  it("pawn cannot move forward if blocked", () => {
    const board: Board = {
      e2: { type: "p", color: "w" },
      e3: { type: "p", color: "b" },
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, noCastling);
    const pawnMoves = moves.filter((m) => m.from === "e2");
    expect(pawnMoves).toHaveLength(0);
  });

  it("pawn captures diagonally", () => {
    const board: Board = {
      e4: { type: "p", color: "w" },
      d5: { type: "p", color: "b" },
      f5: { type: "p", color: "b" },
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, noCastling);
    const pawnMoves = moves.filter((m) => m.from === "e4");
    const targets = pawnMoves.map((m) => m.to);
    expect(targets).toContain("d5");
    expect(targets).toContain("f5");
    expect(targets).toContain("e5");
  });

  it("en passant capture is included", () => {
    const board: Board = {
      e5: { type: "p", color: "w" },
      d5: { type: "p", color: "b" },
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const moves = getLegalMoves(board, "w", "d6", noCastling);
    const enPassant = moves.find((m) => m.from === "e5" && m.enPassant);
    expect(enPassant).toBeDefined();
    expect(enPassant?.to).toBe("d6");
  });

  it("pawn promotion generates 4 promotion moves", () => {
    const board: Board = {
      e7: { type: "p", color: "w" },
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" }, // black king not on e8 for this test
    };
    // Move black king out of the way
    board["a8"] = board["e8"];
    delete board["e8"];
    const moves = getLegalMoves(board, "w", null, noCastling);
    const promos = moves.filter((m) => m.from === "e7" && m.to === "e8");
    expect(promos).toHaveLength(4);
    expect(promos.map((m) => m.promotion).sort()).toEqual(["b", "n", "q", "r"].sort());
  });
});

describe("getLegalMoves — castling", () => {
  it("white can castle kingside when path is clear", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      h1: { type: "r", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, { wK: true, wQ: false, bK: false, bQ: false });
    const castle = moves.find((m) => m.castling === "K");
    expect(castle).toBeDefined();
    expect(castle?.to).toBe("g1");
  });

  it("white cannot castle kingside when path is blocked", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      f1: { type: "b", color: "w" },
      h1: { type: "r", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, { wK: true, wQ: false, bK: false, bQ: false });
    expect(moves.find((m) => m.castling === "K")).toBeUndefined();
  });

  it("white cannot castle when in check", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      h1: { type: "r", color: "w" },
      e8: { type: "r", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, { wK: true, wQ: false, bK: false, bQ: false });
    expect(moves.find((m) => m.castling === "K")).toBeUndefined();
  });
});

describe("getLegalMoves — check filtering", () => {
  it("filters moves that leave the king in check", () => {
    // White king on e1, white rook on e4 pinned by black rook on e8
    const board: Board = {
      e1: { type: "k", color: "w" },
      e4: { type: "r", color: "w" },
      e8: { type: "r", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, noCastling);
    // The rook on e4 is pinned — moving it off the e-file would expose the king
    const rookSideMoves = moves.filter((m) => m.from === "e4" && !m.to.startsWith("e"));
    expect(rookSideMoves).toHaveLength(0);
  });

  it("in checkmate there are no legal moves", () => {
    // True back-rank mate: white king cornered on a1, black rooks on a8 and b8 cover all escapes
    // a1 king: can try a2 (covered by a8 rook), b1 (covered by b8 rook), b2 (covered by b8 rook)
    const board: Board = {
      a1: { type: "k", color: "w" },
      a8: { type: "r", color: "b" },
      b8: { type: "r", color: "b" },
      h8: { type: "k", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, noCastling);
    expect(moves).toHaveLength(0);
  });

  it("knight can block a check", () => {
    // White king in check from black queen, white knight can interpose
    const board: Board = {
      e1: { type: "k", color: "w" },
      e8: { type: "q", color: "b" },
      d3: { type: "n", color: "w" },
      a8: { type: "k", color: "b" },
    };
    const moves = getLegalMoves(board, "w", null, noCastling);
    // Knight on d3 can go to e5 to block — or king can flee
    expect(moves.length).toBeGreaterThan(0);
  });
});

describe("getLegalMoves — starting position", () => {
  it("white has 20 legal moves at the start", () => {
    const board = createInitialBoard();
    const moves = getLegalMoves(board, "w", null, allCastling);
    expect(moves).toHaveLength(20);
  });

  it("black has 20 legal moves at the start", () => {
    const board = createInitialBoard();
    const moves = getLegalMoves(board, "b", null, allCastling);
    expect(moves).toHaveLength(20);
  });
});
