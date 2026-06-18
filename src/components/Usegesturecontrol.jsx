// ─────────────────────────────────────────────────────────────────────────────
// useGestureControl.js - Version Professionnelle (Analyse Cinématique & Swipe)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react";

export function useGestureControl({
  enabled = false,
  onGesture = () => {},
  debounceMs = 800,
  modelComplexity = 1,
  minDetection = 0.75,
  minTracking = 0.6,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  // Buffers et références pour le suivi temporel (Cinématique)
  const motionBufferRef = useRef([]); // Stocke les positions successives [{x, y, time}]
  const lastTriggerTimeRef = useRef(0);
  const thumbHoldRef = useRef(null);
  const onGestureRef = useRef(onGesture);

  const [status, setStatus] = useState("idle");
  const [lastGesture, setLastGesture] = useState(null);

  useEffect(() => { onGestureRef.current = onGesture; }, [onGesture]);

  const injectScript = useCallback((src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Erreur CDN`));
    document.head.appendChild(s);
  }), []);

  // ── ALGORITHME DE SUIVI ET DÉTECTION PROFESSIONNEL ────────────────────────
  const processTracking = useCallback((landmarks) => {
    const now = Date.now();
    
    // Éviter les déclenchements en rafale (Debounce matériel strict)
    if (now - lastTriggerTimeRef.current < debounceMs) {
      motionBufferRef.current = []; // Vider le buffer pendant le cooldown
      return null;
    }

    // 1. Calcul de la distance Euclidienne de référence (Taille de la main)
    const handScale = Math.hypot(
      landmarks[0].x - landmarks[9].x,
      landmarks[0].y - landmarks[9].y
    );
    if (handScale < 0.05) return null; // Main trop loin

    // 2. Extraction des points clés (Poignet et Index)
    const wrist = landmarks[0];
    const indexTip = landmarks[8];
    const indexBase = landmarks[5];

    // Vérifier si l'index est levé/tendu
    const isIndexExtended = (landmarks[6].y - indexTip.y) > handScale * 0.4;
    const isMiddleClosed = indexTip.y < landmarks[12].y; // Majeur baissé

    // 3. GESTION DU SWIPE DYNAMIQUE (Suivante / Précédente)
    // On ne traque le mouvement de swipe que si l'index est tendu seul
    if (isIndexExtended && isMiddleClosed) {
      const currentPoint = { x: indexTip.x, y: indexTip.y, time: now };
      const buffer = motionBufferRef.current;

      buffer.push(currentPoint);
      if (buffer.length > 8) buffer.shift(); // Garder les 8 dernières frames

      if (buffer.length >= 4) {
        const firstPoint = buffer[0];
        const deltaX = currentPoint.x - firstPoint.x;
        const deltaTime = currentPoint.time - firstPoint.time;

        // Calcul de la vitesse de balayage normalisée par la taille de la main
        const velocityX = (deltaX / handScale) / (deltaTime / 1000); 

        // SEUILS DE VITESSE (Ajustables : plus la valeur est basse, plus c'est sensible)
        // Image miroir : Un mouvement rapide vers la gauche du capteur = Slide Suivante
        if (velocityX > 3.5) { 
          motionBufferRef.current = [];
          lastTriggerTimeRef.current = now;
          return "next";
        }
        if (velocityX < -3.5) {
          motionBufferRef.current = [];
          lastTriggerTimeRef.current = now;
          return "prev";
        }
      }
    } else {
      // Si la main change de posture, on réinitialise le suivi du mouvement
      motionBufferRef.current = [];
    }

    // 4. GESTES STATIQUES SECONDAIRES (Pause, Zoom, Fin)
    const isExtended = (tip, pip) => (landmarks[pip].y - landmarks[tip].y) > handScale * 0.45;
    const middleUp = isExtended(12, 10);
    const ringUp   = isExtended(16, 14);
    const pinkyUp  = isExtended(20, 18);
    const thumbUp  = Math.hypot(landmarks[4].x - landmarks[17].x, landmarks[4].y - landmarks[17].y) > handScale * 0.9;

    // Paume ouverte (Pause)
    if (isIndexExtended && middleUp && ringUp && pinkyUp && thumbUp) return "pause";

    // Mode Zoom Avant (V de la victoire immobile)
    if (isIndexExtended && middleUp && !ringUp && !pinkyUp) {
      if (Math.hypot(indexTip.x - landmarks[12].x, indexTip.y - landmarks[12].y) > handScale * 0.4) {
        return "zoom_in";
      }
    }

    // Mode Zoom Arrière (Pincement Pouce / Index)
    if (Math.hypot(landmarks[4].x - indexTip.x, landmarks[4].y - indexTip.y) < handScale * 0.25) {
      return "zoom_out";
    }

    // Fermeture (Pouce levé maintenu 1.5s)
    if (thumbUp && !isIndexExtended && !middleUp && !ringUp && !pinkyUp) {
      if (!thumbHoldRef.current) thumbHoldRef.current = now;
      else if (now - thumbHoldRef.current > 1500) {
        thumbHoldRef.current = null;
        lastTriggerTimeRef.current = now;
        return "end";
      }
    } else {
      thumbHoldRef.current = null;
    }

    return null;
  }, [debounceMs]);

  // ── INITIALISATION DU FLUX MEDIAPIPE ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      cameraRef.current?.stop();
      cameraRef.current = null;
      handsRef.current?.close();
      handsRef.current = null;
      setStatus("idle");
      setLastGesture(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");

    const init = async () => {
      try {
        await injectScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await injectScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await injectScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

        if (cancelled) return;

        const { Hands, Camera, drawConnectors, drawLandmarks, HAND_CONNECTIONS } = window;

        const hands = new Hands({
          locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity,
          minDetectionConfidence: minDetection,
          minTrackingConfidence: minTracking,
        });

        hands.onResults((results) => {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (!canvas || !video || cancelled) return;

          const ctx = canvas.getContext("2d");
          if (canvas.width !== video.clientWidth) {
            canvas.width = video.clientWidth;
            canvas.height = video.clientHeight;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (!results.multiHandLandmarks?.length) return;

          const landmarks = results.multiHandLandmarks[0];

          // Dessin du squelette premium (Or et Émeraude)
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: "rgba(52, 211, 153, 0.4)", lineWidth: 2 });
          drawLandmarks(ctx, landmarks, { color: "#d4af37", lineWidth: 1, radius: 2 });

          // Analyse et envoi immédiat du geste validé
          const detected = processTracking(landmarks);
          if (detected) {
            setLastGesture(detected);
            onGestureRef.current(detected);
          }
        });

        handsRef.current = hands;

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });

        await camera.start();
        cameraRef.current = camera;
        if (!cancelled) setStatus("ready");

      } catch (err) {
        if (!cancelled) setStatus("error");
      }
    };

    init();

    return () => {
      cancelled = true;
      cameraRef.current?.stop();
      handsRef.current?.close();
    };
  }, [enabled, modelComplexity, minDetection, minTracking, injectScript, processTracking]);

  return { videoRef, canvasRef, status, lastGesture };
}

export const GESTURE_LABELS = {
  next:     { label: "Slide Suivante", icon: "👉" },
  prev:     { label: "Slide Précédente", icon: "👈" },
  pause:    { label: "Système en Pause", icon: "✋" },
  zoom_in:  { label: "Zoom (+)", icon: "✌️" },
  zoom_out: { label: "Dézoom (-)", icon: "🤏" },
  end:      { label: "Quitter", icon: "👍" },
};