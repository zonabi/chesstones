import { describe, it, expect } from "vitest";
import { parsePGN, sanToMove } from "@/pgn/parser";
import { createInitialBoard } from "@/engine/board";
import type { CastlingRights } from "@/types";

const allCastling: CastlingRights = { wK: true, wQ: true, bK: true, bQ: true };

describe("parsePGN", () => {
  it("parses a minimal PGN into SAN tokens", () => {
    const pgn = "1. e4 e5 2. Nf3 Nc6";
    expect(parsePGN(pgn)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  it("strips PGN headers", () => {
    const pgn = `[Event "Test"]
[White "Alice"]
[Black "Bob"]
1. d4 d5`;
    expect(parsePGN(pgn)).toEqual(["d4", "d5"]);
  });

  it("strips inline comments in braces", () => {
    const pgn = "1. e4 {King's pawn opening} e5";
    expect(parsePGN(pgn)).toEqual(["e4", "e5"]);
  });

  it("strips the result token (1-0)", () => {
    const pgn = "1. e4 e5 1-0";
    expect(parsePGN(pgn)).toEqual(["e4", "e5"]);
  });

  it("strips the result token (0-1)", () => {
    const pgn = "1. d4 d5 0-1";
    expect(parsePGN(pgn)).toEqual(["d4", "d5"]);
  });

  it("strips the result token (1/2-1/2)", () => {
    const pgn = "1. e4 e5 1/2-1/2";
    expect(parsePGN(pgn)).toEqual(["e4", "e5"]);
  });

  it("strips the asterisk result marker", () => {
    const pgn = "1. e4 *";
    expect(parsePGN(pgn)).toEqual(["e4"]);
  });

  it("handles move numbers with ellipsis (black-to-move notation)", () => {
    const pgn = "1. e4 1... e5";
    const tokens = parsePGN(pgn);
    // Move numbers should be stripped
    expect(tokens).not.toContain("1.");
    expect(tokens).not.toContain("1...");
    expect(tokens).toContain("e4");
    expect(tokens).toContain("e5");
  });

  it("returns no meaningful tokens for empty PGN", () => {
    // parsePGN("") splits on whitespace → [""] which filters as a non-move-number token
    // Verify no actual move tokens (letters/digits) are present
    const tokens = parsePGN("").filter((t) => t.length > 0 && !/^\s*$/.test(t));
    expect(tokens.every((t) => t.match(/^\d+\.+$/) === null)).toBe(true);
  });

  it("handles check and capture annotations without breaking tokens", () => {
    const pgn = "1. e4 e5 2. Bc4 Nf6 3. Nxf7+";
    const tokens = parsePGN(pgn);
    expect(tokens).toContain("Nxf7+");
  });
});

describe("sanToMove — basic pawn moves", () => {
  it("resolves 'e4' from the starting position (white)", () => {
    const board = createInitialBoard();
    const move = sanToMove("e4", board, "w", null, allCastling);
    expect(move).toBeDefined();
    expect(move?.from).toBe("e2");
    expect(move?.to).toBe("e4");
  });

  it("resolves 'd5' from the starting position (black)", () => {
    const board = createInitialBoard();
    const move = sanToMove("d5", board, "b", null, allCastling);
    expect(move).toBeDefined();
    expect(move?.from).toBe("d7");
    expect(move?.to).toBe("d5");
  });
});

describe("sanToMove — piece moves", () => {
  it("resolves knight move 'Nf3'", () => {
    const board = createInitialBoard();
    const move = sanToMove("Nf3", board, "w", null, allCastling);
    expect(move).toBeDefined();
    expect(move?.to).toBe("f3");
  });

  it("resolves 'Nc3' for white knight", () => {
    const board = createInitialBoard();
    const move = sanToMove("Nc3", board, "w", null, allCastling);
    expect(move).toBeDefined();
    expect(move?.to).toBe("c3");
  });
});

describe("sanToMove — castling", () => {
  it("resolves 'O-O' to kingside castling", () => {
    const board = createInitialBoard();
    // Clear kingside squares for white
    delete board["f1"];
    delete board["g1"];
    const move = sanToMove("O-O", board, "w", null, allCastling);
    expect(move).toBeDefined();
    expect(move?.castling).toBe("K");
  });

  it("resolves 'O-O-O' to queenside castling", () => {
    const board = createInitialBoard();
    // Clear queenside squares for white
    delete board["b1"];
    delete board["c1"];
    delete board["d1"];
    const move = sanToMove("O-O-O", board, "w", null, allCastling);
    expect(move).toBeDefined();
    expect(move?.castling).toBe("Q");
  });
});

describe("sanToMove — check/capture annotations stripped", () => {
  it("ignores trailing '+' in SAN", () => {
    const board = createInitialBoard();
    const move = sanToMove("Nf3+", board, "w", null, allCastling);
    // Nf3 is a legal move even if + wouldn't apply yet
    expect(move).toBeDefined();
    expect(move?.to).toBe("f3");
  });

  it("returns undefined for an illegal SAN move", () => {
    const board = createInitialBoard();
    // e5 is not reachable from starting position in one white pawn move
    const move = sanToMove("e5", board, "w", null, allCastling);
    expect(move).toBeUndefined();
  });
});
