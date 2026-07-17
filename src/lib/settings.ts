/* Persistent player preferences. Survives restarts (not run-scoped). */

export const SETTINGS_KEY = "gaffer.settings.v1";

export type Settings = {
  celebrations: boolean;   // confetti + big verdict flourishes
  fastResults: boolean;    // shorter goal-celebration pauses in live matches
};

const DEFAULTS: Settings = { celebrations: true, fastResults: false };

export function loadSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}
