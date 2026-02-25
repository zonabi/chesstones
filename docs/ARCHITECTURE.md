# ChessTones — Architecture

An end-to-end guide to how the app is structured, how data flows, and why things are designed the way they are.

---

## Overview

ChessTones is a single-page React app built with TypeScript and Vite. Its two primary concerns — chess logic and audio synthesis — are deliberately kept separate, connected only through the hooks layer at the top.

```
┌──────────────────────────────────────────────────┐
│                 ChessTones.tsx                   │
│  (root component — composes hooks + UI)          │
│                                                  │
│   useAudio()    useChessGame()    useReplay()     │
└────┬──────────────────┬────────────────┬─────────┘
     │                  │                │
     ▼                  ▼                ▼
AudioEngine        engine/*           pgn/parser
(Web Audio API)    (chess logic)      (SAN parsing)
                        │
                   constants/
                   ai/minimax
```

The root component (`ChessTones.tsx`) is the only place where audio and game state interact — it runs a `useEffect` that reads `game.board` and calls `audioRef.current.updateTension()` and `startAmbient()` whenever the board changes.

---

## Layers

### 1. Types (`src/types/`)

All shared TypeScript types live here. No logic, no imports from other internal modules.

**`chess.ts`** — everything chess-related:
- `PieceType` — `"p" | "n" | "b" | "r" | "q" | "k"`
- `Color` — `"w" | "b"`
- `Board` — `Record<string, Piece>` (square string → Piece)
- `Move` — `{ from, to, promotion?, enPassant?, castling? }`
- `CastlingRights` — `{ wK, wQ, bK, bQ }` (four booleans)
- `GameStatus` — `"playing" | "check" | "checkmate" | "stalemate"`
- `ReplayMove` — a resolved move with its board snapshot (used by replay)

**`audio.ts`** — audio-related:
- `PieceAudioConfig` — ADSR envelope + waveform for one piece
- `PieceAudioMap` — `Record<PieceType, PieceAudioConfig>`

---

### 2. Constants (`src/constants/`)

Pure data — no side effects.

**`chess.ts`**
- `FILES` — `["a".."h"]`
- `RANKS` — `[1..8]`
- `PIECE_VALUES` — material values (p=1, n=3, b=3, r=5, q=9, k=0)
- `PIECE_SYMBOLS` — Unicode chess symbols keyed by `"wp"`, `"bk"`, etc.
- `KNIGHT_OFFSETS` — the 8 knight move deltas

**`music.ts`**
- `NOTE_NAMES` — the C major scale mapped to files a–h
- `squareToFreq(file, rank)` — converts a board square to Hz
- `squareToNote(file, rank)` — human-readable note name like `"G4"`
- `PIECE_AUDIO` — the `PieceAudioMap` with waveform + ADSR per piece type

**`games.ts`**
- `SAMPLE_GAMES` — three classic PGN games bundled for replay

---

### 3. Engine (`src/engine/`)

The custom chess engine. No React, no audio, no imports from hooks or components. Pure functions only.

**`board.ts`** — board utilities:
- `createInitialBoard()` — standard starting position
- `makeMove(board, move)` — applies a move, returns a new board (immutable)
- `cloneBoard(board)` — deep copy
- `findKing(board, color)` — locates the king square
- `parseSquare(sq)` — `"e4"` → `{ file: "e", rank: 4 }`
- `sqStr(file, rank)` — inverse of parseSquare
- `fileOffset(file, n)` — shift a file letter by n positions (null if OOB)

**`moves.ts`** — move generation:
- `generatePseudoLegalMoves(board, color, ep, castling)` — all moves ignoring check
- `getLegalMoves(board, color, ep, castling)` — filters pseudo-legal moves by simulating each and calling `isInCheck` on the resulting board
- `isSquareAttacked(board, square, byColor)` — checks if a square is under attack
- `isInCheck(board, color)` — uses `findKing` + `isSquareAttacked`

**`analysis.ts`** — board evaluation helpers:
- `getMaterialBalance(board)` → `{ white, black, balance }` (balance = white − black)
- `getTension(board, color)` — 0–20 danger score; considers check (+5) and attacked pieces (by piece value). Used to drive audio and visuals.
- `getPieceCount(board)` — total pieces remaining

---

### 4. AI (`src/ai/`)

**`evaluation.ts`** — static board evaluation:
Returns a numeric score (positive = good for white). Considers material, center control (bonus for pieces on e4/d4/e5/d5), pawn advancement, and king safety.

**`minimax.ts`** — the search algorithm:
- Minimax with alpha-beta pruning, depth 3–4
- Move ordering: captures sorted by `PIECE_VALUES[victim]` for better pruning (MVV-LVA)
- Castling rights are passed through but simplified — not updated per-move within the search tree (a known approximation)
- `getAIMove(board, ep, castling)` — public entry point, returns the best `Move` for black

---

### 5. PGN (`src/pgn/`)

**`parser.ts`**:
- `parsePGN(pgn)` — strips headers, comments, variations, and result markers; returns an array of SAN tokens like `["e4", "e5", "Nf3", ...]`
- `sanToMove(san, board, color, ep, castling)` — converts a SAN string to a `Move` by matching against `getLegalMoves()`. Handles: castling (`O-O`, `O-O-O`), promotion (`=Q`), captures, disambiguating file/rank prefixes.

---

### 6. Audio (`src/audio/AudioEngine.ts`)

The `AudioEngine` class wraps the Web Audio API. It has no React dependencies.

**Key design decisions:**
- Initialization is deferred (`init()` must be called from a user gesture — browser autoplay policy)
- All synthesis is done with `OscillatorNode` + `GainNode` (ADSR envelope) + `StereoPannerNode`
- Reverb is a synthetic impulse response built at init time (exponential decay noise)
- The Queen gets a second oscillator at 1.5× frequency (perfect fifth)
- The King gets a 5 Hz vibrato via a second oscillator modulating the first's frequency

**Key methods:**
- `init()` — create AudioContext, master gain, reverb chain
- `playNote(freq, pieceType, duration, pan)` — synthesize one note for a piece voice
- `playMove(from, to, pieceType, isCapture, isCastling, inCheck)` — two-note phrase + special sounds
- `startAmbient(tension, materialBalance, pieceCount)` — start/restart the background music loop
- `updateTension(t)` — update internal tension state (affects next ambient iteration)
- `setVolume(v)` — 0.0–1.0 master gain
- `destroy()` — close AudioContext on unmount

**Ambient music logic:** An `setInterval`-based loop generates notes from a scale selected by tension/material (Ionian → Dorian → Phrygian as tension rises). Note density, tempo, and register all scale with the tension value.

---

### 7. Hooks (`src/hooks/`)

React state layer. Each hook has a single responsibility.

**`useAudio()`**
- Creates an `AudioEngine` ref on mount, destroys it on unmount
- Exposes `startAudio()` (must be called from a user gesture), `audioStarted`, `volume`, `setVolume`
- Does NOT handle board-reactive ambient sync — that lives in `ChessTones.tsx`

**`useChessGame(audioRef, audioStarted)`**
- Owns all game state: `board`, `turn`, `castling`, `enPassant`, `gameStatus`, `selected`, `legalSquares`, `moveNotation`, `capturedPieces`, `squarePulse`, `showPromotion`, `aiThinking`
- `handleSquareClick` — select/move logic; triggers `executeMove` or opens promotion dialog
- `executeMove` — applies a move, updates state, plays audio, computes SAN, checks game-over conditions
- AI trigger: a `useEffect` watching `[turn, mode, gameStatus]` fires `getAIMove` with a 500ms delay when it's black's turn
- `enterReplayMode` / `restoreState` — hooks used by `useReplay` to sync game state during replay

**`useReplay(audioRef, enterReplayMode, restoreState)`**
- `loadPGN(pgn)` — parses PGN into `ReplayMove[]` (each with its `boardBefore` snapshot)
- `stepReplay(idx)` — jumps to a specific move index, calls `restoreState` to push board state back into `useChessGame`
- `toggleAutoReplay` — starts/stops a `setInterval` that auto-advances the replay

---

### 8. Components (`src/components/`)

All styling is done with inline React `style` objects. No external CSS framework. The gold color (`#c9a84c`) and shared style helpers live in `src/styles/theme.ts`.

**`ChessTones.tsx`** — root component. Calls all three hooks, runs the board-reactive audio `useEffect`, and computes derived state (`bgColor`, `materialDiff`).

**`ChessBoard.tsx`** — renders the 8×8 grid. Receives `board`, `turn`, `selected`, `legalSquares`, `lastMove`, `squarePulse`, `tension`, `boardFlipped`, `capturedPieces`. Passes click events up via `onSquareClick`.

**`BoardSquare.tsx`** — a single square. Renders the piece (Unicode symbol), highlight overlays (legal move dot, last-move highlight, check glow), and the musical note label on the destination square after a move.

**`SidePanel.tsx`** — move notation list, PGN input textarea, replay controls (prev/next/play/scrub). Receives replay state from `useReplay` via props.

**`StatusBar.tsx`** — turn indicator, game status message, material advantage display.

**`AudioOverlay.tsx`** — fullscreen overlay shown until audio is started. Single click calls `onStart`.

**`PromotionDialog.tsx`** — modal shown when a pawn reaches the back rank. Four piece buttons; selection calls `onSelect(pieceType)`.

---

## Data Flow Summary

```
User click
    │
    ▼
ChessBoard.onSquareClick(sq)
    │
    ▼
useChessGame.handleSquareClick(sq)
    ├── getLegalMoves() → filter for sq
    ├── if move found → executeMove(move)
    │       ├── makeMove(board, move)   ← engine/board
    │       ├── isInCheck()             ← engine/moves
    │       ├── audioRef.playMove()     ← AudioEngine
    │       ├── moveToSAN()             ← internal helper
    │       └── setState (board, turn, …)
    └── else → setSelected + getLegalMoves for highlights

Board state change
    │
    ▼
ChessTones.tsx useEffect([game.board, game.turn])
    ├── getMaterialBalance()     ← engine/analysis
    ├── getTension()             ← engine/analysis
    ├── audioRef.updateTension() ← AudioEngine
    └── audioRef.startAmbient()  ← AudioEngine
```

---

## Key Design Decisions

**Why no external chess library?** The chess logic is intentionally bespoke so the engine can be deeply integrated with move metadata (en passant flags, castling type, promotion choice) and audio triggers. Using chess.js would require translating between APIs.

**Why inline styles?** Avoids build-time CSS complexity and keeps everything co-located. The `theme.ts` module acts as a lightweight design token system.

**Why is ambient sync in the root component, not `useAudio`?** `useAudio` doesn't know about game state. Keeping board-reactive logic in the root makes the dependency explicit and avoids prop-drilling AudioEngine into the game hook.

**Why does `useReplay` call `restoreState` on `useChessGame`?** Replay needs to jump to arbitrary board positions (not just play forward). Passing a restore callback is simpler than lifting all game state up or using a global store.
