import { describe, it, expect } from "vitest";
import { evaluateBoard } from "@/ai/evaluation";
import { createInitialBoard } from "@/engine/board";
import type { Board } from "@/types";

describe("evaluateBoard", () => {
  it("returns 0 for the symmetric starting position", () => {
    const board = createInitialBoard();
    expect(evaluateBoard(board)).toBe(0);
  });

  it("returns a positive score when white has extra material", () => {
    const board = createInitialBoard();
    delete board["d8"]; // remove black queen
    expect(evaluateBoard(board)).toBeGreaterThan(0);
  });

  it("returns a negative score when black has extra material", () => {
    const board = createInitialBoard();
    delete board["d1"]; // remove white queen
    expect(evaluateBoard(board)).toBeLessThan(0);
  });

  it("awards center control bonus for pieces on d4/e4/d5/e5", () => {
    // Knight on e4 (center) vs knight on a1 (corner)
    const centerBoard: Board = {
      e4: { type: "n", color: "w" },
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const cornerBoard: Board = {
      a1: { type: "n", color: "w" },
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    expect(evaluateBoard(centerBoard)).toBeGreaterThan(evaluateBoard(cornerBoard));
  });

  it("awards pawn advancement bonus for advanced white pawns", () => {
    const advancedBoard: Board = {
      e7: { type: "p", color: "w" }, // rank 7 — nearly promoted
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const startBoard: Board = {
      e2: { type: "p", color: "w" }, // rank 2 — starting rank
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    expect(evaluateBoard(advancedBoard)).toBeGreaterThan(evaluateBoard(startBoard));
  });

  it("awards king safety bonus for castled king position (g1/c1)", () => {
    const castledBoard: Board = {
      g1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    const uncastledBoard: Board = {
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
    };
    expect(evaluateBoard(castledBoard)).toBeGreaterThan(evaluateBoard(uncastledBoard));
  });

  it("is symmetric: mirror position scores to zero", () => {
    // Matching extra pieces on both sides should cancel out
    const board: Board = {
      e1: { type: "k", color: "w" },
      e8: { type: "k", color: "b" },
      a1: { type: "q", color: "w" },
      a8: { type: "q", color: "b" },
    };
    expect(evaluateBoard(board)).toBe(0);
  });
});
