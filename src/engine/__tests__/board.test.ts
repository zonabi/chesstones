import { describe, it, expect } from "vitest";
import {
  createInitialBoard,
  parseSquare,
  sqStr,
  isOnBoard,
  fileOffset,
  cloneBoard,
  findKing,
  makeMove,
} from "@/engine/board";
import type { Board } from "@/types";

describe("createInitialBoard", () => {
  it("places 32 pieces on the starting position", () => {
    const board = createInitialBoard();
    expect(Object.keys(board)).toHaveLength(32);
  });

  it("places white king on e1", () => {
    const board = createInitialBoard();
    expect(board["e1"]).toEqual({ type: "k", color: "w" });
  });

  it("places black king on e8", () => {
    const board = createInitialBoard();
    expect(board["e8"]).toEqual({ type: "k", color: "b" });
  });

  it("places white pawns on rank 2", () => {
    const board = createInitialBoard();
    for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      expect(board[`${file}2`]).toEqual({ type: "p", color: "w" });
    }
  });

  it("places black pawns on rank 7", () => {
    const board = createInitialBoard();
    for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      expect(board[`${file}7`]).toEqual({ type: "p", color: "b" });
    }
  });

  it("leaves ranks 3–6 empty", () => {
    const board = createInitialBoard();
    for (const rank of [3, 4, 5, 6]) {
      for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
        expect(board[`${file}${rank}`]).toBeUndefined();
      }
    }
  });
});

describe("parseSquare", () => {
  it("parses 'e4' correctly", () => {
    expect(parseSquare("e4")).toEqual({ file: "e", rank: 4 });
  });

  it("parses 'a1' correctly", () => {
    expect(parseSquare("a1")).toEqual({ file: "a", rank: 1 });
  });

  it("parses 'h8' correctly", () => {
    expect(parseSquare("h8")).toEqual({ file: "h", rank: 8 });
  });
});

describe("sqStr", () => {
  it("builds 'e4' from file 'e' and rank 4", () => {
    expect(sqStr("e", 4)).toBe("e4");
  });

  it("builds 'a1' from file 'a' and rank 1", () => {
    expect(sqStr("a", 1)).toBe("a1");
  });
});

describe("isOnBoard", () => {
  it("returns true for valid squares", () => {
    expect(isOnBoard("a", 1)).toBe(true);
    expect(isOnBoard("h", 8)).toBe(true);
    expect(isOnBoard("e", 4)).toBe(true);
  });

  it("returns false when rank is out of range", () => {
    expect(isOnBoard("e", 0)).toBe(false);
    expect(isOnBoard("e", 9)).toBe(false);
  });

  it("returns false for invalid file", () => {
    expect(isOnBoard("i", 4)).toBe(false);
    expect(isOnBoard("z", 4)).toBe(false);
  });
});

describe("fileOffset", () => {
  it("shifts 'a' by +1 to 'b'", () => {
    expect(fileOffset("a", 1)).toBe("b");
  });

  it("shifts 'h' by -1 to 'g'", () => {
    expect(fileOffset("h", -1)).toBe("g");
  });

  it("returns null when offset goes off the board", () => {
    expect(fileOffset("a", -1)).toBeNull();
    expect(fileOffset("h", 1)).toBeNull();
  });

  it("shifts 'e' by 0 to 'e'", () => {
    expect(fileOffset("e", 0)).toBe("e");
  });
});

describe("cloneBoard", () => {
  it("returns a new object (not the same reference)", () => {
    const board = createInitialBoard();
    const clone = cloneBoard(board);
    expect(clone).not.toBe(board);
  });

  it("contains the same pieces as the original", () => {
    const board = createInitialBoard();
    const clone = cloneBoard(board);
    expect(clone).toEqual(board);
  });

  it("does not mutate the original when clone is modified", () => {
    const board = createInitialBoard();
    const clone = cloneBoard(board);
    delete clone["e1"];
    expect(board["e1"]).toEqual({ type: "k", color: "w" });
  });
});

describe("findKing", () => {
  it("finds white king on e1 in starting position", () => {
    const board = createInitialBoard();
    expect(findKing(board, "w")).toBe("e1");
  });

  it("finds black king on e8 in starting position", () => {
    const board = createInitialBoard();
    expect(findKing(board, "b")).toBe("e8");
  });

  it("returns null when king is not on the board", () => {
    const board: Board = { e4: { type: "p", color: "w" } };
    expect(findKing(board, "w")).toBeNull();
  });

  it("finds king after it has moved", () => {
    const board = createInitialBoard();
    board["e2"] = board["e1"]; // move king forward (for test purposes)
    delete board["e1"];
    expect(findKing(board, "w")).toBe("e2");
  });
});

describe("makeMove", () => {
  it("moves a piece from source to destination", () => {
    const board = createInitialBoard();
    const newBoard = makeMove(board, { from: "e2", to: "e4" });
    expect(newBoard["e4"]).toEqual({ type: "p", color: "w" });
    expect(newBoard["e2"]).toBeUndefined();
  });

  it("does not mutate the original board", () => {
    const board = createInitialBoard();
    makeMove(board, { from: "e2", to: "e4" });
    expect(board["e2"]).toEqual({ type: "p", color: "w" });
    expect(board["e4"]).toBeUndefined();
  });

  it("handles pawn promotion", () => {
    const board: Board = {
      e7: { type: "p", color: "w" },
      e8: undefined as never,
      e1: { type: "k", color: "w" },
      e4: { type: "k", color: "b" },
    };
    delete board["e8"];
    const newBoard = makeMove(board, { from: "e7", to: "e8", promotion: "q" });
    expect(newBoard["e8"]).toEqual({ type: "q", color: "w" });
  });

  it("handles kingside castling for white (moves rook)", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      h1: { type: "r", color: "w" },
    };
    const newBoard = makeMove(board, { from: "e1", to: "g1", castling: "K" });
    expect(newBoard["g1"]).toEqual({ type: "k", color: "w" });
    expect(newBoard["f1"]).toEqual({ type: "r", color: "w" });
    expect(newBoard["h1"]).toBeUndefined();
  });

  it("handles queenside castling for white (moves rook)", () => {
    const board: Board = {
      e1: { type: "k", color: "w" },
      a1: { type: "r", color: "w" },
    };
    const newBoard = makeMove(board, { from: "e1", to: "c1", castling: "Q" });
    expect(newBoard["c1"]).toEqual({ type: "k", color: "w" });
    expect(newBoard["d1"]).toEqual({ type: "r", color: "w" });
    expect(newBoard["a1"]).toBeUndefined();
  });

  it("handles en passant capture (removes captured pawn)", () => {
    // White pawn on e5 captures en passant to f6 (black pawn on f5)
    const board: Board = {
      e5: { type: "p", color: "w" },
      f5: { type: "p", color: "b" },
    };
    const newBoard = makeMove(board, { from: "e5", to: "f6", enPassant: true });
    expect(newBoard["f6"]).toEqual({ type: "p", color: "w" });
    expect(newBoard["f5"]).toBeUndefined();
    expect(newBoard["e5"]).toBeUndefined();
  });

  it("returns unchanged board if source square is empty", () => {
    const board = createInitialBoard();
    const newBoard = makeMove(board, { from: "e4", to: "e5" });
    expect(newBoard).toEqual(board);
  });
});
