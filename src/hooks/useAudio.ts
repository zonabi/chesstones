import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine } from "@/audio";

interface UseAudioReturn {
  audioRef: React.RefObject<AudioEngine | null>;
  audioStarted: boolean;
  volume: number;
  startAudio: () => void;
  setVolume: (v: number) => void;
}

/**
 * Manages the audio engine lifecycle and volume.
 * Board-reactive ambient music is synced by the parent component.
 */
export function useAudio(): UseAudioReturn {
  const audioRef = useRef<AudioEngine | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  // Create and destroy the engine
  useEffect(() => {
    audioRef.current = new AudioEngine();
    return () => {
      audioRef.current?.destroy();
    };
  }, []);

  // Initialize audio on user gesture
  const startAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.init();
      audioRef.current.setVolume(0.5);
      audioRef.current.startAmbient(0, 0, 32);
      setAudioStarted(true);
    }
  }, []);

  // Sync volume to engine
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    audioRef.current?.setVolume(v);
  }, []);

  return { audioRef, audioStarted, volume, startAudio, setVolume };
}
