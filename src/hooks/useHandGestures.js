import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { useGestureModel, LABELS } from "./useGestureModel";

/* Hook partagé : webcam + MediaPipe + modèle + LISSAGE temporel + stabilisation.
   Utilisé par l'onglet Caméra (test) ET par l'overlay de présentation.
   - settings : { confidence, smoothing, stableFrames, cooldownMs }
   - onGesture(label, info) : appelé une fois par geste validé
   Retourne { ready, status, error, live, start, stop }. */

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const HAND_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];

function drawHand(ctx, landmarks, W, H) {
  ctx.strokeStyle = "rgba(59,130,246,0.95)";
  ctx.lineWidth = 2.5;
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * W, landmarks[a].y * H);
    ctx.lineTo(landmarks[b].x * W, landmarks[b].y * H);
    ctx.stroke();
  }
  ctx.fillStyle = "#22c55e";
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(lm.x * W, lm.y * H, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function useHandGestures({ videoRef, canvasRef, settings, onGesture, autoStart = false, draw = true }) {
  const { ready: modelReady, error: modelError, predict } = useGestureModel();

  const landmarkerRef = useRef(null);
  const rafRef        = useRef(null);
  const lastVideoTime = useRef(-1);
  const bufferRef     = useRef([]);                 // ring buffer des scores (lissage)
  const stableRef     = useRef({ index: -1, count: 0 });
  const lastFiredRef  = useRef(0);
  const settingsRef   = useRef(settings);
  settingsRef.current = settings;                   // toujours la dernière valeur

  const [lmReady, setLmReady] = useState(false);
  const [status, setStatus]   = useState("idle");   // idle | loading | active | error
  const [error, setError]     = useState("");
  const [live, setLive]       = useState(null);

  /* Traite une frame : dessin + prédiction + LISSAGE + stabilisation */
  const handleResult = useCallback((result) => {
    const s = settingsRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

    const hands = result?.landmarks || [];
    if (hands.length === 0) {
      bufferRef.current = [];
      stableRef.current = { index: -1, count: 0 };
      setLive(null);
      return;
    }

    const landmarks = hands[0];
    if (ctx && draw) drawHand(ctx, landmarks, canvas.width, canvas.height);

    const p = predict(landmarks);
    if (!p) return;

    /* ── LISSAGE : moyenne des probabilités sur les N dernières frames ── */
    const win = Math.max(1, Math.round(s.smoothing));
    const buf = bufferRef.current;
    buf.push(p.scores);
    while (buf.length > win) buf.shift();

    const n = p.scores.length;
    const avg = new Array(n).fill(0);
    for (const arr of buf) for (let i = 0; i < n; i++) avg[i] += arr[i];
    for (let i = 0; i < n; i++) avg[i] /= buf.length;

    let index = 0;
    for (let i = 1; i < n; i++) if (avg[i] > avg[index]) index = i;
    const confidence = avg[index];
    const gesture = LABELS[index] ?? `classe_${index}`;
    setLive({ gesture, index, confidence, scores: avg });

    /* ── Seuil + stabilité + cooldown → déclenche une seule fois ── */
    if (confidence < s.confidence) {
      stableRef.current = { index: -1, count: 0 };
      return;
    }
    if (index === stableRef.current.index) stableRef.current.count++;
    else stableRef.current = { index, count: 1 };

    if (stableRef.current.count === Math.max(1, Math.round(s.stableFrames))) {
      const now = performance.now();
      if (now - lastFiredRef.current > s.cooldownMs) {
        lastFiredRef.current = now;
        onGesture?.(gesture, { gesture, index, confidence });
      }
    }
  }, [predict, onGesture, draw, canvasRef]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (video && landmarker && video.readyState >= 2) {
      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        handleResult(result);
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [handleResult, videoRef]);

  /* Init MediaPipe une fois */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        const lm = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_PATH, delegate: "GPU" },
          numHands: 1,
          runningMode: "VIDEO",
        });
        if (cancelled) { lm.close?.(); return; }
        landmarkerRef.current = lm;
        setLmReady(true);
      } catch (e) {
        if (!cancelled) { setError("Init MediaPipe : " + e.message); setStatus("error"); }
      }
    })();
    return () => { cancelled = true; landmarkerRef.current?.close?.(); };
  }, []);

  const start = useCallback(async () => {
    setError(""); setStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }, audio: false,
      });
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
      setStatus("active");
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      setError("Accès caméra : " + e.message);
      setStatus("error");
    }
  }, [loop, videoRef, canvasRef]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const video = videoRef.current;
    const stream = video?.srcObject;
    stream?.getTracks?.().forEach((t) => t.stop());
    if (video) video.srcObject = null;
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    bufferRef.current = [];
    stableRef.current = { index: -1, count: 0 };
    setLive(null);
    setStatus("idle");
  }, [videoRef, canvasRef]);

  /* Démarrage auto (pour l'overlay de présentation) + nettoyage */
  useEffect(() => {
    if (autoStart && lmReady) start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, lmReady]);

  return {
    ready: modelReady && lmReady,
    status,
    error: error || modelError,
    live,
    start,
    stop,
  };
}