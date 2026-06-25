import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";

/* ════════════════════════════════════════════════════════════════════
   Prétraitement RÉPLIQUÉ À L'IDENTIQUE du script Python d'entraînement
   (test_modele_final.py). Chaîne exacte :
     1) recentrage sur le poignet (landmark 0)
     2) division par l'échelle = distance euclidienne poignet → landmark 9
     3) StandardScaler : (x - mean) / scale   (chargé depuis scaler.json)
   ════════════════════════════════════════════════════════════════════ */

const MODEL_URL  = "/model/model.json";   // model.json + .bin dans public/model/
const SCALER_URL = "/model/scaler.json";  // mean / scale / classes

/* Ordre des classes — vient de encoder.classes_ (sera écrasé par scaler.json
   au chargement, mais on le met ici pour l'affichage avant chargement). */
export let LABELS = ["next", "pause", "play", "prev", "zoom_in", "zoom_out"];

/* Si ton camarade a entraîné sur image miroir, mets true (le script Python
   fait cv2.flip AVANT la détection, donc en principe false côté web car on
   passe déjà les landmarks de l'image affichée). À tester si gauche/droite
   semblent inversés. */
export const MIRROR_FEATURES = false;

/* (1)+(2) Normalisation géométrique — identique à normaliser_landmarks() */
function normalizeLandmarks(landmarks) {
  const wrist = landmarks[0];
  // recentrage
  const rel = landmarks.map((lm) => [
    lm.x - wrist.x,
    lm.y - wrist.y,
    lm.z - wrist.z,
  ]);
  // échelle = norme du landmark 9 recentré (base du majeur)
  const p9 = rel[9];
  let scale = Math.sqrt(p9[0] * p9[0] + p9[1] * p9[1] + p9[2] * p9[2]);
  if (scale < 1e-6) scale = 1e-6;
  // aplatissement en 63 valeurs
  const flat = [];
  for (const p of rel) {
    flat.push(p[0] / scale, p[1] / scale, p[2] / scale);
  }
  return flat;
}

export function useGestureModel() {
  const modelRef  = useRef(null);
  const scalerRef = useRef(null); // { mean: number[63], scale: number[63] }
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await tf.ready();
        const [model, scalerResp] = await Promise.all([
          tf.loadGraphModel(MODEL_URL),
          fetch(SCALER_URL).then((r) => {
            if (!r.ok) throw new Error("scaler.json introuvable dans public/model/");
            return r.json();
          }),
        ]);
        if (cancelled) { model.dispose?.(); return; }

        modelRef.current  = model;
        scalerRef.current = { mean: scalerResp.mean, scale: scalerResp.scale };
        if (Array.isArray(scalerResp.classes) && scalerResp.classes.length) {
          LABELS = scalerResp.classes; // ordre exact garanti
        }
        setReady(true);
      } catch (e) {
        if (!cancelled) setError("Chargement modèle/scaler échoué : " + e.message);
      }
    })();
    return () => {
      cancelled = true;
      modelRef.current?.dispose?.();
      modelRef.current = null;
    };
  }, []);

  /* predict(landmarks) → { gesture, index, confidence, scores } | null */
  const predict = useCallback((landmarks) => {
    const model  = modelRef.current;
    const scaler = scalerRef.current;
    if (!model || !scaler || !landmarks || landmarks.length !== 21) return null;

    let lms = landmarks;
    if (MIRROR_FEATURES) lms = landmarks.map((lm) => ({ ...lm, x: 1 - lm.x }));

    // (1)+(2) normalisation géométrique
    const feat = normalizeLandmarks(lms);
    // (3) StandardScaler : (x - mean) / scale
    const { mean, scale } = scaler;
    const scaled = feat.map((v, i) => (v - mean[i]) / scale[i]);

    return tf.tidy(() => {
      const input  = tf.tensor2d([scaled], [1, 63]);
      const output = model.predict(input);
      const scores = output.dataSync();
      let index = 0;
      for (let i = 1; i < scores.length; i++) if (scores[i] > scores[index]) index = i;
      return {
        gesture: LABELS[index] ?? `classe_${index}`,
        index,
        confidence: scores[index],
        scores: Array.from(scores),
      };
    });
  }, []);

  return { ready, error, predict };
}