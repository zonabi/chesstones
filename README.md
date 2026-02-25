# ♔ ChessTones

> Where every move is music.

ChessTones is a React + TypeScript app that merges chess with music theory — every piece, every move, and every moment of game tension generates a unique musical response using the Web Audio API. No external chess libraries. No audio files. Everything synthesized live.

## Concept

The 8×8 chess board maps directly onto musical space:

- **Files (a–h)** → C major scale notes (C, D, E, F, G, A, B, C)
- **Ranks (1–8)** → octaves spanning C2 to C6
- Every square has a unique pitch — `a1` = C2 (low/deep), `h8` = C6 (bright/high)

Moving a piece plays a **two-note phrase**: the square you leave, then the square you arrive at — a melodic interval born from the move itself.

## Features

### 🎵 Piece Voices
Each piece type has a distinct synthesized waveform:
| Piece | Waveform | Character |
|-------|----------|-----------|
| Pawn | Sine | Pure, simple |
| Knight | Triangle | Warm, quirky |
| Bishop | Sawtooth | Rich harmonics |
| Rook | Square | Bold, structural |
| Queen | Layered sawtooth | Complex, layered |
| King | Sine + vibrato | Regal, vulnerable |

### 🎼 Move Sonification
- Every move plays a **two-note phrase**: departure square → arrival square
- **Captures** trigger a dissonant descending tone with a noise burst
- **Castling** plays a perfect-fifth harmonic resolution chord
- **Check** plays a tritone (the most dissonant interval in Western music)
- **Checkmate** triggers a dramatic descending cadence across a full octave

### 🌡️ Ambient Tension System
The ambient soundtrack responds live to board state:
- **Material balance** shifts the harmonic mode (major → minor as you lose material)
- **King safety & piece attacks** raise tension level (scored 0–20)
- **Tempo and density** increase as danger rises
- **Endgame** produces sparse, exposed textures with occasional high sparkle notes

### ✨ Visual Feedback
- Board colors shift with tension (calm blues → warm ambers → urgent reds)
- Pieces glow when attacked (king glows red in check)
- Move trails pulse on piece movements
- Background gradient breathes with overall game tension
- Musical note labels appear on the destination square after each move

### 🤖 AI Opponent
- Minimax with alpha-beta pruning (depth 3–4)
- Move ordering by capture value (MVV-LVA) for better pruning efficiency
- Positional evaluation: center control, pawn advancement, king safety

### 📼 Game Replay Mode
- PGN import — paste any PGN game and step through it with full audio
- Three classic games included: Immortal Game (1851), Opera Game (1858), Scholar's Mate
- Step-through controls + auto-play with scrub slider

## Getting Started

```bash
git clone https://github.com/zonabidesign/chesstones
cd chesstones
npm install
npm run dev
```

Open [http://localhost:5173/chesstones/](http://localhost:5173/chesstones/) and click the screen once to unlock audio (required by browser policy).

### Build & Preview

```bash
npm run build      # TypeScript check + Vite production build → dist/
npm run preview    # Serve the production build locally
npm run typecheck  # Run tsc type-check only
```

### Deploy

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages automatically.

## Project Structure

```
src/
├── ai/               # Minimax AI with alpha-beta pruning
│   ├── evaluation.ts # Positional board evaluation
│   └── minimax.ts    # Search algorithm
├── audio/
│   └── AudioEngine.ts  # Web Audio synthesis engine (ADSR, ambient, effects)
├── components/       # React UI components
│   ├── ChessTones.tsx  # Root — composes hooks and sub-components
│   ├── ChessBoard.tsx  # Board grid and piece rendering
│   ├── BoardSquare.tsx # Individual square with highlight and pulse
│   ├── SidePanel.tsx   # Move list, replay controls, PGN input
│   ├── StatusBar.tsx   # Turn/status/material display
│   ├── AudioOverlay.tsx  # Click-to-start audio overlay
│   └── PromotionDialog.tsx
├── constants/        # Shared constants
│   ├── chess.ts      # FILES, RANKS, PIECE_VALUES, PIECE_SYMBOLS, KNIGHT_OFFSETS
│   ├── music.ts      # squareToFreq(), PIECE_AUDIO configs, NOTE_NAMES
│   └── games.ts      # Built-in PGN sample games
├── engine/           # Custom chess engine (no external library)
│   ├── board.ts      # createInitialBoard, makeMove, cloneBoard, findKing
│   ├── moves.ts      # Move generation, isInCheck, isSquareAttacked
│   └── analysis.ts   # getMaterialBalance, getTension, getPieceCount
├── hooks/
│   ├── useChessGame.ts # Core game state, move execution, AI trigger
│   ├── useAudio.ts     # AudioEngine lifecycle, volume
│   └── useReplay.ts    # PGN load, step, auto-play
├── pgn/
│   └── parser.ts     # PGN string → SAN tokens; SAN → Move object
├── styles/
│   └── theme.ts      # Colors (GOLD), button styles, tensionColor(), GLOBAL_CSS
└── types/
    ├── chess.ts      # Board, Move, Piece, GameStatus, CastlingRights, etc.
    └── audio.ts      # PieceAudioConfig, PieceAudioMap
```

For a deeper explanation of data flow and design decisions see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech Stack

- **React 18** — hooks-only, no class components
- **TypeScript** — strict mode, path alias `@/` → `src/`
- **Vite 5** — bundler and dev server
- **Web Audio API** — pure synthesis, zero audio files
- Custom chess engine — full rules: castling, en passant, promotion, check/checkmate/stalemate
- Custom minimax AI — no external engine dependencies

## Roadmap Ideas

- 🌍 Online multiplayer with shared musical experience for spectators
- 🎹 Musical key/scale selection (pentatonic, blues, modal)
- 🎻 Instrument pack themes (orchestral, jazz, electronic)
- 📖 Opening recognition with associated leitmotifs
- 💾 Export game as audio file (MP3/WAV)
- ♿ Accessibility mode: audio conveys board state for screen readers
- 📊 "Musical drama" score — rate games by their tension arc

---

Built with [Claude](https://claude.ai) · Concept by [Zonabi Design](https://zonabidesign.com)
