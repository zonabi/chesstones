# ChessTones — Working Memory

> Chess + Web Audio API. Every move generates music. No external chess or audio libraries.

## Project

**ChessTones** — React + TypeScript + Vite single-page app.
White plays as human, Black is AI. Includes PGN import/replay mode.
Deployed to GitHub Pages at `/chesstones/` base path.

| Key | Value |
|-----|-------|
| Stack | React 18, TypeScript strict, Vite 5 |
| Styling | Inline styles only (no CSS framework) |
| Audio | Web Audio API — pure synthesis, no audio files |
| Chess engine | Custom (no chess.js or similar) |
| AI | Minimax + alpha-beta pruning, depth 3–4 |
| Deploy | GitHub Actions → GitHub Pages (`npm run build`) |
| Path alias | `@/` → `src/` |

## Module Map

| Module | Path | What it does |
|--------|------|--------------|
| **Types** | `src/types/` | All shared TS types (`Board`, `Move`, `Piece`, `GameStatus`, etc.) |
| **Engine** | `src/engine/` | Board state, move gen, check detection, analysis |
| **AI** | `src/ai/` | Minimax + alpha-beta, positional evaluation |
| **Audio** | `src/audio/AudioEngine.ts` | Web Audio synthesis, ADSR envelopes, ambient tension music |
| **PGN** | `src/pgn/` | PGN parser, SAN→Move converter |
| **Constants** | `src/constants/` | FILES/RANKS, PIECE_VALUES, PIECE_AUDIO configs, sample games |
| **Hooks** | `src/hooks/` | `useChessGame`, `useAudio`, `useReplay` |
| **Components** | `src/components/` | React UI — ChessTones (root), ChessBoard, SidePanel, etc. |
| **Styles** | `src/styles/theme.ts` | GOLD color, tabStyle, tensionColor, GLOBAL_CSS animations |

## Key Concepts

**Square-to-pitch mapping:** Files a–h → C major notes (C,D,E,F,G,A,B,C); Ranks 1–8 → octaves 2–6. Every square has a unique frequency.

**Move sonification:** Each move plays a 2-note phrase (departure square → arrival square). Captures add dissonant burst. Check = tritone. Checkmate = descending cadence.

**Tension system:** `getTension()` scores board danger (0–20). Drives ambient music mode (major→minor), tempo, density, and background gradient color (`tensionColor()`).

**Piece voices:** Each `PieceType` has its own `OscillatorType` + ADSR envelope defined in `PIECE_AUDIO` constant.

**Audio gate:** `AudioEngine.init()` must be called from a user gesture (browser policy). `AudioOverlay` component handles this. `audioStarted` boolean gates all audio calls.

## Engine Architecture

```
engine/board.ts     → createInitialBoard, makeMove, cloneBoard, findKing
engine/moves.ts     → generatePseudoLegalMoves, getLegalMoves, isInCheck, isSquareAttacked
engine/analysis.ts  → getMaterialBalance, getTension, getPieceCount
engine/index.ts     → barrel re-exports all of the above
```

`getLegalMoves` filters pseudo-legal moves by simulating each and checking if the king lands in check.

## Hook Contracts

**`useChessGame(audioRef, audioStarted)`**
- Owns: board, turn, selected, legalSquares, gameStatus, castling, enPassant, capturedPieces, moveNotation, squarePulse, showPromotion
- Exposes: handleSquareClick, handlePromotion, newGame, setMode, enterReplayMode, restoreState

**`useAudio()`**
- Owns: AudioEngine instance (ref), audioStarted, volume
- Board-reactive ambient sync happens in ChessTones.tsx `useEffect` (NOT inside this hook)

**`useReplay(audioRef, enterReplayMode, restoreState)`**
- Owns: replayMoves, replayIndex, isReplaying
- Calls `restoreState` on each step to sync game hook

## Conventions

- SAN notation generated inline in `useChessGame.moveToSAN()`
- `squarePulse` Record clears after 600ms via `setTimeout`
- AI runs in `useEffect` watching `[turn, mode, gameStatus]` with 500ms delay
- Castling rights tracked as `CastlingRights` object `{ wK, wQ, bK, bQ }`
- En passant target stored as a square string (e.g. `"e3"`) or `null`
- Immutable board pattern: `makeMove` always returns a new board object
- Color codes: `"w"` = white, `"b"` = black
- PieceType codes: `"p" "n" "b" "r" "q" "k"`

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # tsc --noEmit && vite build
npm run typecheck  # tsc --noEmit only
npm run preview    # Preview production build
```

## Files to Know

| File | Role |
|------|------|
| `src/components/ChessTones.tsx` | Root component — composes hooks and sub-components |
| `src/audio/AudioEngine.ts` | Full audio engine — edit for new sounds |
| `src/constants/music.ts` | `squareToFreq`, `PIECE_AUDIO` configs |
| `src/constants/games.ts` | Built-in PGN sample games |
| `src/styles/theme.ts` | All shared styling constants and helpers |
| `.github/workflows/deploy.yml` | GitHub Pages CI/CD deploy pipeline |

→ Full docs: `docs/ARCHITECTURE.md`
