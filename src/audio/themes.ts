/**
 * Instrument theme definitions for ChessTones.
 *
 * Each theme provides a complete sound palette: piece voices (waveform + ADSR),
 * ambient drone configuration, and effects chain parameters.
 */
import type { PieceAudioMap } from "@/types";

/** Configuration for the ambient drone system */
export interface AmbientConfig {
  baseWave: OscillatorType;
  tensionWave: OscillatorType;
  sparkleEnabled: boolean;
  reverbMix: number;
  droneGain: number;
}

/** Configuration for the effects chain */
export interface EffectsConfig {
  reverbDecay: number;
  reverbMix: number;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterQ?: number;
}

/** A complete instrument theme */
export interface InstrumentTheme {
  id: string;
  name: string;
  description: string;
  pieces: PieceAudioMap;
  ambient: AmbientConfig;
  effects: EffectsConfig;
}

// ─── BUILT-IN THEMES ─────────────────────────────────────

const CLASSIC_PIECES: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.05,  decay: 0.5, sustain: 0.25, release: 0.5, gain: 0.28 },
  n: { wave: "triangle", attack: 0.06,  decay: 0.4, sustain: 0.4,  release: 0.6, gain: 0.3 },
  b: { wave: "sawtooth", attack: 0.05,  decay: 0.6, sustain: 0.3,  release: 0.7, gain: 0.12 },
  r: { wave: "square",   attack: 0.03,  decay: 0.7, sustain: 0.5,  release: 0.6, gain: 0.1 },
  q: { wave: "sawtooth", attack: 0.06,  decay: 0.8, sustain: 0.6,  release: 0.8, gain: 0.18 },
  k: { wave: "sine",     attack: 0.1,   decay: 1.0, sustain: 0.4,  release: 0.9, gain: 0.3 },
};

const ORCHESTRAL_PIECES: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.03,  decay: 0.3,  sustain: 0.15, release: 0.3,  gain: 0.23 }, // pizzicato
  n: { wave: "triangle", attack: 0.12,  decay: 0.6,  sustain: 0.55, release: 0.8,  gain: 0.25 }, // french horn
  b: { wave: "sawtooth", attack: 0.15,  decay: 0.8,  sustain: 0.6,  release: 1.0,  gain: 0.1 },  // cello
  r: { wave: "sine",     attack: 0.03,  decay: 1.0,  sustain: 0.3,  release: 0.7,  gain: 0.25 }, // timpani
  q: { wave: "sawtooth", attack: 0.15,  decay: 0.9,  sustain: 0.7,  release: 1.0,  gain: 0.13 }, // full strings
  k: { wave: "sine",     attack: 0.12,  decay: 1.2,  sustain: 0.5,  release: 1.1,  gain: 0.25 }, // organ
};

const JAZZ_PIECES: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.05,  decay: 0.5,  sustain: 0.25, release: 0.5,  gain: 0.22 }, // walking bass
  n: { wave: "triangle", attack: 0.06,  decay: 0.4,  sustain: 0.3,  release: 0.5,  gain: 0.18 }, // muted trumpet
  b: { wave: "sine",     attack: 0.04,  decay: 0.7,  sustain: 0.2,  release: 0.8,  gain: 0.25 }, // vibraphone
  r: { wave: "square",   attack: 0.04,  decay: 0.6,  sustain: 0.35, release: 0.5,  gain: 0.07 }, // upright bass
  q: { wave: "sawtooth", attack: 0.08,  decay: 0.7,  sustain: 0.45, release: 0.7,  gain: 0.1 },  // saxophone
  k: { wave: "sine",     attack: 0.05,  decay: 0.8,  sustain: 0.3,  release: 0.7,  gain: 0.25 }, // piano chord
};

const ELECTRONIC_PIECES: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.01,  decay: 0.3,  sustain: 0.1,  release: 0.3,  gain: 0.3 },  // 808 kick
  n: { wave: "triangle", attack: 0.02,  decay: 0.2,  sustain: 0.1,  release: 0.2,  gain: 0.25 }, // arp blip
  b: { wave: "sawtooth", attack: 0.08,  decay: 0.5,  sustain: 0.45, release: 0.5,  gain: 0.09 }, // pad slice
  r: { wave: "square",   attack: 0.02,  decay: 0.6,  sustain: 0.15, release: 0.4,  gain: 0.12 }, // bass drop
  q: { wave: "sawtooth", attack: 0.04,  decay: 0.5,  sustain: 0.6,  release: 0.6,  gain: 0.15 }, // supersaw
  k: { wave: "square",   attack: 0.05,  decay: 0.7,  sustain: 0.35, release: 0.6,  gain: 0.18 }, // vocoder-like
};

const MINIMAL_PIECES: PieceAudioMap = {
  p: { wave: "sine", attack: 0.06,  decay: 0.5,  sustain: 0.2,  release: 0.6, gain: 0.18 },
  n: { wave: "sine", attack: 0.07,  decay: 0.45, sustain: 0.3,  release: 0.6, gain: 0.2 },
  b: { wave: "sine", attack: 0.08,  decay: 0.55, sustain: 0.25, release: 0.7, gain: 0.16 },
  r: { wave: "sine", attack: 0.05,  decay: 0.6,  sustain: 0.3,  release: 0.6, gain: 0.18 },
  q: { wave: "sine", attack: 0.1,   decay: 0.7,  sustain: 0.4,  release: 0.8, gain: 0.2 },
  k: { wave: "sine", attack: 0.12,  decay: 0.8,  sustain: 0.35, release: 0.9, gain: 0.22 },
};

export const THEMES: readonly InstrumentTheme[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Pure synthesis — the original ChessTones sound",
    pieces: CLASSIC_PIECES,
    ambient: {
      baseWave: "sine",
      tensionWave: "triangle",
      sparkleEnabled: true,
      reverbMix: 0.25,
      droneGain: 0.04,
    },
    effects: {
      reverbDecay: 3,
      reverbMix: 0.25,
    },
  },
  {
    id: "orchestral",
    name: "Orchestral",
    description: "Warm, rich, and legato — strings, horns, and timpani",
    pieces: ORCHESTRAL_PIECES,
    ambient: {
      baseWave: "sine",
      tensionWave: "sawtooth",
      sparkleEnabled: true,
      reverbMix: 0.3,
      droneGain: 0.05,
    },
    effects: {
      reverbDecay: 3.5,
      reverbMix: 0.3,
      filterType: "lowpass",
      filterFreq: 2000,
      filterQ: 0.7,
    },
  },
  {
    id: "jazz",
    name: "Jazz",
    description: "Smooth and muted — vibes, muted trumpet, and walking bass",
    pieces: JAZZ_PIECES,
    ambient: {
      baseWave: "sine",
      tensionWave: "triangle",
      sparkleEnabled: false,
      reverbMix: 0.25,
      droneGain: 0.03,
    },
    effects: {
      reverbDecay: 2.5,
      reverbMix: 0.25,
      filterType: "lowpass",
      filterFreq: 3000,
      filterQ: 0.5,
    },
  },
  {
    id: "electronic",
    name: "Electronic",
    description: "Glitchy, bright, and punchy — 808s, arps, and supersaws",
    pieces: ELECTRONIC_PIECES,
    ambient: {
      baseWave: "square",
      tensionWave: "sawtooth",
      sparkleEnabled: true,
      reverbMix: 0.1,
      droneGain: 0.03,
    },
    effects: {
      reverbDecay: 1,
      reverbMix: 0.1,
      filterType: "highpass",
      filterFreq: 200,
      filterQ: 1.0,
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Sparse and clean — pure sine waves, quiet ambient",
    pieces: MINIMAL_PIECES,
    ambient: {
      baseWave: "sine",
      tensionWave: "sine",
      sparkleEnabled: false,
      reverbMix: 0.2,
      droneGain: 0.02,
    },
    effects: {
      reverbDecay: 3,
      reverbMix: 0.2,
    },
  },
] as const;

/** Look up a theme by its id, returns Classic as fallback */
export function getThemeById(id: string): InstrumentTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
