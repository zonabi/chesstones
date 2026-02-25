import { useState, useCallback, useEffect } from "react";
import type { AudioSettingsData } from "@/types";
import type { RootNote } from "@/audio/scales";
import type { InstrumentTheme } from "@/audio/themes";
import { SCALES, getScaleById, ROOT_NOTES } from "@/audio/scales";
import { THEMES, getThemeById } from "@/audio/themes";

const STORAGE_KEY = "chesstones-audio-settings";

const DEFAULT_SETTINGS: AudioSettingsData = {
  rootNote: "C",
  scaleId: "major",
  themeId: "classic",
  hoverSoundEnabled: true,
  clickSoundEnabled: true,
};

function isValidRootNote(value: unknown): value is RootNote {
  return typeof value === "string" && ROOT_NOTES.includes(value as RootNote);
}

function loadSettings(): AudioSettingsData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AudioSettingsData>;
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      // Validate rootNote from localStorage
      if (!isValidRootNote(merged.rootNote)) {
        merged.rootNote = DEFAULT_SETTINGS.rootNote;
      }
      return merged;
    }
  } catch {
    // ignore corrupt localStorage
  }
  return { ...DEFAULT_SETTINGS };
}

export interface AudioSettings {
  data: AudioSettingsData;
  scale: ReturnType<typeof getScaleById>;
  theme: InstrumentTheme;
}

export interface UseAudioSettingsReturn {
  settings: AudioSettings;
  setRootNote: (root: RootNote) => void;
  setScale: (scaleId: string) => void;
  setTheme: (themeId: string) => void;
  toggleHoverSound: () => void;
  toggleClickSound: () => void;
  scales: typeof SCALES;
  themes: typeof THEMES;
}

/**
 * Manages audio customization settings with localStorage persistence.
 * Provides resolved scale/theme objects alongside the raw settings data.
 */
export function useAudioSettings(): UseAudioSettingsReturn {
  const [data, setData] = useState<AudioSettingsData>(loadSettings);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Resolve objects from IDs
  const scale = getScaleById(data.scaleId);
  const theme = getThemeById(data.themeId);

  const settings: AudioSettings = { data, scale, theme };

  const setRootNote = useCallback((root: RootNote) => {
    setData((prev) => ({ ...prev, rootNote: root }));
  }, []);

  const setScale = useCallback((scaleId: string) => {
    setData((prev) => ({ ...prev, scaleId }));
  }, []);

  const setTheme = useCallback((themeId: string) => {
    setData((prev) => ({ ...prev, themeId }));
  }, []);

  const toggleHoverSound = useCallback(() => {
    setData((prev) => ({ ...prev, hoverSoundEnabled: !prev.hoverSoundEnabled }));
  }, []);

  const toggleClickSound = useCallback(() => {
    setData((prev) => ({ ...prev, clickSoundEnabled: !prev.clickSoundEnabled }));
  }, []);

  return {
    settings,
    setRootNote,
    setScale,
    setTheme,
    toggleHoverSound,
    toggleClickSound,
    scales: SCALES,
    themes: THEMES,
  };
}
