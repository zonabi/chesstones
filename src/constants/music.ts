import type { PieceAudioMap } from "@/types";
import { FILES } from "./chess";

/** Note names mapped to files a-h (C major scale) */
export const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B", "C"] as const;

/** Starting octave for rank 1 */
export const BASE_OCTAVE = 2;

/** Semitone offsets from A for each note name */
const SEMITONE_MAP: Record<string, number> = {
  C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2,
};

/**
 * Convert a note name + octave to frequency in Hz.
 * Based on A4 = 440 Hz equal temperament.
 */
export function noteToFreq(noteName: string, octave: number): number {
  const semitonesFromA4 = SEMITONE_MAP[noteName] + (octave - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

/** Convert a board square (file, rank) to an audio frequency */
export function squareToFreq(file: string, rank: number): number {
  const fileIdx = FILES.indexOf(file);
  const noteName = NOTE_NAMES[fileIdx];
  const octave = BASE_OCTAVE + Math.floor((rank - 1) * 5 / 8);
  return noteToFreq(noteName, octave);
}

/** Convert a board square to a human-readable note string like "C2" or "G5" */
export function squareToNote(file: string, rank: number): string {
  const fileIdx = FILES.indexOf(file);
  const noteName = NOTE_NAMES[fileIdx];
  const octave = BASE_OCTAVE + Math.floor((rank - 1) * 5 / 8);
  return `${noteName}${octave}`;
}

/**
 * ADSR envelope + waveform configuration for each piece type.
 * Each piece has a unique sonic character.
 */
export const PIECE_AUDIO: PieceAudioMap = {
  p: { wave: "sine",     attack: 0.01,  decay: 0.3, sustain: 0.1, release: 0.2, gain: 0.3 },
  n: { wave: "triangle", attack: 0.02,  decay: 0.2, sustain: 0.3, release: 0.3, gain: 0.35 },
  b: { wave: "sawtooth", attack: 0.01,  decay: 0.4, sustain: 0.2, release: 0.4, gain: 0.15 },
  r: { wave: "square",   attack: 0.005, decay: 0.5, sustain: 0.4, release: 0.3, gain: 0.12 },
  q: { wave: "sawtooth", attack: 0.02,  decay: 0.6, sustain: 0.5, release: 0.5, gain: 0.2 },
  k: { wave: "sine",     attack: 0.05,  decay: 0.8, sustain: 0.3, release: 0.6, gain: 0.35 },
};
