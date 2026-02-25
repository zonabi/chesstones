import type { PieceType } from "@/types";
import { FILES } from "@/constants";
import { PIECE_AUDIO, squareToFreq } from "@/constants";
import { parseSquare } from "@/engine";

/**
 * Web Audio API-based synthesis engine for ChessTones.
 *
 * Responsibilities:
 *  - Initialize AudioContext and effects chain (reverb, master gain)
 *  - Synthesize piece-specific notes with ADSR envelopes
 *  - Sonify moves (departure/arrival two-note phrases)
 *  - Special sounds for captures, castling, check, checkmate
 *  - Ambient background music reactive to game tension
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private currentTension = 0;
  private ambientInterval: ReturnType<typeof setInterval> | null = null;

  isInitialized = false;

  // ─── INITIALIZATION ─────────────────────────────────────

  init(): void {
    if (this.isInitialized) return;

    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    // Synthetic reverb impulse response
    this.reverb = this.ctx.createConvolver();
    const rate = this.ctx.sampleRate;
    const length = rate * 2;
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    this.reverb.buffer = impulse;
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.15;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    this.isInitialized = true;
  }

  // ─── NOTE SYNTHESIS ─────────────────────────────────────

  /**
   * Play a single synthesized note for a given piece type.
   * Uses the piece's waveform and ADSR envelope from PIECE_AUDIO.
   */
  playNote(freq: number, pieceType: PieceType, duration = 0.5, pan = 0): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || !this.reverb) return;

    const t = this.ctx.currentTime;
    const audio = PIECE_AUDIO[pieceType];

    const osc = this.ctx.createOscillator();
    osc.type = audio.wave;
    osc.frequency.value = freq;

    // King: add subtle vibrato (5 Hz modulation)
    if (pieceType === "k") {
      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      vibrato.frequency.value = 5;
      vibratoGain.gain.value = 3;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start(t);
      vibrato.stop(t + duration + audio.release);
    }

    // Queen: add a second oscillator at a perfect fifth (1.5x)
    let osc2: OscillatorNode | null = null;
    if (pieceType === "q") {
      osc2 = this.ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = freq * 1.5;
    }

    // ADSR envelope
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(audio.gain, t + audio.attack);
    env.gain.linearRampToValueAtTime(audio.gain * audio.sustain, t + audio.attack + audio.decay);
    env.gain.linearRampToValueAtTime(0, t + duration + audio.release);

    // Stereo panning
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;

    osc.connect(env);
    if (osc2) osc2.connect(env);
    env.connect(panner);
    panner.connect(this.masterGain);
    panner.connect(this.reverb);

    osc.start(t);
    osc.stop(t + duration + audio.release + 0.1);
    if (osc2) {
      osc2.start(t);
      osc2.stop(t + duration + audio.release + 0.1);
    }
  }

  // ─── MOVE SONIFICATION ──────────────────────────────────

  /** Play a two-note phrase for a chess move: quick departure, sustained arrival */
  playMove(
    fromSq: string,
    toSq: string,
    pieceType: PieceType,
    isCapture = false,
    isCastling = false,
    isCheck = false
  ): void {
    if (!this.isInitialized) return;

    const { file: ff, rank: fr } = parseSquare(fromSq);
    const { file: tf, rank: tr } = parseSquare(toSq);

    const fromFreq = squareToFreq(ff, fr);
    const toFreq = squareToFreq(tf, tr);
    const pan = (FILES.indexOf(tf) - 3.5) / 3.5;

    // Departure note (quick)
    this.playNote(fromFreq, pieceType, 0.15, pan * 0.5);

    // Arrival note (sustained)
    setTimeout(() => this.playNote(toFreq, pieceType, 0.4, pan), 150);

    // Overlay effects
    if (isCapture) setTimeout(() => this.playCaptureSound(toFreq), 100);
    if (isCastling) setTimeout(() => this.playCastlingSound(toFreq), 200);
    if (isCheck) setTimeout(() => this.playCheckSound(toFreq), 300);
  }

  // ─── SPECIAL SOUNDS ─────────────────────────────────────

  /** Descending sawtooth + noise burst for a capture */
  private playCaptureSound(baseFreq: number): void {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Descending sawtooth
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(baseFreq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.25, t + 0.6);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.1;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(env);
    env.connect(this.masterGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.7);
    noise.start(t);
    noise.stop(t + 0.15);
  }

  /** Perfect fifth chord resolution for castling */
  private playCastlingSound(baseFreq: number): void {
    if (!this.ctx || !this.masterGain || !this.reverb) return;

    const t = this.ctx.currentTime;
    [1, 1.5, 2].forEach((ratio, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq * ratio;
      const env = this.ctx!.createGain();
      env.gain.setValueAtTime(0, t + i * 0.1);
      env.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.05);
      env.gain.linearRampToValueAtTime(0, t + i * 0.1 + 0.6);
      osc.connect(env);
      env.connect(this.masterGain!);
      env.connect(this.reverb!);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.7);
    });
  }

  /** Tritone dissonance for check */
  private playCheckSound(baseFreq: number): void {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    [1, Math.sqrt(2)].forEach((ratio) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "square";
      osc.frequency.value = baseFreq * ratio;
      const env = this.ctx!.createGain();
      env.gain.setValueAtTime(0.15, t);
      env.gain.linearRampToValueAtTime(0, t + 0.4);
      osc.connect(env);
      env.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  /** Dramatic descending cadence for checkmate */
  playCheckmateSound(): void {
    if (!this.ctx || !this.masterGain || !this.reverb) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 493.88, 440, 392, 349.23, 329.63, 293.66, 261.63];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = i < 4 ? "sawtooth" : "sine";
      osc.frequency.value = freq;
      const env = this.ctx!.createGain();
      env.gain.setValueAtTime(0, t + i * 0.15);
      env.gain.linearRampToValueAtTime(0.2, t + i * 0.15 + 0.05);
      env.gain.linearRampToValueAtTime(0.05, t + i * 0.15 + 0.3);
      env.gain.linearRampToValueAtTime(0, t + (i + 1) * 0.15 + 0.5);
      osc.connect(env);
      env.connect(this.masterGain!);
      env.connect(this.reverb!);
      osc.start(t + i * 0.15);
      osc.stop(t + (i + 1) * 0.15 + 0.6);
    });
  }

  // ─── AMBIENT SYSTEM ─────────────────────────────────────

  /** Start the ambient background drone that reacts to game tension */
  startAmbient(tension = 0, materialBalance = 0, pieceCount = 32): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain || !this.reverb) return;

    this.currentTension = tension;
    this.stopAmbient();

    // Major feel (C3) when ahead or even; minor feel (B2) when behind
    const baseFreq = materialBalance >= 0 ? 130.81 : 123.47;

    const playAmbientNote = (): void => {
      if (!this.isInitialized || !this.ctx || !this.masterGain || !this.reverb) return;

      const t = this.ctx.currentTime;
      const tensionFactor = this.currentTension / 20;

      // Base drone oscillator
      const drone = this.ctx.createOscillator();
      drone.type = "sine";
      drone.frequency.value = baseFreq * (1 + tensionFactor * 0.05);
      const droneEnv = this.ctx.createGain();
      const droneVol = 0.04 + tensionFactor * 0.04;
      droneEnv.gain.setValueAtTime(droneVol, t);
      droneEnv.gain.linearRampToValueAtTime(droneVol * 0.7, t + 2);
      droneEnv.gain.linearRampToValueAtTime(0, t + 3.5);
      drone.connect(droneEnv);
      droneEnv.connect(this.masterGain!);
      droneEnv.connect(this.reverb!);
      drone.start(t);
      drone.stop(t + 4);

      // Higher tension adds dissonant harmonics
      if (tensionFactor > 0.3) {
        const tensionOsc = this.ctx.createOscillator();
        tensionOsc.type = "triangle";
        tensionOsc.frequency.value = baseFreq * (2 + tensionFactor);
        const tensionEnv = this.ctx.createGain();
        tensionEnv.gain.setValueAtTime(0, t);
        tensionEnv.gain.linearRampToValueAtTime(tensionFactor * 0.03, t + 0.5);
        tensionEnv.gain.linearRampToValueAtTime(0, t + 2.5);
        tensionOsc.connect(tensionEnv);
        tensionEnv.connect(this.masterGain!);
        tensionEnv.connect(this.reverb!);
        tensionOsc.start(t);
        tensionOsc.stop(t + 3);
      }

      // Endgame sparkle: random high notes with few pieces
      if (pieceCount < 12 && Math.random() > 0.5) {
        const sparkle = this.ctx.createOscillator();
        sparkle.type = "sine";
        sparkle.frequency.value = baseFreq * (4 + Math.random() * 4);
        const sparkleEnv = this.ctx.createGain();
        sparkleEnv.gain.setValueAtTime(0, t + 0.5);
        sparkleEnv.gain.linearRampToValueAtTime(0.03, t + 0.7);
        sparkleEnv.gain.linearRampToValueAtTime(0, t + 2);
        sparkle.connect(sparkleEnv);
        sparkleEnv.connect(this.reverb!);
        sparkle.start(t + 0.5);
        sparkle.stop(t + 2.5);
      }
    };

    playAmbientNote();
    const interval = Math.max(1500, 4000 - tension * 150);
    this.ambientInterval = setInterval(playAmbientNote, interval);
  }

  /** Update the tension level for the ambient system without restarting */
  updateTension(tension: number): void {
    this.currentTension = tension;
  }

  /** Stop the ambient background music */
  stopAmbient(): void {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  // ─── VOLUME & CLEANUP ───────────────────────────────────

  setVolume(vol: number): void {
    if (this.masterGain) this.masterGain.gain.value = vol;
  }

  destroy(): void {
    this.stopAmbient();
    if (this.ctx) this.ctx.close();
    this.isInitialized = false;
  }
}
