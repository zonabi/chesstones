import React, { useState } from "react";
import type { UseAudioSettingsReturn } from "@/hooks/useAudioSettings";
import type { RootNote } from "@/audio/scales";
import { ROOT_NOTES } from "@/audio/scales";
import { GOLD, BG_PANEL } from "@/styles/theme";

interface AudioSettingsPanelProps {
  audioSettings: UseAudioSettingsReturn;
}

/**
 * Collapsible settings panel for audio customization.
 * Allows changing musical scale, root key, instrument theme,
 * and toggling hover/click sound interactions.
 */
export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({ audioSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, setRootNote, setScale, setTheme, toggleHoverSound, toggleClickSound, scales, themes } = audioSettings;

  const selectStyle: React.CSSProperties = {
    padding: "5px 8px",
    fontSize: 12,
    background: "rgba(20,20,35,0.8)",
    border: "1px solid #ffffff15",
    color: "#ccc",
    borderRadius: 4,
    cursor: "pointer",
    outline: "none",
    minWidth: 120,
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#aaa",
    cursor: "pointer",
    userSelect: "none",
  };

  const toggleBtnStyle: React.CSSProperties = {
    padding: "6px 14px",
    fontSize: 12,
    background: isOpen ? "rgba(201,168,76,0.15)" : BG_PANEL,
    border: `1px solid ${isOpen ? "#c9a84c44" : "#ffffff10"}`,
    color: isOpen ? GOLD : "#888",
    borderRadius: 4,
    cursor: "pointer",
    transition: "all 0.3s",
    letterSpacing: 1,
    fontWeight: 300,
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setIsOpen(!isOpen)} style={toggleBtnStyle}>
        {isOpen ? "▾" : "▸"} Sound
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: 6,
          padding: "14px 18px",
          background: "rgba(20,20,35,0.95)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: 8,
          backdropFilter: "blur(12px)",
          zIndex: 100,
          minWidth: 300,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {/* Row 1: Key + Scale */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Key</label>
              <select
                value={settings.data.rootNote}
                onChange={(e) => setRootNote(e.target.value as RootNote)}
                style={{ ...selectStyle, minWidth: 60 }}
              >
                {ROOT_NOTES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              <label style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Scale</label>
              <select
                value={settings.data.scaleId}
                onChange={(e) => setScale(e.target.value)}
                style={selectStyle}
              >
                {scales.map((s) => (
                  <option key={s.id} value={s.id} title={s.description}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Theme */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <label style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Theme</label>
            <select
              value={settings.data.themeId}
              onChange={(e) => setTheme(e.target.value)}
              style={selectStyle}
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id} title={t.description}>
                  {t.name} — {t.description}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Toggles */}
          <div style={{
            display: "flex", gap: 16,
            borderTop: "1px solid #ffffff10",
            paddingTop: 10,
          }}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={settings.data.hoverSoundEnabled}
                onChange={toggleHoverSound}
                style={{ accentColor: GOLD }}
              />
              Hover sounds
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={settings.data.clickSoundEnabled}
                onChange={toggleClickSound}
                style={{ accentColor: GOLD }}
              />
              Click sounds
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
