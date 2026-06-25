import { useState, useEffect, useCallback } from "react";

/* Réglages de détection — partagés entre l'onglet Caméra et la présentation,
   sauvegardés dans le navigateur (localStorage) pour persister. */

export const DEFAULT_GESTURE_SETTINGS = {
  confidence:   0.80, // seuil de confiance (0–1) sous lequel on ignore
  smoothing:    5,    // nb de frames moyennées (1 = aucun lissage)
  stableFrames: 5,    // frames stables requises avant de déclencher
  cooldownMs:   1200, // délai mini (ms) entre deux déclenchements
};

const STORAGE_KEY = "sg_gesture_settings";

export function loadGestureSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GESTURE_SETTINGS };
    return { ...DEFAULT_GESTURE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_GESTURE_SETTINGS };
  }
}

export function useGestureSettings() {
  const [settings, setSettings] = useState(loadGestureSettings);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset  = useCallback(() => setSettings({ ...DEFAULT_GESTURE_SETTINGS }), []);

  return { settings, update, reset };
}