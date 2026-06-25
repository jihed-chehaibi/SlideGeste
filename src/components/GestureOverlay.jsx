import { useRef } from "react";
import { useHandGestures } from "../hooks/useHandGestures";
import { useGestureSettings } from "../hooks/gestureSettings";

/* Vignette caméra compacte pendant la présentation.
   Lit les réglages persistés (définis dans l'onglet Caméra)
   et déclenche onGesture(label) avec lissage + stabilisation. */

export default function GestureOverlay({ onGesture }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const { settings } = useGestureSettings();

  const { ready, status, error, live } = useHandGestures({
    videoRef, canvasRef, settings, onGesture, autoStart: true, draw: true,
  });

  return (
    <>
      <style>{`
        .gov { position: fixed; bottom: 18px; left: 18px; z-index: 60; width: 210px; border-radius: 14px; overflow: hidden; background: #0a0f1e; border: 1px solid #1e293b; box-shadow: 0 12px 32px -8px rgba(0,0,0,0.6); font-family:'Inter', sans-serif; }
        .gov-stage { position: relative; width: 100%; aspect-ratio: 4/3; background:#0a0f1e; }
        .gov-stage video, .gov-stage canvas { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transform: scaleX(-1); }
        .gov-stage canvas { z-index: 2; }
        .gov-loading { position:absolute; inset:0; z-index:3; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:11px; background:#0a0f1e; text-align:center; padding:8px; }
        .gov-bar { display:flex; align-items:center; gap:8px; padding:8px 10px; border-top:1px solid #1e293b; background:#0f172a; }
        .gov-rec { width:8px; height:8px; border-radius:50%; background:#ef4444; animation:govpulse 1.4s infinite; flex-shrink:0; }
        @keyframes govpulse { 0%{opacity:1} 50%{opacity:0.3} 100%{opacity:1} }
        .gov-label { font-size:11px; font-weight:600; color:#e2e8f0; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .gov-conf  { font-size:11px; font-weight:700; color:#60a5fa; flex-shrink:0; }
      `}</style>

      <div className="gov">
        <div className="gov-stage">
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} />
          {status !== "active" && (
            <div className="gov-loading">{status === "error" ? "Caméra indisponible" : "Démarrage caméra…"}</div>
          )}
        </div>
        <div className="gov-bar">
          <span className="gov-rec" />
          <span className="gov-label">{!ready ? "Chargement…" : live ? live.gesture : "Main non détectée"}</span>
          {live && <span className="gov-conf">{Math.round(live.confidence * 100)}%</span>}
        </div>
      </div>
    </>
  );
}