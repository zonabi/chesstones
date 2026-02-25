import { describe, it, expect } from "vitest";
import { noteToFreq, squareToFreq, squareToNote, PIECE_AUDIO } from "@/constants/music";

describe("noteToFreq", () => {
  it("A4 = 440 Hz", () => {
    expect(noteToFreq("A", 4)).toBeCloseTo(440, 1);
  });

  it("A5 = 880 Hz (one octave up)", () => {
    expect(noteToFreq("A", 5)).toBeCloseTo(880, 1);
  });

  it("A3 = 220 Hz (one octave down)", () => {
    expect(noteToFreq("A", 3)).toBeCloseTo(220, 1);
  });

  it("C4 (middle C) ≈ 261.6 Hz", () => {
    expect(noteToFreq("C", 4)).toBeCloseTo(261.63, 0);
  });

  it("higher octave produces higher frequency", () => {
    expect(noteToFreq("C", 5)).toBeGreaterThan(noteToFreq("C", 4));
  });
});

describe("squareToFreq", () => {
  it("returns a positive frequency for any square", () => {
    for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      for (let rank = 1; rank <= 8; rank++) {
        expect(squareToFreq(file, rank)).toBeGreaterThan(0);
      }
    }
  });

  it("different squares produce different frequencies", () => {
    const f1 = squareToFreq("a", 1);
    const f2 = squareToFreq("h", 8);
    expect(f1).not.toEqual(f2);
  });

  it("higher ranks produce higher or equal frequencies for the same file", () => {
    // Due to octave mapping, rank 8 should be in a higher octave than rank 1
    expect(squareToFreq("a", 8)).toBeGreaterThan(squareToFreq("a", 1));
  });

  it("returns a number in a reasonable audible range", () => {
    for (const file of ["a", "e", "h"]) {
      for (const rank of [1, 4, 8]) {
        const freq = squareToFreq(file, rank);
        // Human hearing: ~20 Hz to 20,000 Hz; musical range roughly 20–5000 Hz
        expect(freq).toBeGreaterThan(20);
        expect(freq).toBeLessThan(5000);
      }
    }
  });
});

describe("squareToNote", () => {
  it("returns a string like 'C2' for a1", () => {
    const note = squareToNote("a", 1);
    expect(note).toMatch(/^[A-G]\d$/);
  });

  it("file 'a' maps to note name 'C'", () => {
    expect(squareToNote("a", 1)[0]).toBe("C");
  });

  it("file 'd' maps to note name 'F' (4th in C major scale)", () => {
    // C D E F G A B C — d is index 3 → F
    expect(squareToNote("d", 1)[0]).toBe("F");
  });

  it("higher ranks produce higher octave labels", () => {
    const note1 = squareToNote("a", 1);
    const note8 = squareToNote("a", 8);
    const octave1 = parseInt(note1.slice(-1));
    const octave8 = parseInt(note8.slice(-1));
    expect(octave8).toBeGreaterThan(octave1);
  });
});

describe("PIECE_AUDIO", () => {
  const pieces = ["p", "n", "b", "r", "q", "k"] as const;

  it("has an entry for every piece type", () => {
    for (const p of pieces) {
      expect(PIECE_AUDIO[p]).toBeDefined();
    }
  });

  it("all entries have valid oscillator wave types", () => {
    const validWaves = ["sine", "square", "sawtooth", "triangle"];
    for (const p of pieces) {
      expect(validWaves).toContain(PIECE_AUDIO[p].wave);
    }
  });

  it("all ADSR values are positive numbers", () => {
    for (const p of pieces) {
      const cfg = PIECE_AUDIO[p];
      expect(cfg.attack).toBeGreaterThan(0);
      expect(cfg.decay).toBeGreaterThan(0);
      expect(cfg.sustain).toBeGreaterThan(0);
      expect(cfg.release).toBeGreaterThan(0);
      expect(cfg.gain).toBeGreaterThan(0);
    }
  });

  it("gain values are between 0 and 1", () => {
    for (const p of pieces) {
      expect(PIECE_AUDIO[p].gain).toBeLessThanOrEqual(1);
      expect(PIECE_AUDIO[p].gain).toBeGreaterThan(0);
    }
  });
});
