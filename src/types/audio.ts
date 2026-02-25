import type { PieceType } from "./chess";
import type { RootNote } from "@/audio/scales";

/** ADSR envelope + waveform config for a piece type */
export interface PieceAudioConfig {
  wave: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  gain: number;
}

/** Map from piece type to its audio configuration */
export type PieceAudioMap = Record<PieceType, PieceAudioConfig>;

/** Serializable audio settings (stored in localStorage) */
export interface AudioSettingsData {
  rootNote: RootNote;
  scaleId: string;
  themeId: string;
  hoverSoundEnabled: boolean;
  clickSoundEnabled: boolean;
}
