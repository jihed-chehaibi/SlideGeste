import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import GestureOverlay from "../components/GestureOverlay";

/* ════════════════════════════════════════════════════════════
   MAPPING GESTE → ACTION
   Les clés DOIVENT correspondre aux labels du tableau LABELS
   dans src/hooks/useGestureModel.js. Ajuste-les si besoin.
   ════════════════════════════════════════════════════════════ */
const GESTURE_LABEL = {
  next:     "Slide suivante ›",
  prev:     "‹ Slide précédente",
  zoom_in:  "Zoom avant +",
  zoom_out: "Zoom arrière −",
  pause:    "Pause",
  play:     "Lecture",
};

/* ─────────────────────────────────────────────────────────
   Hook : récupère la présentation + les URLs publiques des images
───────────────────────────────────────────────────────── */
function useSlides(id) {
  const [pres, setPres]     = useState(null);
  const [slides, setSlides] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | converting | ready | error
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let pollTimer;

    async function load() {
      const { data, error: dbErr } = await supabase
        .from("presentations").select("*").eq("id", id).single();
      if (cancelled) return;
      if (dbErr || !data) { setError("Présentation introuvable."); setStatus("error"); return; }
      setPres(data);

      if (!data.slides_ready || !data.slide_count) {
        setStatus("converting");
        pollTimer = setTimeout(load, 3000);
        return;
      }

      const paths = Array.from({ length: data.slide_count }, (_, i) =>
        `${id}/${String(i + 1).padStart(3, "0")}.png`
      );
      const urls = paths.map(
        (p) => supabase.storage.from("slides").getPublicUrl(p).data.publicUrl
      );
      if (cancelled) return;
      setSlides(urls);
      setStatus("ready");
    }

    load();
    return () => { cancelled = true; clearTimeout(pollTimer); };
  }, [id]);

  return { pres, slides, status, error };
}

export default function PresentationViewer() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { pres, slides, status, error } = useSlides(id);

  const wrapperRef  = useRef(null);
  const overlayRef  = useRef(null);
  const toastTimer  = useRef(null);

  const [current, setCurrent]           = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom]                 = useState(1);
  const [gestureMode, setGestureMode]   = useState(false);
  const [toast, setToast]               = useState(null);

  /* ── Navigation (appelée au clavier, aux boutons ET aux gestes) ── */
  const next = useCallback(() => {
    setZoom(1);
    setCurrent((c) => Math.min(c + 1, slides.length - 1));
  }, [slides.length]);
  const prev = useCallback(() => {
    setZoom(1);
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);
  const goTo = useCallback((i) => {
    setZoom(1);
    setCurrent(() => Math.max(0, Math.min(i, slides.length - 1)));
  }, [slides.length]);

  /* Retour visuel éphémère */
  const flash = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);

  /* ── Mapping geste → action ── */
  const handleGesture = useCallback((gesture) => {
    flash(GESTURE_LABEL[gesture] || gesture);
    switch (gesture) {
     case "next":     next(); break;
     case "prev":     prev(); break;
     case "zoom_in":  setZoom((z) => Math.min(z + 0.3, 2.5)); break;
     case "zoom_out": setZoom((z) => Math.max(z - 0.3, 1)); break;
     case "pause":    /* ex : geler la navigation, à toi de voir */ break;
     case "play":     /* ex : reprendre */ break;
     case "fin":      // (plus de classe "fin" — supprimée)
      default: break;
   }
 }, [next, prev, flash]);

  /* Préchargement des images adjacentes */
  useEffect(() => {
    [current - 1, current + 1].forEach((i) => {
      if (i >= 0 && i < slides.length) { const img = new Image(); img.src = slides[i]; }
    });
  }, [current, slides]);

  /* Plein écran */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) wrapperRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  /* Raccourcis clavier */
  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft"  || e.key === "PageUp")  { e.preventDefault(); prev(); }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "Escape" && isFullscreen) document.exitFullscreen?.();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, toggleFullscreen, isFullscreen]);

  if (status === "loading") {
    return (<div style={s.center}><div style={s.spinner} /><p style={s.dimText}>Chargement…</p></div>);
  }
  if (status === "converting") {
    return (
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={s.dimText}>Conversion de la présentation en cours…</p>
        <p style={{ ...s.dimText, fontSize: 12, color: "#475569" }}>Les diapositives apparaîtront automatiquement</p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div style={s.center}>
        <p style={s.errText}>{error}</p>
        <button style={s.backBtn} onClick={() => navigate("/presentations")}>← Retour aux présentations</button>
      </div>
    );
  }

  return (
    <div style={s.page} ref={wrapperRef}>
      {/* Top bar */}
      <header style={s.topBar}>
        <button style={s.iconBtn} onClick={() => navigate("/dashboard")} title="Retour" aria-label="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
        </button>

        <div style={s.titleArea}>
          <span style={s.presTitle}>{pres?.name}</span>
          <span style={s.badge}>{current + 1} / {slides.length}</span>
        </div>

        <div style={s.topRight}>
          {/* Toggle contrôle gestuel */}
          <button
            style={{ ...s.gestBtn, ...(gestureMode ? s.gestBtnActive : {}) }}
            onClick={() => setGestureMode((g) => !g)}
            title={gestureMode ? "Désactiver le contrôle gestuel" : "Activer le contrôle gestuel"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
              <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
            Gestes
          </button>

          <button style={s.iconBtn} onClick={toggleFullscreen} title={isFullscreen ? "Quitter plein écran (F)" : "Plein écran (F)"} aria-label="Plein écran">
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Zone principale */}
      <div style={s.main}>
        <div style={s.scene}>
          <img
            src={slides[current]}
            alt={`Diapositive ${current + 1}`}
            style={{ ...s.slideImg, transform: `scale(${zoom})`, transition: "transform 0.22s ease" }}
            draggable={false}
          />
          <canvas ref={overlayRef} style={s.overlay} aria-hidden="true" />

          {current > 0 && (
            <button style={{ ...s.navArrow, left: 12 }} onClick={prev} aria-label="Précédente">‹</button>
          )}
          {current < slides.length - 1 && (
            <button style={{ ...s.navArrow, right: 12 }} onClick={next} aria-label="Suivante">›</button>
          )}

          {/* Retour visuel du geste */}
          {toast && <div style={s.toast}>{toast}</div>}
        </div>
      </div>

      {/* Pied : pastilles */}
      <footer style={s.footer}>
        <div style={s.dots}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ ...s.dot, ...(i === current ? s.dotActive : {}) }} aria-label={`Diapositive ${i + 1}`} />
          ))}
        </div>
      </footer>

      {/* Overlay caméra — monté seulement quand le contrôle gestuel est actif */}
      {gestureMode && <GestureOverlay onGesture={handleGesture} />}
    </div>
  );
}

const s = {
  page: { display:"flex", flexDirection:"column", height:"100vh", background:"#0A0F1E", fontFamily:"Inter, sans-serif", overflow:"hidden" },
  topBar: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:52, background:"#0F172A", borderBottom:"1px solid #1E293B", flexShrink:0, zIndex:20 },
  titleArea: { display:"flex", alignItems:"center", gap:10 },
  presTitle: { fontSize:14, fontWeight:600, color:"#F1F5F9", maxWidth:380, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  badge: { fontSize:11, fontWeight:600, background:"#1E3A5F", color:"#60A5FA", borderRadius:20, padding:"2px 10px", letterSpacing:"0.03em" },
  topRight: { display:"flex", alignItems:"center", gap:8 },
  iconBtn: { width:36, height:36, borderRadius:8, background:"transparent", border:"1px solid #1E293B", color:"#94A3B8", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" },
  gestBtn: { display:"flex", alignItems:"center", gap:6, height:36, padding:"0 12px", borderRadius:8, background:"transparent", border:"1px solid #1E293B", color:"#94A3B8", fontSize:13, fontWeight:600, fontFamily:"Inter, sans-serif", cursor:"pointer" },
  gestBtnActive: { background:"rgba(59,130,246,0.15)", borderColor:"#3b82f6", color:"#93c5fd" },
  main: { flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20, overflow:"hidden", background:"#0A0F1E" },
  scene: { position:"relative", width:"100%", maxWidth:"calc((100vh - 52px - 44px - 40px) * (16/9))", aspectRatio:"16 / 9", background:"#000", borderRadius:6, overflow:"hidden", boxShadow:"0 0 0 1px #1E293B" },
  slideImg: { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain", display:"block", zIndex:1, userSelect:"none" },
  overlay: { position:"absolute", inset:0, width:"100%", height:"100%", zIndex:10, pointerEvents:"none", background:"transparent" },
  navArrow: { position:"absolute", top:"50%", transform:"translateY(-50%)", width:44, height:44, borderRadius:"50%", border:"none", background:"rgba(15,23,42,0.6)", color:"#fff", fontSize:26, lineHeight:1, cursor:"pointer", zIndex:15, display:"flex", alignItems:"center", justifyContent:"center" },
  toast: { position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", background:"rgba(15,23,42,0.92)", color:"#fff", fontSize:14, fontWeight:600, padding:"8px 18px", borderRadius:24, zIndex:25, border:"1px solid #334155", boxShadow:"0 8px 24px rgba(0,0,0,0.4)", whiteSpace:"nowrap" },
  footer: { flexShrink:0, minHeight:44, background:"#0F172A", borderTop:"1px solid #1E293B", display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 16px", zIndex:20 },
  dots: { display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center", maxWidth:"100%" },
  dot: { width:8, height:8, borderRadius:"50%", border:"none", background:"#334155", cursor:"pointer", padding:0 },
  dotActive: { background:"#6366F1", transform:"scale(1.25)" },
  center: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0A0F1E", gap:12 },
  dimText: { fontSize:14, color:"#64748B" },
  errText: { fontSize:15, color:"#F87171" },
  backBtn: { background:"#0F172A", border:"1px solid #1E293B", color:"#CBD5E1", borderRadius:8, padding:"9px 18px", fontSize:14, cursor:"pointer" },
  spinner: { width:32, height:32, border:"3px solid #1E293B", borderTop:"3px solid #6366F1", borderRadius:"50%", animation:"spin 0.8s linear infinite" },
};

if (typeof document !== "undefined" && !document.getElementById("sg-viewer-styles")) {
  const style = document.createElement("style");
  style.id = "sg-viewer-styles";
  style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
}