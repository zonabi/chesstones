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
  p: { wave: "sine",     attack: 0.01,  decay: 0.3, sustain: 0.1, release: 0.2, gain: 0.3 },
  n: { wave: "triangle", attack: 0.02,  decay: 0.2, sustain: 0.3, release: 0.3, gain: 0.35 },
  b: { wave: "sawtooth", attack: 0.01,  decay: 0.4, sustain: 0.2, release: 0.4, gain: 0.15 },
  r: { wave: "square",   attack: 0.005, decay: 0.5, sustain: 0.4, release: 0.3, gain: 0.12 },
  q: { wave: "sawtooth", attack: 0.02,  decay: 0.6, sustain: 0.5, release: 0.5, gain: 0.2 },
  k: { wave: "sine",     attack: 0.05,  decay: 0.8, sustain: 0.3, release: 0.6, gain: 0.35 },
};

const ORCHESTRAL_PIECES: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.1,  gain: 0.25 }, // pizzicato
  n: { wave: "triangle", attack: 0.08,  decay: 0.4,  sustain: 0.5,  release: 0.5,  gain: 0.3 },  // french horn
  b: { wave: "sawtooth", attack: 0.1,   decay: 0.6,  sustain: 0.6,  release: 0.7,  gain: 0.12 }, // cello
  r: { wave: "sine",     attack: 0.005, decay: 0.8,  sustain: 0.2,  release: 0.4,  gain: 0.3 },  // timpani
  q: { wave: "sawtooth", attack: 0.12,  decay: 0.7,  sustain: 0.7,  release: 0.8,  gain: 0.15 }, // full strings
  k: { wave: "sine",     attack: 0.08,  decay: 1.0,  sustain: 0.5,  release: 0.9,  gain: 0.3 },  // organ
};

const JAZZ_PIECES: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.02,  decay: 0.3,  sustain: 0.15, release: 0.25, gain: 0.25 }, // walking bass
  n: { wave: "triangle", attack: 0.03,  decay: 0.25, sustain: 0.2,  release: 0.2,  gain: 0.2 },  // muted trumpet
  b: { wave: "sine",     attack: 0.005, decay: 0.5,  sustain: 0.1,  release: 0.6,  gain: 0.3 },  // vibraphone
  r: { wave: "square",   attack: 0.01,  decay: 0.4,  sustain: 0.3,  release: 0.3,  gain: 0.08 }, // upright bass
  q: { wave: "sawtooth", attack: 0.04,  decay: 0.5,  sustain: 0.4,  release: 0.5,  gain: 0.12 }, // saxophone
  k: { wave: "sine",     attack: 0.01,  decay: 0.6,  sustain: 0.2,  release: 0.5,  gain: 0.3 },  // piano chord
};

const ELECTRONIC_PIECES: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.001, decay: 0.15, sustain: 0.0,  release: 0.1,  gain: 0.35 }, // 808 kick
  n: { wave: "triangle", attack: 0.001, decay: 0.08, sustain: 0.0,  release: 0.05, gain: 0.3 },  // arp blip
  b: { wave: "sawtooth", attack: 0.05,  decay: 0.3,  sustain: 0.4,  release: 0.3,  gain: 0.1 },  // pad slice
  r: { wave: "square",   attack: 0.001, decay: 0.4,  sustain: 0.1,  release: 0.2,  gain: 0.15 }, // bass drop
  q: { wave: "sawtooth", attack: 0.01,  decay: 0.3,  sustain: 0.6,  release: 0.4,  gain: 0.18 }, // supersaw
  k: { wave: "square",   attack: 0.02,  decay: 0.5,  sustain: 0.3,  release: 0.4,  gain: 0.2 },  // vocoder-like
};

const MINIMAL_PIECES: PieceAudioMap = {
  p: { wave: "sine", attack: 0.02,  decay: 0.3,  sustain: 0.1, release: 0.3, gain: 0.2 },
  n: { wave: "sine", attack: 0.03,  decay: 0.25, sustain: 0.2, release: 0.3, gain: 0.22 },
  b: { wave: "sine", attack: 0.04,  decay: 0.35, sustain: 0.15, release: 0.4, gain: 0.18 },
  r: { wave: "sine", attack: 0.01,  decay: 0.4,  sustain: 0.2, release: 0.3, gain: 0.2 },
  q: { wave: "sine", attack: 0.05,  decay: 0.5,  sustain: 0.3, release: 0.5, gain: 0.22 },
  k: { wave: "sine", attack: 0.06,  decay: 0.6,  sustain: 0.25, release: 0.6, gain: 0.25 },
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
      reverbMix: 0.15,
      droneGain: 0.04,
    },
    effects: {
      reverbDecay: 2,
      reverbMix: 0.15,
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
