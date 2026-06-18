import { useState, useEffect, useRef } from "react";

// Place ce composant dans src/components/Camera.jsx
// Dans Dashboard.jsx : {activeNav === "camera" && <Camera />}

const RESOLUTIONS = [
  { label: "480p (SD)",  width: 640,  height: 480  },
  { label: "720p (HD)",  width: 1280, height: 720  },
  { label: "1080p (FHD)", width: 1920, height: 1080 },
];

function Camera() {
  const videoRef                      = useRef(null);
  const streamRef                     = useRef(null);

  const [devices, setDevices]         = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [resolution, setResolution]   = useState(1); // index in RESOLUTIONS
  const [brightness, setBrightness]   = useState(100);
  const [contrast, setContrast]       = useState(100);
  const [mirrored, setMirrored]       = useState(true);
  const [detectionZone, setDetectionZone] = useState(true);

  const [cameraOn, setCameraOn]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");

  // ── Charger les périphériques disponibles ──
  const loadDevices = async () => {
    try {
      // On demande d'abord l'accès pour avoir les labels
      await navigator.mediaDevices.getUserMedia({ video: true });
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      if (cams.length > 0 && !selectedDevice) setSelectedDevice(cams[0].deviceId);
    } catch (err) {
      if (err.name === "NotAllowedError") setPermissionDenied(true);
    }
  };

  useEffect(() => {
    loadDevices();
    return () => stopCamera();
  }, []);

  // ── Démarrer la caméra ──
  const startCamera = async () => {
    setLoading(true);
    setErrorMsg("");
    stopCamera();

    const res = RESOLUTIONS[resolution];
    const constraints = {
      video: {
        deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
        width:  { ideal: res.width },
        height: { ideal: res.height },
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      showSuccess("Caméra démarrée avec succès !");
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setPermissionDenied(true);
        setErrorMsg("Accès à la caméra refusé. Autorisez l'accès dans les paramètres du navigateur.");
      } else {
        setErrorMsg("Impossible d'accéder à la caméra : " + err.message);
      }
    }
    setLoading(false);
  };

  // ── Arrêter la caméra ──
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  // ── Appliquer les changements à la volée ──
  const applySettings = async () => {
    if (!cameraOn) return;
    await startCamera();
    showSuccess("Paramètres appliqués !");
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const activeRes = RESOLUTIONS[resolution];

  return (
    <>
      <style>{`
        .cam-page { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* HEADER */
        .cam-header { margin-bottom: 1.5rem; }
        .cam-header h1 { font-size: 20px; font-weight: 700; color: #0b1f45; margin-bottom: 4px; }
        .cam-header p  { font-size: 13px; color: #9ca3af; }

        /* ALERTS */
        .alert-ok  { display:flex;align-items:center;gap:9px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:11px 14px;font-size:13px;color:#166534;font-weight:500;margin-bottom:1.25rem; }
        .alert-err { display:flex;align-items:center;gap:9px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:11px 14px;font-size:13px;color:#991b1b;font-weight:500;margin-bottom:1.25rem; }
        .alert-warn{ display:flex;align-items:center;gap:9px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:11px 14px;font-size:13px;color:#92400e;font-weight:500;margin-bottom:1.25rem; }

        /* LAYOUT */
        .cam-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.25rem; align-items: start; }

        /* PREVIEW */
        .preview-card { background: #fff; border: 1px solid #e8ecf4; border-radius: 16px; overflow: hidden; }
        .preview-header { padding: .9rem 1.25rem; border-bottom: 1px solid #f0f2f8; display: flex; align-items: center; justify-content: space-between; }
        .preview-title { font-size: 14px; font-weight: 700; color: #0b1f45; display: flex; align-items: center; gap: 8px; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: blink 1.2s infinite; }
        .live-dot.on { background: #10b981; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:.3} }
        .live-label { font-size: 11px; font-weight: 600; color: #6b7280; display: flex; align-items: center; gap: 5px; }
        .live-label.on { color: #10b981; }

        .video-wrap {
          position: relative;
          background: #0b1f45;
          aspect-ratio: 16/9;
          overflow: hidden;
        }
        video {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }
        .video-placeholder {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; color: rgba(255,255,255,0.4);
        }
        .video-placeholder span { font-size: 48px; }
        .video-placeholder p { font-size: 13px; }

        /* Detection zone overlay */
        .detection-overlay {
          position: absolute; inset: 0;
          pointer-events: none;
        }
        .detection-box {
          position: absolute;
          top: 15%; left: 20%; right: 20%; bottom: 10%;
          border: 2px solid rgba(74,222,128,0.7);
          border-radius: 8px;
        }
        .detection-box::before {
          content: 'Zone de détection';
          position: absolute;
          top: -22px; left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: rgba(74,222,128,0.9);
          white-space: nowrap;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .corner { position: absolute; width: 12px; height: 12px; border-color: #4ade80; border-style: solid; }
        .corner.tl { top:-2px; left:-2px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
        .corner.tr { top:-2px; right:-2px; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
        .corner.bl { bottom:-2px; left:-2px; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
        .corner.br { bottom:-2px; right:-2px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }

        /* Resolution badge */
        .res-badge { position: absolute; bottom: 10px; right: 10px; background: rgba(11,31,69,0.7); color: #fff; font-size: 10.5px; font-weight: 600; padding: 3px 9px; border-radius: 6px; backdrop-filter: blur(4px); font-family: 'Plus Jakarta Sans', sans-serif; }

        .preview-footer { padding: 1rem 1.25rem; display: flex; gap: 8px; }
        .btn-cam-start { flex: 1; background: #0b1f45; color: #fff; border: none; border-radius: 9px; padding: 10px; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: background .15s; }
        .btn-cam-start:hover { background: #1a3a6e; }
        .btn-cam-start:disabled { opacity: .6; cursor: not-allowed; }
        .btn-cam-stop { flex: 1; background: transparent; color: #ef4444; border: 1.5px solid #fecaca; border-radius: 9px; padding: 10px; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; transition: background .15s; }
        .btn-cam-stop:hover { background: #fef2f2; }

        /* SETTINGS PANEL */
        .settings-panel { display: flex; flex-direction: column; gap: 1rem; }
        .settings-card { background: #fff; border: 1px solid #e8ecf4; border-radius: 14px; overflow: hidden; }
        .settings-card-head { padding: .85rem 1.1rem; border-bottom: 1px solid #f0f2f8; display: flex; align-items: center; gap: 8px; }
        .settings-card-head h3 { font-size: 13px; font-weight: 700; color: #0b1f45; margin: 0; }
        .sec-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .settings-card-body { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 1rem; }

        /* FORM ELEMENTS */
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field-label { font-size: 10.5px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: .06em; }
        .field-select { border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 8px 11px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: #111827; background: #f9fafb; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; transition: border-color .2s; }
        .field-select:focus { border-color: #1a5faa; background-color: #fff; }

        /* SLIDER */
        .slider-row { display: flex; align-items: center; gap: 10px; }
        .field-slider { flex: 1; accent-color: #1a5faa; height: 4px; cursor: pointer; }
        .slider-val { font-size: 12px; font-weight: 600; color: #0b1f45; min-width: 36px; text-align: right; }

        /* RES BUTTONS */
        .res-btns { display: flex; gap: 6px; }
        .res-btn { flex: 1; padding: 7px 4px; border-radius: 8px; border: 1.5px solid #e5e7eb; background: #f9fafb; font-size: 11.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; color: #6b7280; cursor: pointer; transition: all .15s; text-align: center; }
        .res-btn:hover { border-color: #1a5faa; color: #1a5faa; }
        .res-btn.active { background: #0b1f45; color: #fff; border-color: #0b1f45; }

        /* TOGGLE */
        .toggle-row { display: flex; align-items: center; justify-content: space-between; }
        .toggle-label { font-size: 13px; color: #374151; font-weight: 500; }
        .toggle-sub   { font-size: 11px; color: #9ca3af; }
        .switch { position: relative; width: 38px; height: 21px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .sw-sl { position: absolute; cursor: pointer; inset: 0; background: #d1d5db; border-radius: 21px; transition: background .2s; }
        .sw-sl::before { content: ''; position: absolute; width: 15px; height: 15px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
        .switch input:checked + .sw-sl { background: #1a5faa; }
        .switch input:checked + .sw-sl::before { transform: translateX(17px); }

        /* APPLY BTN */
        .btn-apply { width: 100%; background: linear-gradient(135deg, #0b1f45, #1a5faa); color: #fff; border: none; border-radius: 9px; padding: 10px; font-size: 13px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; transition: opacity .2s; display: flex; align-items: center; justify-content: center; gap: 7px; }
        .btn-apply:hover { opacity: .88; }
        .btn-apply:disabled { opacity: .5; cursor: not-allowed; }

        /* INFO CARD */
        .info-card { background: #fff; border: 1px solid #e8ecf4; border-radius: 14px; padding: 1rem 1.1rem; }
        .info-card h3 { font-size: 13px; font-weight: 700; color: #0b1f45; margin-bottom: .75rem; }
        .info-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f4f6fb; font-size: 12.5px; }
        .info-row:last-child { border-bottom: none; }
        .info-key { color: #9ca3af; }
        .info-val { font-weight: 600; color: #0b1f45; }

        /* PERMISSION DENIED */
        .perm-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.25rem; }
        .perm-banner h3 { font-size: 15px; font-weight: 700; color: #991b1b; margin-bottom: 6px; }
        .perm-banner p { font-size: 12.5px; color: #6b7280; line-height: 1.6; }
        .btn-retry { margin-top: 12px; background: #0b1f45; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-size: 13px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; }

        @media (max-width: 900px) {
          .cam-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cam-page">

        {/* Header */}
        <div className="cam-header">
          <h1>📷 Configuration caméra</h1>
          <p>Configurez et testez votre caméra avant de démarrer une session de contrôle gestuel.</p>
        </div>

        {/* Alerts */}
        {successMsg      && <div className="alert-ok">✅ {successMsg}</div>}
        {errorMsg        && <div className="alert-err">⚠️ {errorMsg}</div>}
        {permissionDenied && (
          <div className="perm-banner">
            <h3>🚫 Accès à la caméra refusé</h3>
            <p>Autorisez l'accès à la caméra dans les paramètres de votre navigateur,<br />puis cliquez sur "Réessayer".</p>
            <button className="btn-retry" onClick={() => { setPermissionDenied(false); setErrorMsg(""); loadDevices(); }}>
              🔄 Réessayer
            </button>
          </div>
        )}

        <div className="cam-layout">

          {/* ── LEFT : Prévisualisation ── */}
          <div>
            <div className="preview-card">
              <div className="preview-header">
                <p className="preview-title">
                  Prévisualisation
                </p>
                <div className={`live-label ${cameraOn ? "on" : ""}`}>
                  <span className={`live-dot ${cameraOn ? "on" : ""}`} />
                  {cameraOn ? "EN DIRECT" : "INACTIF"}
                </div>
              </div>

              <div className="video-wrap">
                <video
                  ref={videoRef}
                  style={{
                    transform: mirrored ? "scaleX(-1)" : "none",
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    display: cameraOn ? "block" : "none",
                  }}
                  muted
                  playsInline
                />
                {!cameraOn && (
                  <div className="video-placeholder">
                    <span>📷</span>
                    <p>Démarrez la caméra pour voir la prévisualisation</p>
                  </div>
                )}
                {cameraOn && detectionZone && (
                  <div className="detection-overlay">
                    <div className="detection-box">
                      <span className="corner tl" />
                      <span className="corner tr" />
                      <span className="corner bl" />
                      <span className="corner br" />
                    </div>
                  </div>
                )}
                {cameraOn && (
                  <span className="res-badge">{activeRes.width}×{activeRes.height}</span>
                )}
              </div>

              <div className="preview-footer">
                {!cameraOn ? (
                  <button className="btn-cam-start" onClick={startCamera} disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm" /> Connexion...</>
                      : "▶ Démarrer la caméra"}
                  </button>
                ) : (
                  <>
                    <button className="btn-cam-start" onClick={applySettings}>🔄 Appliquer</button>
                    <button className="btn-cam-stop" onClick={stopCamera}>⏹ Arrêter</button>
                  </>
                )}
              </div>
            </div>

            {/* Info caméra active */}
            {cameraOn && (
              <div className="info-card" style={{ marginTop: "1rem" }}>
                <h3>📊 Informations caméra</h3>
                <div className="info-row"><span className="info-key">Périphérique</span><span className="info-val">{devices.find(d => d.deviceId === selectedDevice)?.label || "Caméra par défaut"}</span></div>
                <div className="info-row"><span className="info-key">Résolution</span><span className="info-val">{activeRes.width} × {activeRes.height}</span></div>
                <div className="info-row"><span className="info-key">Luminosité</span><span className="info-val">{brightness}%</span></div>
                <div className="info-row"><span className="info-key">Contraste</span><span className="info-val">{contrast}%</span></div>
                <div className="info-row"><span className="info-key">Miroir</span><span className="info-val">{mirrored ? "Activé" : "Désactivé"}</span></div>
                <div className="info-row"><span className="info-key">Zone de détection</span><span className="info-val">{detectionZone ? "Affichée" : "Masquée"}</span></div>
              </div>
            )}
          </div>

          {/* ── RIGHT : Paramètres ── */}
          <div className="settings-panel">

            {/* Périphérique */}
            <div className="settings-card">
              <div className="settings-card-head">
                <div className="sec-icon" style={{ background: "#eff6ff" }}>📷</div>
                <h3>Périphérique</h3>
              </div>
              <div className="settings-card-body">
                <div className="field">
                  <label className="field-label">Caméra sélectionnée</label>
                  <select
                    className="field-select"
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                  >
                    {devices.length === 0 && <option value="">Aucune caméra détectée</option>}
                    {devices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Caméra ${d.deviceId.slice(0, 6)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Résolution */}
            <div className="settings-card">
              <div className="settings-card-head">
                <div className="sec-icon" style={{ background: "#e1f5ee" }}>🖥️</div>
                <h3>Résolution</h3>
              </div>
              <div className="settings-card-body">
                <div className="field">
                  <label className="field-label">Qualité vidéo</label>
                  <div className="res-btns">
                    {RESOLUTIONS.map((r, i) => (
                      <button
                        key={i}
                        className={`res-btn ${resolution === i ? "active" : ""}`}
                        onClick={() => setResolution(i)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="settings-card">
              <div className="settings-card-head">
                <div className="sec-icon" style={{ background: "#faeeda" }}>🎨</div>
                <h3>Réglages image</h3>
              </div>
              <div className="settings-card-body">
                <div className="field">
                  <label className="field-label">Luminosité — {brightness}%</label>
                  <div className="slider-row">
                    <span style={{ fontSize: 14 }}>🔅</span>
                    <input
                      type="range" min={50} max={150} step={5}
                      value={brightness}
                      className="field-slider"
                      onChange={(e) => setBrightness(Number(e.target.value))}
                    />
                    <span style={{ fontSize: 14 }}>🔆</span>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Contraste — {contrast}%</label>
                  <div className="slider-row">
                    <span style={{ fontSize: 14 }}>◑</span>
                    <input
                      type="range" min={50} max={150} step={5}
                      value={contrast}
                      className="field-slider"
                      onChange={(e) => setContrast(Number(e.target.value))}
                    />
                    <span style={{ fontSize: 14 }}>⬤</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="settings-card">
              <div className="settings-card-head">
                <div className="sec-icon" style={{ background: "#f3f4f6" }}>⚙️</div>
                <h3>Options</h3>
              </div>
              <div className="settings-card-body">
                <div className="toggle-row">
                  <div>
                    <p className="toggle-label">Miroir horizontal</p>
                    <p className="toggle-sub">Retourne l'image comme un miroir</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={mirrored} onChange={(e) => setMirrored(e.target.checked)} />
                    <span className="sw-sl" />
                  </label>
                </div>
                <div className="toggle-row">
                  <div>
                    <p className="toggle-label">Zone de détection</p>
                    <p className="toggle-sub">Affiche le cadre vert MediaPipe</p>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={detectionZone} onChange={(e) => setDetectionZone(e.target.checked)} />
                    <span className="sw-sl" />
                  </label>
                </div>
              </div>
            </div>

            {/* Appliquer */}
            <button
              className="btn-apply"
              onClick={cameraOn ? applySettings : startCamera}
              disabled={loading}
            >
              {cameraOn ? "🔄 Appliquer les paramètres" : "▶ Démarrer avec ces paramètres"}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}

export default Camera;