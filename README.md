# ♔ ChessTones

> Where every move is music.

ChessTones is a React prototype that merges chess with music theory — every piece, every move, and every moment of game tension generates a unique musical response using the Web Audio API.

## Concept

The 8×8 chess board maps naturally onto musical structure:

- **Files (a–h)** → scale notes (C, D, E, F, G, A, B, C)
- **Ranks (1–8)** → octaves (spanning ~5 octaves, low to high)
- Every square has a unique pitch — `a1` = C2 (low/deep), `h8` = C6 (bright/high)

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
- **King safety & piece attacks** raise tension level
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
- Positional evaluation: center control, pawn advancement, king safety

### 📼 Game Replay Mode
- PGN import — paste any PGN game
- Three classic games included: Immortal Game (1851), Opera Game (1858), Scholar's Mate
- Step-through controls with full audio playback
- Scrub slider for quick navigation

## Getting Started

This is a single-file React component. Drop it into any React project:

```bash
# Using Vite
npm create vite@latest chesstones -- --template react
cd chesstones
cp chesstones.jsx src/App.jsx
npm run dev
```

Or open directly in [Claude.ai](https://claude.ai) as a React artifact.

## Roadmap Ideas

- 🌍 Online multiplayer with shared musical experience for spectators
- 🎹 Musical key/scale selection (pentatonic, blues, modal)
- 🎻 Instrument pack themes (orchestral, jazz, electronic)
- 📖 Opening recognition with associated leitmotifs
- 💾 Export game as audio file (MP3/WAV)
- ♿ Accessibility mode using audio to convey board state
- 📊 "Musical drama" scoring for games

## Tech Stack

- React (hooks only — no external chess libraries)
- Web Audio API (pure synthesis — no audio files)
- Custom chess engine (full rules: castling, en passant, promotion, check/mate/stalemate)
- Custom minimax AI with alpha-beta pruning

---

Built with [Claude](https://claude.ai) · Concept by [Zonabi Design](https://zonabidesign.com)
