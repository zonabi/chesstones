import { useState, useCallback, useEffect, useRef } from "react";
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

function loadSettings(): AudioSettingsData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AudioSettingsData>;
      const settings = { ...DEFAULT_SETTINGS, ...parsed };
      
      // Validate loaded values and fallback to defaults if invalid
      if (parsed.rootNote && !ROOT_NOTES.includes(parsed.rootNote as RootNote)) {
        settings.rootNote = DEFAULT_SETTINGS.rootNote;
      }
      if (parsed.scaleId && !SCALES.find(s => s.id === parsed.scaleId)) {
        settings.scaleId = DEFAULT_SETTINGS.scaleId;
      }
      if (parsed.themeId && !THEMES.find(t => t.id === parsed.themeId)) {
        settings.themeId = DEFAULT_SETTINGS.themeId;
      }
      
      return settings;
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
  const hasMounted = useRef(false);

  // Persist on change (skip initial mount to avoid redundant write)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
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
