# ChessTones: Sound Customization & Interactive Audio Plan

> **Status:** Draft — no code changes yet
> **Scope:** Musical scale/key selection, instrument themes, hover/click audio interaction
> **Goal:** Extensible audio architecture that's scalable, testable, and toggleable

---

## 1. Current Architecture Summary

### What exists today

The audio system is relatively simple and tightly coupled:

| Component | File | Role |
|-----------|------|------|
| `AudioEngine` | `src/audio/AudioEngine.ts` | Monolithic class: note synthesis, move sonification, special sounds, ambient system |
| `PIECE_AUDIO` | `src/constants/music.ts` | Static `Record<PieceType, PieceAudioConfig>` — one hardcoded waveform + ADSR per piece |
| `squareToFreq()` | `src/constants/music.ts` | Maps file → C major note name, rank → octave, then `noteToFreq()` converts via equal temperament |
| `NOTE_NAMES` | `src/constants/music.ts` | Hardcoded `["C","D","E","F","G","A","B","C"]` — always C major |
| `useAudio` hook | `src/hooks/useAudio.ts` | Owns the `AudioEngine` instance, exposes `startAudio`, `setVolume` |
| `BoardSquare` | `src/components/BoardSquare.tsx` | Has no hover/sound logic; only receives `onClick` from parent |

### Key coupling points that need refactoring

1. **`NOTE_NAMES` is a const array** — changing scale means replacing this.
2. **`squareToFreq()` has no scale parameter** — it always uses C major mapping.
3. **`PIECE_AUDIO` is a single static object** — no concept of "themes" or swappable configs.
4. **`AudioEngine.playNote()` reads `PIECE_AUDIO` directly** from the import — no injection point.
5. **`BoardSquare` has no `onMouseEnter`** handler — hover sounds don't exist.
6. **No settings/preferences state** exists anywhere in the app.

---

## 2. Feature: Musical Scale & Key Selection

### What it does

Let the user choose a **root key** (C, C#, D, … B) and a **scale** (Major, Minor, Pentatonic, Blues, Dorian, Mixolydian, etc.). The 8 files (a–h) then map to notes from that scale instead of always C major.

### Scale data model

```typescript
// src/audio/scales.ts

export interface ScaleDefinition {
  id: string;               // "major" | "pentatonic" | "blues" | "dorian" | ...
  name: string;             // "Major" | "Pentatonic" | "Blues" | ...
  intervals: number[];      // semitone intervals from root, length 7-8
  description: string;      // user-facing tooltip
}

export const SCALES: ScaleDefinition[] = [
  { id: "major",      name: "Major (Ionian)",  intervals: [0,2,4,5,7,9,11,12], description: "Bright, classic" },
  { id: "minor",      name: "Natural Minor",   intervals: [0,2,3,5,7,8,10,12], description: "Dark, emotional" },
  { id: "pentatonic", name: "Pentatonic Major", intervals: [0,2,4,7,9,12,14,16], description: "Open, folk-like" },
  { id: "pent-minor", name: "Pentatonic Minor", intervals: [0,3,5,7,10,12,15,17], description: "Bluesy, soulful" },
  { id: "blues",      name: "Blues",            intervals: [0,3,5,6,7,10,12,15], description: "Gritty, expressive" },
  { id: "dorian",     name: "Dorian",           intervals: [0,2,3,5,7,9,10,12], description: "Jazz, sophisticated" },
  { id: "mixolydian", name: "Mixolydian",       intervals: [0,2,4,5,7,9,10,12], description: "Dominant, funky" },
  { id: "chromatic",  name: "Chromatic",        intervals: [0,1,2,3,4,5,6,7],   description: "All semitones" },
];

export const ROOT_NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] as const;
export type RootNote = typeof ROOT_NOTES[number];
```

### How `squareToFreq` changes

Instead of the current hardcoded lookup, it becomes a pure function that accepts scale config:

```typescript
// New signature
export function squareToFreq(
  file: string,
  rank: number,
  rootNote: RootNote,
  scale: ScaleDefinition
): number {
  const fileIdx = FILES.indexOf(file);
  const semitones = rootSemitone(rootNote) + scale.intervals[fileIdx];
  const octave = BASE_OCTAVE + Math.floor((rank - 1) * 5 / 8);
  return 440 * Math.pow(2, (semitones - 9 + (octave - 4) * 12) / 12);
}
```

The old `NOTE_NAMES` and `SEMITONE_MAP` become internal helpers or are replaced entirely. The public API takes explicit scale parameters — no hidden global state.

### Where scale state lives

A new **`useAudioSettings`** hook (or extend `useAudio`) holds:

```typescript
interface AudioSettings {
  rootNote: RootNote;        // default: "C"
  scale: ScaleDefinition;    // default: SCALES[0] (Major)
  theme: InstrumentTheme;    // default: THEMES[0] (Classic)
  hoverSoundEnabled: boolean;// default: true
  clickSoundEnabled: boolean;// default: true
}
```

This is passed through to `AudioEngine` methods and to `squareToFreq` calls. It's stored in React state and persisted to `localStorage` so it survives page reloads.

### UI

A **Settings panel** (collapsible, in the controls bar area) with:

- **Root Key** dropdown: C through B
- **Scale** dropdown: the `SCALES` list, with description tooltips
- Selecting a new scale/key immediately re-maps all square frequencies — the ambient drone restarts with the new base frequency

---

## 3. Feature: Instrument Pack Themes

### What it does

Swap the entire "sound palette" of the app. Each theme provides a full `PieceAudioMap` (waveform + ADSR for every piece type), plus ambient parameters and optional effects chain modifications.

### Theme data model

```typescript
// src/audio/themes.ts

export interface InstrumentTheme {
  id: string;
  name: string;
  description: string;
  pieces: PieceAudioMap;      // waveform + ADSR per piece type
  ambient: AmbientConfig;     // controls for the ambient drone system
  effects: EffectsConfig;     // reverb mix, optional delay, filter
}

export interface AmbientConfig {
  baseWave: OscillatorType;      // drone oscillator type
  tensionWave: OscillatorType;   // high-tension overlay
  sparkleEnabled: boolean;       // endgame sparkle notes
  reverbMix: number;             // 0-1, reverb wet/dry
  droneGain: number;             // base ambient volume
}

export interface EffectsConfig {
  reverbDecay: number;           // impulse response length in seconds
  reverbMix: number;             // wet/dry ratio
  filterType?: BiquadFilterType; // optional lowpass/highpass/bandpass
  filterFreq?: number;           // filter cutoff Hz
  filterQ?: number;              // filter resonance
}
```

### Built-in themes

| Theme | Vibe | Piece voices | Ambient |
|-------|------|-------------|---------|
| **Classic** (default) | Current sound — pure synthesis | sine/triangle/sawtooth/square as today | Current drone system |
| **Orchestral** | Warm, rich, legato | Layered sines with slow attacks, vibrato on strings. Pawn=pizzicato (short sine), Knight=french horn (triangle+sine), Bishop=cello (filtered sawtooth), Rook=timpani (low square burst), Queen=full strings (multi-osc), King=organ (sine+harmonics) | Low sustained pad with fifth harmony |
| **Jazz** | Smooth, muted, swing feel | All pieces use softer tones. Pawn=walking bass (low sine), Knight=muted trumpet (triangle), Bishop=vibraphone (sine+decay), Rook=upright bass (filtered square), Queen=saxophone (sawtooth+filter), King=piano chord (multi-sine) | Swing-feel repeating pattern, minor 7th chords |
| **Electronic** | Glitchy, bright, punchy | Pawn=808 kick (sine sweep), Knight=arp blip (quick triangle), Bishop=pad slice (filtered saw), Rook=bass drop (square+pitch bend), Queen=supersaw (detuned saws), King=vocoder-like (formant filters) | Pulsing sidechained drone, tempo-synced |
| **Minimal** | Sparse, clean | All sine waves with varying ADSR | Very quiet or no ambient |

### How themes integrate with AudioEngine

Instead of `AudioEngine` directly importing `PIECE_AUDIO`, it receives theme config:

```typescript
class AudioEngine {
  private currentTheme: InstrumentTheme;

  setTheme(theme: InstrumentTheme): void {
    this.currentTheme = theme;
    this.rebuildEffectsChain(); // recreate reverb/filter with new params
  }

  playNote(freq: number, pieceType: PieceType, duration?: number, pan?: number): void {
    const audio = this.currentTheme.pieces[pieceType]; // ← was PIECE_AUDIO[pieceType]
    // ... rest is similar but uses theme.effects for routing
  }
}
```

The `PIECE_AUDIO` constant in `music.ts` becomes the "Classic" theme's piece map. All other themes define their own.

### Effects chain refactoring

Current: `osc → env → panner → masterGain + reverb`

New (per-theme configurable):

```
osc → env → [optional filter] → panner → reverbSend → reverbGain → masterGain
                                       → dryGain → masterGain
```

Each theme controls the reverb decay, wet/dry mix, and optional filter. The `rebuildEffectsChain()` method tears down and rebuilds these nodes when the theme changes.

---

## 4. Feature: Hover & Click Sound Interaction

### What it does

- **Hover:** When the mouse enters any square, play that square's note at reduced volume (~30% of normal). Short duration, no reverb. Gives a "piano roll exploration" feel.
- **Click:** When clicking *any* tile (including opponent pieces), play the square's note at full volume. Currently only your own pieces make a preview sound on click; this extends it to all squares.
- **Toggleable:** Both can be turned on/off independently in settings.

### Implementation approach

**BoardSquare changes:**

```typescript
// New props added to BoardSquare
interface BoardSquareProps {
  // ... existing props ...
  onHover?: (sq: string, piece: Piece | undefined) => void;
  onHoverEnd?: (sq: string) => void;
}

// In the JSX:
<div
  onClick={onClick}
  onMouseEnter={() => onHover?.(sq, piece)}
  onMouseLeave={() => onHoverEnd?.(sq)}
  // ...
>
```

**ChessBoard passes through:**

```typescript
<BoardSquare
  // ... existing ...
  onHover={onSquareHover}
  onHoverEnd={onSquareHoverEnd}
/>
```

**ChessTones.tsx (root) handles the audio calls:**

```typescript
const handleSquareHover = useCallback((sq: string, piece: Piece | undefined) => {
  if (!audioStarted || !settings.hoverSoundEnabled) return;
  const { file, rank } = parseSquare(sq);
  const freq = squareToFreq(file, rank, settings.rootNote, settings.scale);
  const pieceType = piece?.type ?? "p"; // default voice for empty squares
  audioRef.current?.playNote(freq, pieceType, 0.08, 0, 0.3); // short, quiet
}, [audioStarted, settings]);
```

**Click sound expansion:**

Currently in `useChessGame.handleSquareClick`, a preview tone only plays when you click your own piece. We change this:

```typescript
// Always play a click sound if enabled, regardless of whose piece or empty square
if (audioRef.current?.isInitialized && settings.clickSoundEnabled) {
  const { file, rank } = parseSquare(sq);
  const freq = squareToFreq(file, rank, settings.rootNote, settings.scale);
  const pieceType = board[sq]?.type ?? "p";
  audioRef.current.playNote(freq, pieceType, 0.15, 0);
}
```

**Debouncing hover:** Use a simple ref-based debounce (50ms) to prevent rapid-fire notes when sweeping across the board. Also skip playing if the same square was just hovered.

---

## 5. Settings Architecture

### New hook: `useAudioSettings`

```typescript
// src/hooks/useAudioSettings.ts

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem("chesstones-audio-settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Persist on change
  useEffect(() => {
    localStorage.setItem("chesstones-audio-settings", JSON.stringify(settings));
  }, [settings]);

  const setScale = (scaleId: string) => { /* find & set */ };
  const setRootNote = (root: RootNote) => { /* set */ };
  const setTheme = (themeId: string) => { /* find & set */ };
  const toggleHoverSound = () => { /* flip */ };
  const toggleClickSound = () => { /* flip */ };

  return { settings, setScale, setRootNote, setTheme, toggleHoverSound, toggleClickSound };
}
```

### New component: `AudioSettingsPanel`

A collapsible panel in the top controls area:

```
[♟ Play vs AI] [📼 Replay] [🔄 Flip] [🔊 ▬▬▬] [⚙ Sound]
                                                    ↓ (expands)
┌─────────────────────────────────────────────┐
│  Key: [C ▾]   Scale: [Major (Ionian) ▾]    │
│  Theme: [Classic ▾]                         │
│  ☑ Hover sounds   ☑ Click sounds            │
└─────────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Audio Settings Foundation (types + hook + plumbing)

**Files to create:**
- `src/audio/scales.ts` — `ScaleDefinition`, `SCALES`, `ROOT_NOTES`
- `src/audio/themes.ts` — `InstrumentTheme`, `AmbientConfig`, `EffectsConfig`, built-in themes
- `src/hooks/useAudioSettings.ts` — settings state + localStorage persistence

**Files to modify:**
- `src/types/audio.ts` — add `AudioSettings` type, export new interfaces
- `src/types/index.ts` — re-export new types

**Testable independently:** Yes — pure data definitions, can write unit tests for scale interval math.

**Toggle:** N/A (foundation layer)

---

### Phase 2: Scale System (frequency mapping refactor)

**Files to modify:**
- `src/constants/music.ts` — refactor `squareToFreq()` to accept `rootNote` + `scale` params. Keep old signature as a wrapper for backward compat during transition.
- `src/audio/AudioEngine.ts` — pass scale params through to `squareToFreq` calls in `playMove()`
- `src/hooks/useChessGame.ts` — pass scale params to `squareToFreq` in click preview
- `src/components/ChessTones.tsx` — wire `useAudioSettings` into the component tree; pass settings to hooks
- `src/components/BoardSquare.tsx` — update `squareToNote()` calls to use current scale (for the note label)

**Testable independently:** Yes — can unit test that each scale produces correct frequencies for all 64 squares.

**Toggle:** Scale defaults to "Major" and key to "C" (identical to current behavior). Changing them is opt-in.

---

### Phase 3: Instrument Themes (swappable sound palettes)

**Files to modify:**
- `src/audio/AudioEngine.ts` — add `setTheme()`, replace direct `PIECE_AUDIO` reads with `this.currentTheme.pieces`, add effects chain rebuild logic, add optional biquad filter node
- `src/constants/music.ts` — `PIECE_AUDIO` becomes the "Classic" theme's data; still importable but wrapped in a theme object

**Files to create:**
- Theme data files inside `src/audio/themes/` (one per theme, or all in one file initially)

**Testable independently:** Yes — can switch theme at runtime and hear the difference. Classic theme = exact current behavior.

**Toggle:** Theme defaults to "Classic" (identical to current behavior). Selecting another is opt-in.

---

### Phase 4: Hover & Click Sounds

**Files to modify:**
- `src/components/BoardSquare.tsx` — add `onMouseEnter` / `onMouseLeave` prop + handlers
- `src/components/ChessBoard.tsx` — accept + pass through hover callbacks
- `src/components/ChessTones.tsx` — implement hover/click handlers using audio settings, debounce logic
- `src/hooks/useChessGame.ts` — expand click preview to all squares (not just own pieces), guarded by `settings.clickSoundEnabled`
- `src/audio/AudioEngine.ts` — add a `playPreview()` method: short duration, reduced gain, no reverb send (for hover). This keeps hover sounds crisp and non-overlapping.

**Testable independently:** Yes — can toggle on/off in settings. When off, zero behavior change from current app.

**Toggle:** Both hover and click sounds have independent boolean toggles.

---

### Phase 5: Settings UI

**Files to create:**
- `src/components/AudioSettingsPanel.tsx` — collapsible settings UI with dropdowns and checkboxes

**Files to modify:**
- `src/components/ChessTones.tsx` — render `AudioSettingsPanel`, wire settings

**Testable independently:** Yes — visual only, all logic is in hooks.

**Toggle:** Panel is collapsible; defaults closed.

---

### Phase 6: Polish & Integration Testing

- Verify all 5 themes sound distinct and musical
- Test all 12 root keys × all scales — make sure no frequencies are out of audible range
- Test hover sound debouncing — sweeping across the board shouldn't produce audio chaos
- Test that disabling hover/click sounds fully silences them
- Test that changing scale/theme mid-game works correctly (ambient restarts, next move uses new scale)
- Test localStorage persistence — settings survive page reload
- Verify the "Classic" theme + "C Major" + hover/click OFF === exact current behavior (regression)
- Run `npm run build` to ensure no type errors

---

## 7. File Change Summary

| File | Phase | Change type |
|------|-------|-------------|
| `src/audio/scales.ts` | 1 | **NEW** — scale definitions and root note constants |
| `src/audio/themes.ts` | 1 | **NEW** — theme definitions and built-in theme data |
| `src/hooks/useAudioSettings.ts` | 1 | **NEW** — settings state management hook |
| `src/components/AudioSettingsPanel.tsx` | 5 | **NEW** — settings UI component |
| `src/types/audio.ts` | 1 | MODIFY — add new interfaces |
| `src/types/index.ts` | 1 | MODIFY — re-export new types |
| `src/constants/music.ts` | 2 | MODIFY — refactor `squareToFreq` signature |
| `src/audio/AudioEngine.ts` | 2,3,4 | MODIFY — theme injection, effects chain, preview method |
| `src/hooks/useChessGame.ts` | 2,4 | MODIFY — pass scale params, expand click sound |
| `src/hooks/useAudio.ts` | 3 | MODIFY — pass initial theme to engine |
| `src/components/BoardSquare.tsx` | 4 | MODIFY — add hover handlers |
| `src/components/ChessBoard.tsx` | 4 | MODIFY — pass through hover callbacks |
| `src/components/ChessTones.tsx` | 2-5 | MODIFY — wire everything together |

---

## 8. Design Principles

1. **Defaults = current behavior.** The "Classic" theme + "C Major" scale + hover/click OFF should produce audio identical to the current app. This is our regression baseline.

2. **Pure data, injectable config.** Scales and themes are plain objects. No singletons, no module-level state. Everything is passed explicitly to the functions that need it.

3. **Each feature is independently toggleable.** You can use a new scale with the classic theme. You can enable hover sounds without changing anything else. Settings are orthogonal.

4. **Phased rollout.** Each phase produces a working app. Phase 1 is invisible to the user. Phase 2 adds scale selection. Phase 3 adds themes. Phase 4 adds interactivity. Phase 5 adds UI. Phase 6 polishes.

5. **Extensible for future themes.** Adding a new theme = adding one `InstrumentTheme` object to the themes array. No code changes needed in the engine or UI.

6. **Testable.** Scale math is pure functions. Theme data is static objects. Hover debouncing is isolated in a ref. Each can be unit tested without the DOM.
