import { useState } from "react";
import { Icon } from "./Icon";

// Place ce composant dans src/components/Gestures.jsx
// Dans Dashboard.jsx : {activeNav === "gestures" && <Gestures />}

/* Catégories harmonisées avec la palette du Dashboard */
const CAT = {
  Navigation: { bg: "#eff6ff", color: "#2563eb" },
  Contrôle:   { bg: "#f0fdf4", color: "#16a34a" },
  Zoom:       { bg: "#fff7ed", color: "#ea580c" },
};

const gestures = [
  {
    id: 1, icon: "👉", name: "Slide suivante", shortcut: "→",
    description: "Pointez l'index vers la droite pour passer à la slide suivante.",
    howTo: "Levez la main, tendez l'index et déplacez-le vers la droite.",
    tips: "Gardez les autres doigts fermés pour éviter les fausses détections.",
    category: "Navigation",
  },
  {
    id: 2, icon: "👈", name: "Slide précédente", shortcut: "←",
    description: "Pointez l'index vers la gauche pour revenir à la slide précédente.",
    howTo: "Levez la main, tendez l'index et déplacez-le vers la gauche.",
    tips: "Le mouvement doit être rapide et tranché pour être bien détecté.",
    category: "Navigation",
  },
  {
    id: 3, icon: "✋", name: "Pause / Reprendre", shortcut: "Space",
    description: "Ouvrez la paume face à la caméra pour mettre en pause ou reprendre.",
    howTo: "Tendez tous les doigts ouverts, paume face à la caméra, maintenez 1 seconde.",
    tips: "Restez immobile pendant la détection pour éviter les erreurs.",
    category: "Contrôle",
  },
  {
    id: 4, icon: "✌️", name: "Zoom avant", shortcut: "+",
    description: "Écartez l'index et le majeur pour zoomer sur le contenu affiché.",
    howTo: "Formez un V avec l'index et le majeur, puis écartez-les lentement.",
    tips: "Plus l'écartement est grand, plus le zoom sera important.",
    category: "Zoom",
  },
  {
    id: 5, icon: "🤏", name: "Zoom arrière", shortcut: "-",
    description: "Rapprochez le pouce et l'index pour dézoomer et voir la vue globale.",
    howTo: "Formez un pincement avec le pouce et l'index, puis resserrez-les.",
    tips: "Commencez avec les doigts écartés pour un meilleur résultat.",
    category: "Zoom",
  },
  {
    id: 6, icon: "👍", name: "Fin de présentation", shortcut: "Esc",
    description: "Levez le pouce vers le haut pour terminer la session en cours.",
    howTo: "Fermez le poing puis levez uniquement le pouce, maintenez 2 secondes.",
    tips: "La durée de maintien évite les fins accidentelles.",
    category: "Contrôle",
  },
];

const categories = ["Tous", "Navigation", "Contrôle", "Zoom"];

const steps = [
  { icon: "camera",       bg: "#eff6ff", color: "#2563eb", num: "Étape 1", title: "Activez la caméra",    desc: "Allez dans l'onglet Caméra et autorisez l'accès." },
  { icon: "hand",         bg: "#f0fdf4", color: "#16a34a", num: "Étape 2", title: "Positionnez la main",  desc: "Placez votre main dans le cadre, bien éclairée." },
  { icon: "cpu",          bg: "#fff7ed", color: "#ea580c", num: "Étape 3", title: "Détection IA",         desc: "L'IA analyse vos gestes en temps réel (21 points de repère)." },
  { icon: "presentation", bg: "#f1f5f9", color: "#475569", num: "Étape 4", title: "Contrôle instantané",  desc: "La commande s'exécute sur votre présentation en direct." },
];

const detectionTips = [
  "Assurez-vous d'avoir un bon éclairage — la lumière frontale donne les meilleurs résultats.",
  "Placez votre main à 40–70 cm de la caméra, dans le cadre de détection.",
  "Portez des vêtements d'une couleur différente de votre peau pour faciliter la segmentation.",
  "Évitez les arrière-plans chargés ou en mouvement qui peuvent perturber la détection.",
  "Effectuez les gestes de façon nette et délibérée — les mouvements flous sont mal reconnus.",
];

function Gestures() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [activeGesture, setActiveGesture]   = useState(null);

  const filtered = activeCategory === "Tous"
    ? gestures
    : gestures.filter((g) => g.category === activeCategory);

  const selected = gestures.find((g) => g.id === activeGesture);

  return (
    <>
      <style>{`
        .gest-page { font-family: 'Inter', sans-serif; }

        /* ── HEADER ── */
        .gest-header { display:flex; align-items:center; gap:12px; margin-bottom: 1.5rem; }
        .gest-header-icon {
          width:42px; height:42px; border-radius:11px; flex-shrink:0;
          background:#eff6ff; color:#2563eb;
          display:flex; align-items:center; justify-content:center;
        }
        .gest-header h1 { font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing:-0.02em; margin-bottom: 3px; }
        .gest-header p  { font-size: 13px; color: #94a3b8; font-weight:500; }

        /* ── HOW IT WORKS BANNER ── */
        .how-banner {
          background: #fff; border: 1px solid #f1f5f9; border-radius: 14px;
          padding: 1.5rem; margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .card-head { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 9px; }
        .card-head-ic { color:#2563eb; display:flex; }
        .how-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .how-step { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; position: relative; }
        .how-step:not(:last-child)::after {
          content: ''; position: absolute; right: -10px; top: 23px;
          width: 14px; height: 2px; border-radius: 2px;
          background: linear-gradient(90deg, #cbd5e1, transparent);
        }
        .step-circle { width: 48px; height: 48px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-num   { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
        .step-title { font-size: 13px; font-weight: 700; color: #0f172a; margin: 2px 0; }
        .step-desc  { font-size: 11.5px; color: #94a3b8; line-height: 1.5; font-weight:500; }

        /* ── FILTER TABS ── */
        .filter-tabs { display: flex; gap: 6px; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .filter-tab {
          padding: 7px 16px; border-radius: 9px; border: 1px solid #e2e8f0; background: #fff;
          font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.15s cubic-bezier(0.23,1,0.32,1);
        }
        .filter-tab:hover { border-color: #cbd5e1; color: #0f172a; background:#f8fafc; }
        .filter-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; box-shadow:0 2px 8px rgba(15,23,42,0.18); }

        /* ── GRID ── */
        .gest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }

        /* ── GESTURE CARD ── */
        .gest-card {
          background: #fff; border: 1px solid #f1f5f9; border-radius: 14px; padding: 1.25rem;
          cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: box-shadow 0.2s cubic-bezier(0.23,1,0.32,1), transform 0.15s cubic-bezier(0.23,1,0.32,1), border-color 0.15s;
          display: flex; flex-direction: column; gap: 10px;
        }
        @media (hover:hover) and (pointer:fine) {
          .gest-card:hover { box-shadow: 0 8px 18px rgba(15,23,42,0.08); transform: translateY(-2px); border-color: #e2e8f0; }
        }
        .gest-card.selected { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }

        .gest-card-top { display: flex; align-items: center; justify-content: space-between; }
        .gest-emoji-wrap { width: 52px; height: 52px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
        .gest-shortcut {
          font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 7px;
          border: 1px solid #e2e8f0; color: #64748b; background: #f8fafc;
          font-family: ui-monospace, monospace;
        }
        .gest-cat-badge { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 20px; width: fit-content; letter-spacing:0.02em; }
        .gest-name { font-size: 15px; font-weight: 700; color: #0f172a; }
        .gest-desc { font-size: 12.5px; color: #64748b; line-height: 1.55; font-weight:500; }
        .gest-card-footer { font-size: 12px; color: #3b82f6; font-weight: 600; display: flex; align-items: center; gap: 5px; margin-top:2px; }
        .gest-card-footer .chev { display:flex; transition: transform 0.2s cubic-bezier(0.23,1,0.32,1); }
        .gest-card.selected .gest-card-footer .chev { transform: rotate(180deg); }

        /* ── DETAIL PANEL ── */
        .detail-panel {
          background: #fff; border: 1px solid #3b82f6; border-radius: 16px;
          padding: 1.5rem; margin-bottom: 1.5rem;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          animation: slideIn 0.22s cubic-bezier(0.23,1,0.32,1);
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .detail-title-row { display: flex; align-items: center; gap: 14px; }
        .detail-emoji-wrap { width:52px; height:52px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; }
        .detail-name { font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing:-0.01em; }
        .detail-cat  { font-size: 11.5px; font-weight: 700; margin-top: 3px; }
        .btn-close {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px;
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748b; flex-shrink:0;
          transition: background 0.15s, color 0.15s;
        }
        .btn-close:hover { background: #f1f5f9; color:#0f172a; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .detail-block { background: #f8fafc; border-radius: 11px; padding: 1rem; border:1px solid #f1f5f9; }
        .detail-block h4 { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
        .detail-block p  { font-size: 13px; color: #334155; line-height: 1.6; font-weight:500; }
        .tip-block { background: #fffbeb; border: 1px solid #fde68a; border-radius: 11px; padding: 1rem; margin-top: 1rem; display: flex; gap: 11px; align-items:flex-start; }
        .tip-block .tip-ic { color:#d97706; display:flex; flex-shrink:0; margin-top:1px; }
        .tip-block p { font-size: 12.5px; color: #92400e; line-height: 1.6; }

        /* ── TIPS CARD ── */
        .tips-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 14px; padding: 1.25rem 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .tips-list { display: flex; flex-direction: column; gap: 11px; }
        .tip-item { display: flex; align-items: flex-start; gap: 11px; font-size: 13px; color: #334155; line-height: 1.6; font-weight:500; }
        .tip-dot { width: 22px; height: 22px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #2563eb; flex-shrink: 0; margin-top: 1px; }

        @media (max-width: 640px) {
          .how-steps { grid-template-columns: 1fr 1fr; }
          .how-step::after { display: none; }
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="gest-page">

        {/* Header */}
        <div className="gest-header">
          <div className="gest-header-icon"><Icon name="hand" size={22} /></div>
          <div>
            <h1>Gestes disponibles</h1>
            <p>Apprenez à contrôler vos présentations par les gestes de la main détectés par la caméra.</p>
          </div>
        </div>

        {/* How it works */}
        <div className="how-banner">
          <p className="card-head"><span className="card-head-ic"><Icon name="info" size={17} /></span>Comment ça marche ?</p>
          <div className="how-steps">
            {steps.map((s, i) => (
              <div className="how-step" key={i}>
                <div className="step-circle" style={{ background: s.bg, color: s.color }}>
                  <Icon name={s.icon} size={22} />
                </div>
                <div>
                  <p className="step-num">{s.num}</p>
                  <p className="step-title">{s.title}</p>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="detail-panel">
            <div className="detail-header">
              <div className="detail-title-row">
                <div className="detail-emoji-wrap" style={{ background: CAT[selected.category]?.bg }}>{selected.icon}</div>
                <div>
                  <p className="detail-name">{selected.name}</p>
                  <p className="detail-cat" style={{ color: CAT[selected.category]?.color }}>{selected.category}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setActiveGesture(null)} aria-label="Fermer">
                <Icon name="x" size={17} />
              </button>
            </div>
            <div className="detail-grid">
              <div className="detail-block">
                <h4>Description</h4>
                <p>{selected.description}</p>
              </div>
              <div className="detail-block">
                <h4>Comment faire</h4>
                <p>{selected.howTo}</p>
              </div>
            </div>
            <div className="tip-block">
              <span className="tip-ic"><Icon name="lightbulb" size={18} /></span>
              <p><strong>Conseil :</strong> {selected.tips}</p>
            </div>
          </div>
        )}

        {/* Gesture grid */}
        <div className="gest-grid">
          {filtered.map((g) => (
            <div
              key={g.id}
              className={`gest-card ${activeGesture === g.id ? "selected" : ""}`}
              onClick={() => setActiveGesture(activeGesture === g.id ? null : g.id)}
            >
              <div className="gest-card-top">
                <div className="gest-emoji-wrap" style={{ background: CAT[g.category]?.bg }}>{g.icon}</div>
                <span className="gest-shortcut">{g.shortcut}</span>
              </div>
              <span className="gest-cat-badge" style={{ background: CAT[g.category]?.bg, color: CAT[g.category]?.color }}>
                {g.category}
              </span>
              <p className="gest-name">{g.name}</p>
              <p className="gest-desc">{g.description}</p>
              <p className="gest-card-footer">
                <span className="chev"><Icon name="chevron-down" size={14} /></span>
                {activeGesture === g.id ? "Masquer les détails" : "Voir les détails"}
              </p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="tips-card">
          <p className="card-head"><span className="card-head-ic"><Icon name="lightbulb" size={17} /></span>Conseils pour une meilleure détection</p>
          <div className="tips-list">
            {detectionTips.map((text, i) => (
              <div className="tip-item" key={i}>
                <span className="tip-dot">{i + 1}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

export default Gestures;