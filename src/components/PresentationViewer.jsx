import { useState, useEffect, useRef, useCallback, memo } from "react";
import { supabase } from "../lib/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
// Correction mineure : respect de la casse habituelle des imports
import { useGestureControl } from "./Usegesturecontrol"; 
import GestureOverlay from "./Gestureoverlay";

// Setup worker react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const THUMB_WINDOW = 40;

// ── ThumbnailItem ─────────────────────────────────────────────────────────────
const ThumbnailItem = memo(({ pageNum, pdfData, isActive, onClick }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { rootMargin: "120px" }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`thumb-item ${isActive ? "active" : ""}`}
      onClick={onClick}
      style={{ minHeight: 88 }}
    >
      {visible && pdfData ? (
        <Document file={{ data: pdfData }} loading={null} error={null}>
          <Page
            pageNumber={pageNum}
            width={140}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading={<div style={{ height: 88, background: "#1f2937" }} />}
          />
        </Document>
      ) : (
        <div style={{
          height: 88, background: "#1f2937",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,.2)", fontSize: 11,
        }}>
          {pageNum}
        </div>
      )}
      <span className="tnum">{pageNum}</span>
    </div>
  );
});

// ── OfficeOnlineViewer ─────────────────────────────────────────────────────────
function OfficeOnlineViewer({ publicUrl, onReady, onError }) {
  const iframeRef   = useRef(null);
  const [loaded, setLoaded]   = useState(false);
  const [failed, setFailed]   = useState(false);
  const timeoutRef  = useRef(null);

  const officeUrl = publicUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`
    : null;

  useEffect(() => {
    if (!officeUrl) return;
    setLoaded(false);
    setFailed(false);
    timeoutRef.current = setTimeout(() => setFailed(true), 25000);
    return () => clearTimeout(timeoutRef.current);
  }, [officeUrl]);

  const handleLoad = () => {
    clearTimeout(timeoutRef.current);
    setLoaded(true);
    setFailed(false);
    onReady?.();
  };

  if (!officeUrl) return null;

  return (
    <div style={{ position: "relative", width: "100%", flex: 1, minHeight: "calc(100vh - 114px)" }}>
      {!loaded && !failed && (
        <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,background:"#1a1a2e",zIndex:2 }}>
          <div className="spinner-border text-light" role="status" />
          <p style={{ fontSize:13,color:"rgba(255,255,255,.5)" }}>Chargement via Microsoft Office Online…</p>
          <p style={{ fontSize:11,color:"rgba(255,255,255,.25)" }}>Jusqu'à 20 secondes</p>
        </div>
      )}
      {failed && (
        <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:"#1a1a2e",zIndex:2 }}>
          <span style={{ fontSize:36 }}>⚠️</span>
          <p style={{ fontSize:13,color:"#fca5a5",textAlign:"center",maxWidth:380,lineHeight:1.6 }}>
            Office Online n'a pas pu charger le fichier.<br />
            Vérifiez que le bucket Supabase est en mode <strong>public</strong>.
          </p>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <button className="btn-retry">⬇ Télécharger le fichier</button>
          </a>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={officeUrl}
        title="Présentation Office Online"
        width="100%" height="100%"
        style={{ border:"none",width:"100%",height:"100%",minHeight:"calc(100vh - 114px)",opacity:loaded?1:0,transition:"opacity 0.3s" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        allow="fullscreen"
        onLoad={handleLoad}
      />
    </div>
  );
}

// ── PresentationViewer (Principal) ───────────────────────────────────
function PresentationViewer({ pres, onClose }) {
  const viewerDivRef  = useRef(null);

  // PDF States
  const [numPages, setNumPages]           = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const [scale, setScale]                 = useState(1);
  const [pdfData, setPdfData]             = useState(null);
  const [pageRendering, setPageRendering] = useState(false);

  // PPTX States
  const [publicUrl, setPublicUrl]         = useState(null);
  const [pptxReady, setPptxReady]         = useState(false);

  // Common States
  const [fileUrl, setFileUrl]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [errorMsg, setErrorMsg]           = useState("");
  const [retryCount, setRetryCount]       = useState(0);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Diaporama States
  const [slideshowActive, setSlideshowActive] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(5); // secondes

  // Gestes
  const [gestureEnabled, setGestureEnabled] = useState(false);

  const isPDF  = pres.file_type === "pdf";
  const isPPTX = pres.file_type === "pptx";
  const totalPages = isPDF ? (numPages || 0) : 0;

  // ── URL Supabase ──────────────────────────────────────────────────────
  const extractStoragePath = useCallback((url) => {
    const s = url.match(/\/object\/sign\/presentations\/(.+?)(\?|$)/);
    if (s) return decodeURIComponent(s[1]);
    const p = url.match(/\/object\/public\/presentations\/(.+?)(\?|$)/);
    if (p) return decodeURIComponent(p[1]);
    return url.includes("://") ? null : url;
  }, []);

  useEffect(() => {
    const fetchUrl = async () => {
      setLoading(true);
      setErrorMsg("");
      setPptxReady(false);
      try {
        const url = pres.file_url;
        if (url?.includes("token=")) {
          try {
            const token   = url.match(/[?&]token=([^&]+)/)?.[1];
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.exp > Date.now() / 1000 + 60) {
              setFileUrl(url);
              if (isPPTX) resolvePublicUrl(url);
              setLoading(false);
              return;
            }
          } catch {}
        }
        const path = extractStoragePath(url);
        if (!path) throw new Error("Chemin du fichier invalide.");
        const { data, error } = await supabase.storage.from("presentations").createSignedUrl(path, 3600);
        if (error) throw new Error(error.message);
        setFileUrl(data.signedUrl);
        if (isPPTX) resolvePublicUrl(path, true);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    const resolvePublicUrl = (pathOrUrl, isPath = false) => {
      const path = isPath ? pathOrUrl : extractStoragePath(pathOrUrl);
      if (!path) return;
      const { data } = supabase.storage.from("presentations").getPublicUrl(path);
      setPublicUrl(data?.publicUrl || pathOrUrl);
    };

    fetchUrl();
  }, [pres.file_url, retryCount, extractStoragePath, isPPTX]);

  // ── Pré-charger PDF en mémoire ────────────────────────────────────────
  useEffect(() => {
    if (!fileUrl || !isPDF) return;
    let cancelled = false;
    fetch(fileUrl)
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then(buf => { if (!cancelled) setPdfData(new Uint8Array(buf)); })
      .catch(() => { if (!cancelled) setPdfData(null); });
    return () => { cancelled = true; };
  }, [fileUrl, isPDF]);

  // ── Navigation ────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (totalPages === 0) return;
    setPageRendering(true);
    setCurrentPage(p => {
      if (p >= totalPages) {
        setSlideshowActive(false);
        return p;
      }
      return p + 1;
    });
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setPageRendering(true);
    setCurrentPage(p => Math.max(p - 1, 1));
  }, []);

  // ── DIAPORAMA ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slideshowActive || !isPDF || totalPages <= 0) return;

    const timer = setTimeout(() => {
      if (currentPage >= totalPages) {
        setSlideshowActive(false);
      } else {
        setPageRendering(true);
        setCurrentPage(prev => prev + 1);
      }
    }, slideshowInterval * 1000);

    return () => clearTimeout(timer);
  }, [slideshowActive, currentPage, totalPages, slideshowInterval, isPDF]);

  const toggleSlideshow = useCallback(() => {
    setSlideshowActive(v => {
      if (!v && currentPage >= totalPages) {
        setCurrentPage(1);
      }
      return !v;
    });
  }, [currentPage, totalPages]);

  // ── GESTIONNAIRE DE GESTES EN PRODUCTION CONTROLES ────────────────────
  const handleGesture = useCallback((gesture) => {
    // Désactiver temporairement le diaporama si un geste manuel intervient
    if (gesture === "next" || gesture === "prev") {
      setSlideshowActive(false);
    }

    switch (gesture) {
      case "next":
        // Utilisation de la forme fonctionnelle pour garantir la dernière valeur de currentPage
        setCurrentPage((prev) => {
          if (totalPages && prev >= totalPages) return prev;
          setPageRendering(true);
          return prev + 1;
        });
        break;
      case "prev":
        setCurrentPage((prev) => {
          if (prev <= 1) return prev;
          setPageRendering(true);
          return prev - 1;
        });
        break;
      case "zoom_in":
        setScale(s => Math.min(+(s + 0.15).toFixed(2), 3));
        break;
      case "zoom_out":
        setScale(s => Math.max(+(s - 0.15).toFixed(2), 0.4));
        break;
      case "pause":
        setSlideshowActive(v => !v);
        break;
      case "end":
        onClose();
        break;
      default:
        break;
    }
  }, [totalPages, onClose]); // Nettoyage des dépendances pour éviter les lags de closure

  // Couplage matériel direct au Hook de contrôle gestuel
  const { videoRef, canvasRef, status: gestureStatus, lastGesture } = useGestureControl({
    enabled:     gestureEnabled,
    onGesture:  handleGesture,
    debounceMs: 850, // Légèrement augmenté pour filtrer les oscillations physiques de l'index
  });

  // ── Clavier ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { goNext(); setSlideshowActive(false); }
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { goPrev(); setSlideshowActive(false); }
      if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
        else onClose();
      }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "+" || e.key === "=") setScale(s => Math.min(+(s+0.1).toFixed(1), 3));
      if (e.key === "-") setScale(s => Math.max(+(s-0.1).toFixed(1), 0.4));
      if (e.key === "0") setScale(1);
      if (e.key === " ") { e.preventDefault(); toggleSlideshow(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose, toggleSlideshow]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Fullscreen ────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) viewerDivRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  }, []);

  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  // ── Thumbnails Calculation ────────────────────────────────────────────
  const thumbStart = Math.max(1, currentPage - Math.floor(THUMB_WINDOW / 2));
  const thumbEnd   = Math.min(totalPages || 1, thumbStart + THUMB_WINDOW - 1);
  const thumbPages = totalPages
    ? Array.from({ length: thumbEnd - thumbStart + 1 }, (_, i) => thumbStart + i)
    : [];
  const pdfSource  = pdfData ? { data: pdfData } : fileUrl;

  return (
    <>
      <style>{`
        .viewer-overlay { position:fixed;inset:0;z-index:9999;background:#0d0d1a;display:flex;flex-direction:column;font-family:'Plus Jakarta Sans',sans-serif; }
        .viewer-topbar { height:52px;background:#0b1f45;display:flex;align-items:center;justify-content:space-between;padding:0 1rem;flex-shrink:0;gap:10px;border-bottom:1px solid rgba(255,255,255,.08);z-index:1; }
        .vt-left  { display:flex;align-items:center;gap:10px;flex:1;min-width:0; }
        .vt-right { display:flex;align-items:center;gap:5px;flex-shrink:0; }
        .vclose { width:30px;height:30px;border-radius:7px;border:1px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.8);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background .15s; }
        .vclose:hover { background:rgba(255,255,255,.15); }
        .vtitle { font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .vbadge-pdf  { font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;background:rgba(251,191,36,.18);color:#fbbf24;flex-shrink:0;text-transform:uppercase; }
        .vbadge-pptx { font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;background:rgba(244,114,182,.18);color:#f472b6;flex-shrink:0;text-transform:uppercase; }
        .zoom-group { display:flex;align-items:center;gap:2px;background:rgba(255,255,255,.07);border-radius:7px;padding:2px 6px; }
        .zbtn { width:22px;height:22px;border-radius:4px;border:none;background:transparent;color:rgba(255,255,255,.7);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center; }
        .zbtn:hover { background:rgba(255,255,255,.1); }
        .zval { font-size:11px;color:rgba(255,255,255,.75);min-width:34px;text-align:center;font-weight:600; }
        .vdiv { width:1px;height:18px;background:rgba(255,255,255,.1);margin:0 2px; }
        .vbtn { width:30px;height:30px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.6);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background .15s; }
        .vbtn:hover { background:rgba(255,255,255,.1);color:#fff; }
        .vbtn.on { background:rgba(255,255,255,.16);color:#fff; }

        .slideshow-group { display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.07);border-radius:7px;padding:2px 8px;height:30px; }
        .ss-btn { background:transparent;border:none;color:rgba(255,255,255,.75);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0 4px;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap; }
        .ss-btn:hover { color:#fff; }
        .ss-btn.active { color:#4ade80; }
        .ss-sep { color:rgba(255,255,255,.2);font-size:12px; }
        .ss-interval { width:28px;background:transparent;border:none;color:rgba(255,255,255,.7);font-size:11px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;text-align:center;padding:0; }
        .ss-interval::-webkit-inner-spin-button { display:none; }

        .slideshow-progress { position:absolute;bottom:0;left:0;right:0;height:2px;background:rgba(255,255,255,.1); }
        .slideshow-progress-fill { height:100%;background:#4ade80; }

        .viewer-body { flex:1;display:flex;overflow:hidden;position:relative; }
        .thumb-panel { width:155px;background:#111827;border-right:1px solid rgba(255,255,255,.07);overflow-y:auto;padding:.7rem .55rem;display:flex;flex-direction:column;gap:5px;flex-shrink:0; }
        .thumb-panel::-webkit-scrollbar { width:3px; }
        .thumb-panel::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12);border-radius:2px; }
        .tp-title { font-size:9px;font-weight:600;color:rgba(255,255,255,.28);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;padding:0 2px; }
        .thumb-item { border-radius:6px;overflow:hidden;cursor:pointer;border:2px solid transparent;position:relative;background:#1f2937;transition:border-color .15s;flex-shrink:0; }
        .thumb-item.active { border-color:#4da3ff; }
        .thumb-item:hover:not(.active) { border-color:rgba(77,163,255,.4); }
        .tnum { position:absolute;bottom:3px;right:4px;font-size:9px;font-weight:700;color:rgba(255,255,255,.5);font-family:'Plus Jakarta Sans',sans-serif; }

        .viewer-main { flex:1;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:1.25rem;background:#1a1a2e;position:relative; }
        .viewer-main::-webkit-scrollbar { width:5px; }
        .viewer-main::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12);border-radius:3px; }
        .pdf-page-wrap { box-shadow:0 8px 40px rgba(0,0,0,.55);border-radius:4px;overflow:hidden;line-height:0;transition:opacity .15s; }
        .pdf-page-wrap.rendering { opacity:.65; }

        .viewer-loading { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:rgba(255,255,255,.45);min-height:300px;flex:1; }
        .viewer-loading p { font-size:13px; }
        .error-box { display:flex;flex-direction:column;align-items:center;gap:10px;min-height:300px;justify-content:center; }
        .error-box p { font-size:13px;color:#fca5a5;text-align:center;max-width:360px;line-height:1.6; }
        .btn-retry { background:#1a5faa;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif; }

        .viewer-bottombar { height:58px;background:#0b1f45;display:flex;align-items:center;justify-content:center;gap:10px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.08);position:relative; }
        .nbtn { width:34px;height:34px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.8);cursor:pointer;font-size:19px;display:flex;align-items:center;justify-content:center;transition:background .15s,transform .1s; }
        .nbtn:hover:not(:disabled) { background:rgba(255,255,255,.1);color:#fff;transform:scale(1.08); }
        .nbtn:active:not(:disabled) { transform:scale(0.94); }
        .nbtn:disabled { opacity:.28;cursor:not-allowed; }
        .page-ind { display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.07);border-radius:9px;padding:5px 13px; }
        .pinput { width:34px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:5px;padding:2px 4px;font-size:13px;font-weight:700;color:#fff;text-align:center;font-family:'Plus Jakarta Sans',sans-serif;outline:none; }
        .psep { font-size:12px;color:rgba(255,255,255,.3); }
        .ptot { font-size:12px;color:rgba(255,255,255,.45); }
        .prog-wrap { width:90px;height:3px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden; }
        .prog-fill { height:100%;border-radius:99px;background:linear-gradient(90deg,#1a5faa,#4da3ff);transition:width .25s ease; }
        .kb-hints { display:flex;gap:7px;margin-left:.2rem; }
        .kb-hint { font-size:10px;color:rgba(255,255,255,.22);display:flex;align-items:center;gap:2px; }
        .kbk { background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:3px;padding:1px 4px;font-size:9px;color:rgba(255,255,255,.38); }
      `}</style>

      <div className="viewer-overlay" ref={viewerDivRef}>

        {/* ── TOPBAR ── */}
        <div className="viewer-topbar" style={{ position: "relative" }}>
          <div className="vt-left">
            <button className="vclose" onClick={onClose} title="Fermer (Échap)">✕</button>
            <p className="vtitle">{pres.name}</p>
            <span className={isPDF ? "vbadge-pdf" : "vbadge-pptx"}>{pres.file_type}</span>
          </div>

          <div className="vt-right">
            {isPDF && (
              <div className="zoom-group">
                <button className="zbtn" onClick={() => setScale(s => Math.max(+(s-0.1).toFixed(1), 0.4))} title="Zoom arrière (-)">−</button>
                <span className="zval">{Math.round(scale * 100)}%</span>
                <button className="zbtn" onClick={() => setScale(s => Math.min(+(s+0.1).toFixed(1), 3))} title="Zoom avant (+)">+</button>
                <button className="zbtn" onClick={() => setScale(1)} style={{ fontSize: 10 }} title="Réinitialiser (0)">↺</button>
              </div>
            )}

            {isPDF && totalPages > 0 && (
              <>
                <div className="vdiv" />
                <div className="slideshow-group" title="Mode diaporama (Espace)">
                  <button
                    className={`ss-btn ${slideshowActive ? "active" : ""}`}
                    onClick={toggleSlideshow}
                    title={slideshowActive ? "Pause diaporama (Espace)" : "Lancer diaporama (Espace)"}
                  >
                    {slideshowActive ? "⏸" : "▶"} Diaporama
                  </button>
                  <span className="ss-sep">·</span>
                  <input
                    className="ss-interval"
                    type="number"
                    min={2}
                    max={60}
                    value={slideshowInterval}
                    onChange={e => setSlideshowInterval(Math.max(2, Math.min(60, Number(e.target.value))))}
                    title="Intervalle en secondes"
                  />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>s</span>
                </div>
              </>
            )}

            <div className="vdiv" />

            {isPDF && (
              <button className={`vbtn ${showThumbnails ? "on" : ""}`} onClick={() => setShowThumbnails(v => !v)} title="Panneaux slides (T)">☰</button>
            )}

            <button className={`vbtn ${isFullscreen ? "on" : ""}`} onClick={toggleFullscreen} title="Plein écran (F)">⛶</button>

            {fileUrl && (
              <a href={fileUrl} download={`${pres.name}.${pres.file_type}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <button className="vbtn" title="Télécharger">⬇</button>
              </a>
            )}
          </div>

          {/* Barre de progression CSS synchronisée */}
          {slideshowActive && (
            <div className="slideshow-progress">
              <div
                className="slideshow-progress-fill"
                key={`${currentPage}-${slideshowInterval}`} 
                style={{
                  animation: `slideProgress ${slideshowInterval}s linear forwards`,
                }}
              />
            </div>
          )}
          <style>{`@keyframes slideProgress { from{width:0%} to{width:100%} }`}</style>
        </div>

        {/* ── BODY ── */}
        <div className="viewer-body">
          {isPDF && showThumbnails && totalPages > 0 && (
            <div className="thumb-panel">
              <p className="tp-title">Slides ({totalPages})</p>
              {thumbPages.map(n => (
                <ThumbnailItem
                  key={n}
                  pageNum={n}
                  pdfData={pdfData}
                  isActive={currentPage === n}
                  onClick={() => { setCurrentPage(n); setSlideshowActive(false); }}
                />
              ))}
            </div>
          )}

          <div className="viewer-main">
            {loading && (
              <div className="viewer-loading">
                <div className="spinner-border text-light" role="status" />
                <p>Chargement du fichier…</p>
              </div>
            )}

            {!loading && errorMsg && (
              <div className="error-box">
                <span style={{ fontSize: 38 }}>⚠️</span>
                <p>{errorMsg}</p>
                <button className="btn-retry" onClick={() => setRetryCount(c => c + 1)}>🔄 Réessayer</button>
              </div>
            )}

            {!loading && !errorMsg && isPDF && pdfSource && (
              <div className={`pdf-page-wrap ${pageRendering ? "rendering" : ""}`}>
                <Document
                  file={pdfSource}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={err => setErrorMsg("Impossible de charger le PDF : " + err.message)}
                  options={{ isEvalSupported: false, maxImageSize: 10 * 1024 * 1024 }}
                  loading={
                    <div className="viewer-loading">
                      <div className="spinner-border text-light" role="status" />
                      <p>Lecture du PDF…</p>
                    </div>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderAnnotationLayer
                    renderTextLayer
                    onRenderSuccess={() => setPageRendering(false)}
                    onRenderError={() => setPageRendering(false)}
                  />
                </Document>
              </div>
            )}

            {!loading && !errorMsg && isPPTX && publicUrl && (
              <OfficeOnlineViewer
                publicUrl={publicUrl}
                onReady={() => setPptxReady(true)}
                onError={() => setErrorMsg("Office Online n'a pas pu charger le fichier.")}
              />
            )}

            {/* Injection de l'Overlay avec liaison des références */}
            <GestureOverlay
              videoRef={videoRef}
              canvasRef={canvasRef}
              status={gestureStatus}
              lastGesture={lastGesture}
              enabled={gestureEnabled}
              onToggle={() => setGestureEnabled(v => !v)}
            />
          </div>
        </div>

        {/* ── BOTTOM BAR (PDF) ── */}
        {isPDF && totalPages > 0 && (
          <div className="viewer-bottombar">
            <button className="nbtn" onClick={() => { goPrev(); setSlideshowActive(false); }} disabled={currentPage <= 1} title="Précédent (←)">‹</button>
            <div className="page-ind">
              <input
                className="pinput"
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={e => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= totalPages) { setCurrentPage(v); setSlideshowActive(false); }
                }}
              />
              <span className="psep">/</span>
              <span className="ptot">{totalPages}</span>
            </div>
            <div className="prog-wrap">
              <div className="prog-fill" style={{ width: `${(currentPage / totalPages) * 100}%` }} />
            </div>
            <button className="nbtn" onClick={() => { goNext(); setSlideshowActive(false); }} disabled={currentPage >= totalPages} title="Suivant (→)">›</button>
            <div className="kb-hints">
              <span className="kb-hint"><span className="kbk">←</span><span className="kbk">→</span> Nav</span>
              <span className="kb-hint"><span className="kbk">Espace</span> Diaporama</span>
              <span className="kb-hint"><span className="kbk">F</span> Plein écran</span>
              <span className="kb-hint"><span className="kbk">Esc</span> Fermer</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default PresentationViewer;