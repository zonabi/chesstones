import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBar } from "@/components/StatusBar";
import type { MaterialBalance, ReplayMove } from "@/types";

const baseMaterial: MaterialBalance = { white: 39, black: 39, balance: 0 };
const noReplayMoves: ReplayMove[] = [];

describe("StatusBar — turn display", () => {
  it("shows 'White to move' on white's turn", () => {
    render(
      <StatusBar
        gameStatus="playing"
        turn="w"
        mode="play"
        aiThinking={false}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={baseMaterial}
      />
    );
    expect(screen.getByText(/White to move/i)).toBeInTheDocument();
  });

  it("shows 'Black to move' on black's turn", () => {
    render(
      <StatusBar
        gameStatus="playing"
        turn="b"
        mode="play"
        aiThinking={false}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={baseMaterial}
      />
    );
    expect(screen.getByText(/Black to move/i)).toBeInTheDocument();
  });
});

describe("StatusBar — game status messages", () => {
  it("shows 'CHECKMATE' and winning color when checkmate for black", () => {
    // turn = "w" means white is mated (black wins)
    render(
      <StatusBar
        gameStatus="checkmate"
        turn="w"
        mode="play"
        aiThinking={false}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={baseMaterial}
      />
    );
    expect(screen.getByText(/CHECKMATE/i)).toBeInTheDocument();
    expect(screen.getByText(/Black wins/i)).toBeInTheDocument();
  });

  it("shows 'CHECKMATE' and white wins when white delivers checkmate", () => {
    // turn = "b" means black is mated (white wins)
    render(
      <StatusBar
        gameStatus="checkmate"
        turn="b"
        mode="play"
        aiThinking={false}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={baseMaterial}
      />
    );
    expect(screen.getByText(/White wins/i)).toBeInTheDocument();
  });

  it("shows 'STALEMATE' on stalemate", () => {
    render(
      <StatusBar
        gameStatus="stalemate"
        turn="w"
        mode="play"
        aiThinking={false}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={baseMaterial}
      />
    );
    expect(screen.getByText(/STALEMATE/i)).toBeInTheDocument();
    expect(screen.getByText(/Draw/i)).toBeInTheDocument();
  });

  it("shows 'in CHECK' when king is in check", () => {
    render(
      <StatusBar
        gameStatus="check"
        turn="w"
        mode="play"
        aiThinking={false}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={baseMaterial}
      />
    );
    expect(screen.getByText(/CHECK/i)).toBeInTheDocument();
    expect(screen.getByText(/White/i)).toBeInTheDocument();
  });
});

describe("StatusBar — AI thinking", () => {
  it("shows 'AI is thinking' when aiThinking is true", () => {
    render(
      <StatusBar
        gameStatus="playing"
        turn="b"
        mode="play"
        aiThinking={true}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={baseMaterial}
      />
    );
    expect(screen.getByText(/AI is thinking/i)).toBeInTheDocument();
  });
});

describe("StatusBar — replay mode", () => {
  const replayMoves: ReplayMove[] = [
    { san: "e4", move: { from: "e2", to: "e4" }, boardBefore: {} },
    { san: "e5", move: { from: "e7", to: "e5" }, boardBefore: {} },
  ];

  it("shows replay progress in replay mode", () => {
    render(
      <StatusBar
        gameStatus="playing"
        turn="w"
        mode="replay"
        aiThinking={false}
        replayIndex={1}
        replayMoves={replayMoves}
        materialDiff={baseMaterial}
      />
    );
    expect(screen.getByText(/Replay/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/2/)).toBeInTheDocument();
  });
});

describe("StatusBar — material display", () => {
  it("shows material counts in play mode", () => {
    const material: MaterialBalance = { white: 39, black: 30, balance: 9 };
    render(
      <StatusBar
        gameStatus="playing"
        turn="w"
        mode="play"
        aiThinking={false}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={material}
      />
    );
    expect(screen.getByText(/W39/)).toBeInTheDocument();
    expect(screen.getByText(/B30/)).toBeInTheDocument();
  });

  it("does not show material counts in replay mode", () => {
    const material: MaterialBalance = { white: 39, black: 39, balance: 0 };
    render(
      <StatusBar
        gameStatus="playing"
        turn="w"
        mode="replay"
        aiThinking={false}
        replayIndex={0}
        replayMoves={noReplayMoves}
        materialDiff={material}
      />
    );
    expect(screen.queryByText(/W39/)).not.toBeInTheDocument();
  });
});
