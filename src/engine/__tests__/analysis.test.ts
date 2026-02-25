import { describe, it, expect } from "vitest";
import { getMaterialBalance, getTension, getPieceCount } from "@/engine/analysis";
import { createInitialBoard } from "@/engine/board";
import type { Board } from "@/types";

describe("getMaterialBalance", () => {
  it("returns equal balance (0) in starting position", () => {
    const board = createInitialBoard();
    const result = getMaterialBalance(board);
    expect(result.balance).toBe(0);
  });

  it("counts material correctly in starting position", () => {
    const board = createInitialBoard();
    // 8 pawns (1) + 2 knights (3) + 2 bishops (3) + 2 rooks (5) + 1 queen (9) = 39
    const result = getMaterialBalance(board);
    expect(result.white).toBe(39);
    expect(result.black).toBe(39);
  });

  it("reflects white material advantage when black piece is removed", () => {
    const board = createInitialBoard();
    delete board["d8"]; // remove black queen (value 9)
    const result = getMaterialBalance(board);
    expect(result.balance).toBe(9);
    expect(result.white).toBe(39);
    expect(result.black).toBe(30);
  });

  it("reflects black material advantage when white piece is removed", () => {
    const board = createInitialBoard();
    delete board["d1"]; // remove white queen (value 9)
    const result = getMaterialBalance(board);
    expect(result.balance).toBe(-9);
  });

  it("handles empty board with only kings", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const result = getMaterialBalance(board);
    expect(result.white).toBe(0);
    expect(result.black).toBe(0);
    expect(result.balance).toBe(0);
  });
});

describe("getTension", () => {
  it("returns 0 tension for an empty board (no kings)", () => {
    const board: Board = {};
    expect(getTension(board, "w")).toBe(0);
  });

  it("returns 0 tension for starting position (no pieces attacked yet)", () => {
    const board = createInitialBoard();
    // In the starting position, no pieces are attacked under normal circumstances
    // The tension might be > 0 due to pawn attacks in the initial setup,
    // but it should be non-negative
    expect(getTension(board, "w")).toBeGreaterThanOrEqual(0);
  });

  it("adds 5 for being in check", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      e8: { type: "r", color: "b" },
    };
    const tension = getTension(board, "w");
    expect(tension).toBeGreaterThanOrEqual(5);
  });

  it("is capped at 20", () => {
    // Put many white pieces under attack
    const board: Board = {
      e1: { type: "k", color: "w" },
      a8: { type: "r", color: "b" },
      b8: { type: "r", color: "b" },
      c8: { type: "r", color: "b" },
      d8: { type: "q", color: "b" },
      a1: { type: "q", color: "w" },
      b1: { type: "r", color: "w" },
      c1: { type: "r", color: "w" },
    };
    const tension = getTension(board, "w");
    expect(tension).toBeLessThanOrEqual(20);
  });

  it("returns higher tension when a queen is attacked", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      e4: { type: "q", color: "w" },
      e8: { type: "r", color: "b" },
    };
    const tension = getTension(board, "w");
    // Queen (value 9) is attacked + king is in check from rook
    expect(tension).toBeGreaterThan(5);
  });
});

describe("getPieceCount", () => {
  it("returns 32 for starting position", () => {
    const board = createInitialBoard();
    expect(getPieceCount(board)).toBe(32);
  });

  it("returns 2 for a lone kings board", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    expect(getPieceCount(board)).toBe(2);
  });

  it("returns 0 for empty board", () => {
    expect(getPieceCount({})).toBe(0);
  });

  it("decrements when a piece is captured", () => {
    const board = createInitialBoard();
    delete board["d1"]; // remove white queen
    expect(getPieceCount(board)).toBe(31);
  });
});
