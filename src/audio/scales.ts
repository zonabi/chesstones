/**
 * Musical scale definitions for ChessTones.
 *
 * Each scale maps the 8 board files (a–h) to semitone offsets from the root note.
 * Combined with a root note selection, this determines the pitch of every square.
 */

/** A musical scale that can be applied to the board */
export interface ScaleDefinition {
  id: string;
  name: string;
  intervals: number[];   // 8 semitone offsets from root (one per file)
  description: string;
}

/** All available scales */
export const SCALES: readonly ScaleDefinition[] = [
  { id: "major",      name: "Major (Ionian)",    intervals: [0, 2, 4, 5, 7, 9, 11, 12], description: "Bright, classic" },
  { id: "minor",      name: "Natural Minor",     intervals: [0, 2, 3, 5, 7, 8, 10, 12], description: "Dark, emotional" },
  { id: "pentatonic", name: "Pentatonic Major",   intervals: [0, 2, 4, 7, 9, 12, 14, 16], description: "Open, folk-like" },
  { id: "pent-minor", name: "Pentatonic Minor",   intervals: [0, 3, 5, 7, 10, 12, 15, 17], description: "Bluesy, soulful" },
  { id: "blues",      name: "Blues",              intervals: [0, 3, 5, 6, 7, 10, 12, 15], description: "Gritty, expressive" },
  { id: "dorian",     name: "Dorian",             intervals: [0, 2, 3, 5, 7, 9, 10, 12], description: "Jazz, sophisticated" },
  { id: "mixolydian", name: "Mixolydian",         intervals: [0, 2, 4, 5, 7, 9, 10, 12], description: "Dominant, funky" },
  { id: "chromatic",  name: "Chromatic",          intervals: [0, 1, 2, 3, 4, 5, 6, 7],   description: "All semitones" },
] as const;

/** All 12 chromatic root notes */
export const ROOT_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export type RootNote = (typeof ROOT_NOTES)[number];

/** Semitone offset from C for each root note */
const ROOT_SEMITONES: Record<RootNote, number> = {
  "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
  "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11,
};

/** Get the semitone offset from C for a root note */
export function rootSemitone(root: RootNote): number {
  return ROOT_SEMITONES[root];
}

/** Look up a scale by its id, returns the Major scale as fallback */
export function getScaleById(id: string): ScaleDefinition {
  return SCALES.find((s) => s.id === id) ?? SCALES[0];
}
