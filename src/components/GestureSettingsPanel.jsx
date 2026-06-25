/* Panneau de réglages de détection (curseurs).
   Props : settings, onChange(patch), onReset() */

function Slider({ label, hint, value, min, max, step, format, onChange }) {
  return (
    <div style={ps.row}>
      <div style={ps.head}>
        <span style={ps.label}>{label}</span>
        <span style={ps.value}>{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={ps.range}
      />
      {hint && <span style={ps.hint}>{hint}</span>}
    </div>
  );
}

export default function GestureSettingsPanel({ settings, onChange, onReset }) {
  return (
    <div style={ps.card}>
      <div style={ps.cardHead}>
        <h3 style={ps.title}>Réglages de détection</h3>
        <button style={ps.reset} onClick={onReset}>Réinitialiser</button>
      </div>

      <Slider
        label="Seuil de confiance"
        hint="Plus haut = moins d'erreurs, mais plus exigeant."
        value={settings.confidence} min={0.5} max={0.95} step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ confidence: v })}
      />
      <Slider
        label="Lissage"
        hint="Moyenne les probabilités sur N frames (1 = aucun lissage)."
        value={settings.smoothing} min={1} max={10} step={1}
        format={(v) => `${v} frame${v > 1 ? "s" : ""}`}
        onChange={(v) => onChange({ smoothing: v })}
      />
      <Slider
        label="Stabilité requise"
        hint="Frames stables avant de valider un geste."
        value={settings.stableFrames} min={1} max={10} step={1}
        format={(v) => `${v} frame${v > 1 ? "s" : ""}`}
        onChange={(v) => onChange({ stableFrames: v })}
      />
      <Slider
        label="Délai entre gestes"
        hint="Temps minimum avant de pouvoir redéclencher."
        value={settings.cooldownMs} min={300} max={3000} step={100}
        format={(v) => `${(v / 1000).toFixed(1)} s`}
        onChange={(v) => onChange({ cooldownMs: v })}
      />
    </div>
  );
}

const ps = {
  card: { background:"#fff", border:"1px solid #f1f5f9", borderRadius:14, padding:"1.25rem", boxShadow:"0 2px 4px rgba(0,0,0,0.02)", fontFamily:"Inter, sans-serif" },
  cardHead: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 },
  title: { fontSize:13, fontWeight:700, color:"#0f172a", margin:0 },
  reset: { fontSize:11, fontWeight:600, color:"#64748b", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:7, padding:"4px 10px", cursor:"pointer", fontFamily:"Inter, sans-serif" },
  row: { marginBottom:16 },
  head: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 },
  label: { fontSize:12.5, fontWeight:600, color:"#334155" },
  value: { fontSize:12.5, fontWeight:700, color:"#3b82f6" },
  range: { width:"100%", accentColor:"#3b82f6", cursor:"pointer" },
  hint: { display:"block", fontSize:11, color:"#94a3b8", marginTop:5, lineHeight:1.4 },
};