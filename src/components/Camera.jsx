import { useRef, useState, useCallback } from "react";
import { useHandGestures } from "../hooks/useHandGestures";
import { useGestureSettings } from "../hooks/gestureSettings";
import { LABELS } from "../hooks/useGestureModel";
import GestureSettingsPanel from "./GestureSettingsPanel";

export default function Camera({ onGesture }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [fired, setFired] = useState(null);

  const { settings, update, reset } = useGestureSettings();

  const handleFired = useCallback((gesture, info) => {
    setFired({ gesture, confidence: info.confidence });
    onGesture?.(gesture, info);
  }, [onGesture]);

  const { ready, status, error, live, start, stop } = useHandGestures({
    videoRef, canvasRef, settings, onGesture: handleFired, draw: true,
  });

  const running = status === "active";

  return (
    <>
      <style>{`
        .cam-page { font-family:'Inter', sans-serif; }
        .cam-header { margin-bottom:1.25rem; }
        .cam-header h1 { font-size:20px; font-weight:700; color:#0f172a; letter-spacing:-0.02em; margin-bottom:3px; }
        .cam-header p  { font-size:13px; color:#94a3b8; font-weight:500; }
        .cam-grid { display:grid; grid-template-columns: 1.4fr 1fr; gap:1.25rem; align-items:start; }
        @media (max-width:900px) { .cam-grid { grid-template-columns:1fr; } }
        .cam-stage { position:relative; width:100%; aspect-ratio:4/3; background:#0a0f1e; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0; }
        .cam-stage video, .cam-stage canvas { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transform: scaleX(-1); }
        .cam-stage canvas { z-index:2; }
        .cam-overlay-msg { position:absolute; inset:0; z-index:3; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:#94a3b8; background:rgba(10,15,30,0.85); text-align:center; padding:1.5rem; }
        .cam-spinner { width:30px; height:30px; border:3px solid #1e293b; border-top:3px solid #3b82f6; border-radius:50%; animation:camspin .8s linear infinite; }
        @keyframes camspin { to { transform:rotate(360deg); } }
        .cam-card { background:#fff; border:1px solid #f1f5f9; border-radius:14px; padding:1.25rem; box-shadow:0 2px 4px rgba(0,0,0,0.02); margin-bottom:1rem; }
        .cam-card h3 { font-size:13px; font-weight:700; color:#0f172a; margin-bottom:12px; }
        .btn-cam { width:100%; border:none; border-radius:10px; padding:11px 0; font-size:14px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition: background-color .16s, transform .12s; }
        .btn-cam:active { transform:scale(0.98); }
        .btn-cam:disabled { opacity:0.5; cursor:not-allowed; }
        .btn-start { background:#3b82f6; color:#fff; } .btn-start:hover { background:#2563eb; }
        .btn-stop  { background:#fee2e2; color:#dc2626; } .btn-stop:hover { background:#fecaca; }
        .live-gesture { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
        .live-name { font-size:16px; font-weight:700; color:#0f172a; }
        .live-conf { font-size:13px; font-weight:700; color:#3b82f6; }
        .live-none { font-size:13px; color:#94a3b8; font-weight:500; }
        .score-row { display:flex; align-items:center; gap:10px; margin-bottom:7px; }
        .score-label { font-size:11px; color:#64748b; font-weight:600; width:90px; flex-shrink:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .score-track { flex:1; height:7px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
        .score-fill  { height:100%; border-radius:4px; background:#3b82f6; transition:width .1s linear; }
        .score-val   { font-size:11px; color:#94a3b8; font-weight:600; width:36px; text-align:right; }
        .fired-pill { display:flex; align-items:center; gap:8px; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; border-radius:10px; padding:9px 12px; font-size:13px; font-weight:600; }
        .cam-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; border-radius:10px; padding:10px 12px; font-size:13px; margin-bottom:1rem; }
        .cam-hint { font-size:12px; color:#94a3b8; }
      `}</style>

      <div className="cam-page">
        <div className="cam-header">
          <h1>Caméra & détection</h1>
          <p>Testez la détection et ajustez les réglages — ils s'appliqueront aussi à la présentation.</p>
        </div>

        {error && <div className="cam-error">{error}</div>}

        <div className="cam-grid">
          <div>
            <div className="cam-stage">
              <video ref={videoRef} playsInline muted />
              <canvas ref={canvasRef} />
              {!running && (
                <div className="cam-overlay-msg">
                  {status === "loading" ? (<><div className="cam-spinner" /><p>Démarrage…</p></>)
                  : (<p>Caméra inactive. Cliquez sur « Activer la caméra ».</p>)}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="cam-card">
              <h3>Contrôle</h3>
              {!running ? (
                <button className="btn-cam btn-start" onClick={start} disabled={!ready || status === "loading"}>
                  ● Activer la caméra
                </button>
              ) : (
                <button className="btn-cam btn-stop" onClick={stop}>■ Arrêter la caméra</button>
              )}
              <p className="cam-hint" style={{ marginTop:10 }}>
                {ready ? "Modèle de gestes chargé ✓" : "Chargement du modèle…"}
              </p>
            </div>

            <div className="cam-card">
              <h3>Geste détecté</h3>
              {live ? (
                <>
                  <div className="live-gesture">
                    <span className="live-name">{live.gesture}</span>
                    <span className="live-conf">{Math.round(live.confidence * 100)}%</span>
                  </div>
                  <div style={{ marginTop:14 }}>
                    {live.scores.map((s, i) => (
                      <div className="score-row" key={i}>
                        <span className="score-label">{LABELS[i] ?? `classe ${i}`}</span>
                        <div className="score-track"><div className="score-fill" style={{ width:`${Math.round(s * 100)}%` }} /></div>
                        <span className="score-val">{Math.round(s * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="live-none">Aucune main détectée. Placez votre main dans le cadre.</p>
              )}
            </div>

            {fired && (
              <div className="cam-card">
                <h3>Dernière action déclenchée</h3>
                <div className="fired-pill">✓ {fired.gesture} ({Math.round(fired.confidence * 100)}%)</div>
              </div>
            )}

            <GestureSettingsPanel settings={settings} onChange={update} onReset={reset} />
          </div>
        </div>
      </div>
    </>
  );
}