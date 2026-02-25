import type { PieceAudioMap } from "@/types";
import type { ScaleDefinition, RootNote } from "@/audio/scales";
import { rootSemitone, SCALES } from "@/audio/scales";
import { FILES } from "./chess";

/** Note names mapped to files a-h (C major scale) — used for display */
export const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B", "C"] as const;

/** Starting octave for rank 1 */
export const BASE_OCTAVE = 2;

/** Semitone offsets from A for each note name (used by legacy noteToFreq) */
const SEMITONE_MAP: Record<string, number> = {
  C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2,
};

/** Note names for all 12 chromatic pitches, for display labels */
const CHROMATIC_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Convert a note name + octave to frequency in Hz.
 * Based on A4 = 440 Hz equal temperament.
 */
export function noteToFreq(noteName: string, octave: number): number {
  const semitonesFromA4 = SEMITONE_MAP[noteName] + (octave - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Convert a board square (file, rank) to an audio frequency.
 *
 * When called with rootNote + scale, uses the scale's interval mapping.
 * When called without, falls back to C major (backward compat).
 */
export function squareToFreq(
  file: string,
  rank: number,
  rootNote?: RootNote,
  scale?: ScaleDefinition
): number {
  const fileIdx = FILES.indexOf(file);
  const octave = BASE_OCTAVE + Math.floor((rank - 1) * 5 / 8);

  if (rootNote && scale) {
    // Scale-aware: root semitone + scale interval for this file
    const semitones = rootSemitone(rootNote) + scale.intervals[fileIdx];
    // Calculate from C0 reference: C4 = MIDI 60, A4 = 440Hz
    // semitonesFromA4 = (semitones - 9) + (octave - 4) * 12
    const semitonesFromA4 = (semitones - 9) + (octave - 4) * 12;
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  }

  // Legacy: C major
  const noteName = NOTE_NAMES[fileIdx];
  return noteToFreq(noteName, octave);
}

/**
 * Convert a board square to a human-readable note string like "C2" or "G#5".
 *
 * When called with rootNote + scale, labels reflect the actual scale note.
 * When called without, falls back to C major note names.
 */
export function squareToNote(
  file: string,
  rank: number,
  rootNote?: RootNote,
  scale?: ScaleDefinition
): string {
  const fileIdx = FILES.indexOf(file);
  const octave = BASE_OCTAVE + Math.floor((rank - 1) * 5 / 8);

  if (rootNote && scale) {
    const semitones = rootSemitone(rootNote) + scale.intervals[fileIdx];
    const noteIdx = ((semitones % 12) + 12) % 12;
    const extraOctaves = Math.floor(semitones / 12);
    return `${CHROMATIC_NAMES[noteIdx]}${octave + extraOctaves}`;
  }

  const noteName = NOTE_NAMES[fileIdx];
  return `${noteName}${octave}`;
}

/** Default scale for backward-compatible calls */
export const DEFAULT_SCALE = SCALES[0];

/**
 * ADSR envelope + waveform configuration for each piece type.
 * Each piece has a unique sonic character.
 * NOTE: This is now the "Classic" theme's piece config.
 * Prefer using the theme system via AudioEngine.setTheme().
 */
export const PIECE_AUDIO: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.01,  decay: 0.3, sustain: 0.1, release: 0.2, gain: 0.3 },
  n: { wave: "triangle", attack: 0.02,  decay: 0.2, sustain: 0.3, release: 0.3, gain: 0.35 },
  b: { wave: "sawtooth", attack: 0.01,  decay: 0.4, sustain: 0.2, release: 0.4, gain: 0.15 },
  r: { wave: "square",   attack: 0.005, decay: 0.5, sustain: 0.4, release: 0.3, gain: 0.12 },
  q: { wave: "sawtooth", attack: 0.02,  decay: 0.6, sustain: 0.5, release: 0.5, gain: 0.2 },
  k: { wave: "sine",     attack: 0.05,  decay: 0.8, sustain: 0.3, release: 0.6, gain: 0.35 },
};
