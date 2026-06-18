// ─────────────────────────────────────────────────────────────────────────────
// GestureOverlay.jsx - Version Premium Optimisée
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { GESTURE_LABELS } from "./Usegesturecontrol";

const GESTURE_GUIDE = [
  { icon: "👉", label: "Slide suivante",   desc: "Main pointant vers la droite" },
  { icon: "👈", label: "Slide précédente", desc: "Main pointant vers la gauche" },
  { icon: "✋", label: "Pause / Fixer",    desc: "Paume ouverte face caméra" },
  { icon: "✌️",  label: "Zoom avant",      desc: "V écarté (index + majeur)" },
  { icon: "🤏", label: "Zoom arrière",     desc: "Pincement pouce + index" },
  { icon: "👍", label: "Fermer le viewer",  desc: "Pouce levé maintenu 1.5s" },
];

function StatusBadge({ status }) {
  const map = {
    idle:    { label: "Inactif",    color: "rgba(255,255,255,.4)", dot: "#94a3b8" },
    loading: { label: "Initialisation…", color: "#fbbf24",          dot: "#fbbf24" },
    ready:   { label: "Système Actif",  color: "#34d399",          dot: "#34d399" },
    error:   { label: "Erreur Caméra",  color: "#f87171",          dot: "#ef4444" },
  };
  const s = map[status] || map.idle;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ 
        width: 8, 
        height: 8, 
        borderRadius: "50%", 
        background: s.dot, 
        display: "inline-block", 
        boxShadow: status === "ready" ? "0 0 8px #34d399" : "none",
        animation: status === "ready" || status === "loading" ? "gpulse 1.8s infinite ease-in-out" : "none" 
      }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: s.color, letterSpacing: "0.02em" }}>
        {s.label}
      </span>
    </div>
  );
}

export default function GestureOverlay({
  videoRef,
  canvasRef,
  status,
  lastGesture,
  enabled,
  onToggle,
  className = "",
}) {
  const [showGuide, setShowGuide] = useState(false);
  const [flashMsg, setFlashMsg] = useState(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (!lastGesture) return;
    const info = GESTURE_LABELS[lastGesture];
    if (!info) return;
    
    setFlashMsg(info);
    const t = setTimeout(() => setFlashMsg(null), 1400);
    return () => clearTimeout(t);
  }, [lastGesture]);

  return (
    <>
      <style>{`
        @keyframes gpulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.1); } }
        @keyframes gfadeInUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes gflash { 
          0% { opacity: 0; transform: scale(0.9) translateY(10px); filter: blur(4px); } 
          15% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } 
          85% { opacity: 1; transform: scale(1) translateY(0); } 
          100% { opacity: 0; transform: scale(0.95) translateY(-6px); } 
        }
/* Animation de succès lors d'un geste */
@keyframes successFlash {
  0% { border-color: rgba(77, 163, 255, 0.5); box-shadow: 0 0 0px transparent; }
  20% { border-color: #34d399; box-shadow: 0 0 20px rgba(52, 211, 153, 0.4); }
  100% { border-color: rgba(77, 163, 255, 0.5); box-shadow: 0 0 0px transparent; }
}

.go-cam.gesture-detected {
  animation: successFlash 0.5s ease-out;
}
        .go-wrap {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          z-index: 50;
          pointer-events: none;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        .go-flash {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.9);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 30px;
          border: 1px solid rgba(212, 175, 55, 0.4);
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 175, 55, 0.1);
          animation: gflash 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          white-space: nowrap;
        }
        .go-flash .go-icon { font-size: 20px; }

        .go-cam {
          position: relative;
          width: 220px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          background: #0f172a;
          pointer-events: all;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          animation: gfadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .go-cam.minimized { width: 64px; height: 38px; }

        .go-cam video { width: 100%; height: auto; display: block; transform: scaleX(-1); aspect-ratio: 4/3; object-fit: cover; }
        .go-cam canvas { position: absolute; inset: 0; width: 100%; height: 100%; transform: scaleX(-1); }

        .go-cam-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .go-cam-header.minimized { border-bottom: none; height: 100%; padding: 0 8px; justify-content: center; }
        
        .go-min-btn {
          width: 22px; height: 22px; border-radius: 6px; border: none;
          background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6);
          cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .go-min-btn:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }

        .go-controls-group { display: flex; gap: 8px; pointer-events: all; }

        .go-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(30, 41, 59, 0.8);
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .go-toggle-btn:hover { background: rgba(30, 41, 59, 0.95); border-color: rgba(255, 255, 255, 0.2); color: #fff; }
        .go-toggle-btn.on { 
          background: rgba(52, 211, 153, 0.12); 
          border-color: rgba(52, 211, 153, 0.35); 
          color: #34d399;
          box-shadow: 0 4px 16px rgba(52, 211, 153, 0.15);
        }

        .go-guide {
          pointer-events: all;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
          width: 260px;
          backdrop-filter: blur(16px);
          animation: gfadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
        }
        .go-guide-title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: .08em;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 6px;
        }
        .go-guide-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
        .go-guide-icon { font-size: 18px; width: 28px; height: 28px; background: rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; border-radius:8px; }
        .go-guide-label { font-size: 12.5px; font-weight: 600; color: #f8fafc; margin: 0; }
        .go-guide-desc  { font-size: 11px; color: rgba(148, 163, 184, 0.7); margin: 2px 0 0 0; }

        .go-loading {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px);
        }
        .go-loading p { font-size: 12px; color: rgba(255, 255, 255, 0.6); margin: 0; }
        
        .go-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: rgba(212, 175, 55, 0.8);
          border-radius: 50%;
          animation: gspin 0.8s linear infinite;
        }
        @keyframes gspin { to { transform: rotate(360deg); } }
      `}</style>

      <div className={`go-wrap ${className}`}>
        
        {/* Flash Notification Geste */}
        {flashMsg && (
          <div className="go-flash" key={lastGesture + Date.now()}>
            <span className="go-icon">{flashMsg.icon}</span>
            <span>{flashMsg.label}</span>
          </div>
        )}

        {/* Aide mémoire contextuelle */}
        {showGuide && (
          <div className="go-guide">
            <div className="go-guide-title">Contrôle Gestuel</div>
            {GESTURE_GUIDE.map((g) => (
              <div className="go-guide-row" key={g.label}>
                <div className="go-guide-icon">{g.icon}</div>
                <div>
                  <p className="go-guide-label">{g.label}</p>
                  <p className="go-guide-desc">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fenêtre Caméra */}
        {enabled && (
          <div className={`go-cam ${minimized ? "minimized" : ""} ${flashMsg ? "gesture-detected" : ""}`} >
            <div className={`go-cam-header ${minimized ? "minimized" : ""}`}>
              {!minimized && <StatusBadge status={status} />}
              <button 
                className="go-min-btn" 
                onClick={() => setMinimized(v => !v)} 
                title={minimized ? "Agrandir le flux" : "Réduire le flux"}
              >
                {minimized ? "⤢" : "−"}
              </button>
            </div>
            
            {!minimized && (
              <div style={{ position: "relative", width: "100%", aspectRatio: "4/3" }}>
                <video ref={videoRef} autoPlay playsInline muted />
                <canvas ref={canvasRef} />
                
                {status === "loading" && (
                  <div className="go-loading">
                    <div className="go-spinner" />
                    <p>Calcul des repères...</p>
                  </div>
                )}
                {status === "error" && (
                  <div className="go-loading" style={{ backgroundColor: "rgba(30, 27, 27, 0.95)" }}>
                    <span style={{ fontSize: 22 }}>⚠️</span>
                    <p style={{ color: "#ef4444", fontWeight: 600 }}>Flux vidéo bloqué</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Boutons d'activation */}
        <div className="go-controls-group">
          <button
            className={`go-toggle-btn ${enabled ? "on" : ""}`}
            onClick={onToggle}
          >
            <span style={{ fontSize: 15 }}>{enabled ? "✨" : "👋"}</span>
            {enabled ? "Navigation Gestuelle" : "Activer Gestes"}
          </button>
          
          <button
            className="go-toggle-btn"
            onMouseEnter={() => setShowGuide(true)}
            onMouseLeave={() => setShowGuide(false)}
            style={{ padding: "10px 14px" }}
          >
            ?
          </button>
        </div>
      </div>
    </>
  );
}