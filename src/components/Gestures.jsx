import { useState } from "react";

// Place ce composant dans src/components/Gestures.jsx
// Dans Dashboard.jsx : {activeNav === "gestures" && <Gestures />}

const gestures = [
  {
    id: 1,
    icon: "👉",
    name: "Slide Suivant",
    shortcut: "→",
    description: "Pointez l'index vers la droite pour passer à la slide suivante.",
    howTo: "Levez la main, tendez l'index et déplacez-le vers la droite.",
    tips: "Gardez les autres doigts fermés pour éviter les fausses détections.",
    category: "Navigation",
    color: "#1a5faa",
    bg: "#eff6ff",
  },
  {
    id: 2,
    icon: "👈",
    name: "Slide Précédente",
    shortcut: "←",
    description: "Pointez l'index vers la gauche pour revenir à la slide précédente.",
    howTo: "Levez la main, tendez l'index et déplacez-le vers la gauche.",
    tips: "Le mouvement doit être rapide et tranché pour être bien détecté.",
    category: "Navigation",
    color: "#1a5faa",
    bg: "#eff6ff",
  },
  {
    id: 3,
    icon: "✋",
    name: "Pause / Reprendre",
    shortcut: "Space",
    description: "Ouvrez la paume face à la caméra pour mettre en pause ou reprendre.",
    howTo: "Tendez tous les doigts ouverts, paume face à la caméra, maintenez 1 seconde.",
    tips: "Restez immobile pendant la détection pour éviter les erreurs.",
    category: "Contrôle",
    color: "#0f6e56",
    bg: "#e1f5ee",
  },
  {
    id: 4,
    icon: "✌️",
    name: "Zoom Avant",
    shortcut: "+",
    description: "Écartez l'index et le majeur pour zoomer sur le contenu affiché.",
    howTo: "Formez un V avec l'index et le majeur, puis écartez-les lentement.",
    tips: "Plus l'écartement est grand, plus le zoom sera important.",
    category: "Zoom",
    color: "#854f0b",
    bg: "#faeeda",
  },
  {
    id: 5,
    icon: "🤏",
    name: "Zoom Arrière",
    shortcut: "-",
    description: "Rapprochez le pouce et l'index pour dézoomer et voir la vue globale.",
    howTo: "Formez un pincement avec le pouce et l'index, puis resserrez-les.",
    tips: "Commencez avec les doigts écartés pour un meilleur résultat.",
    category: "Zoom",
    color: "#854f0b",
    bg: "#faeeda",
  },
  {
    id: 6,
    icon: "👍",
    name: "Fin de présentation",
    shortcut: "Esc",
    description: "Levez le pouce vers le haut pour terminer la session en cours.",
    howTo: "Fermez le poing puis levez uniquement le pouce, maintenez 2 secondes.",
    tips: "La durée de maintien évite les fins accidentelles.",
    category: "Contrôle",
    color: "#0f6e56",
    bg: "#e1f5ee",
  },
];

const categories = ["Tous", "Navigation", "Contrôle", "Zoom"];

const catColors = {
  Navigation: { bg: "#eff6ff", color: "#1e40af" },
  Contrôle:   { bg: "#e1f5ee", color: "#0f6e56" },
  Zoom:       { bg: "#faeeda", color: "#854f0b" },
};

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
        .gest-page { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── HEADER ── */
        .gest-header { margin-bottom: 1.5rem; }
        .gest-header h1 { font-size: 20px; font-weight: 700; color: #0b1f45; margin-bottom: 4px; }
        .gest-header p  { font-size: 13px; color: #9ca3af; }

        /* ── HOW IT WORKS BANNER ── */
        .how-banner {
          background: #fff;
          border: 1px solid #e8ecf4;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .how-banner h2 { font-size: 15px; font-weight: 700; color: #0b1f45; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
        .how-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .how-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          position: relative;
        }
        .how-step:not(:last-child)::after {
          content: '→';
          position: absolute;
          right: -12px;
          top: 22px;
          color: #d1d5db;
          font-size: 16px;
        }
        .step-circle {
          width: 46px; height: 46px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .step-num {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .step-title { font-size: 13px; font-weight: 700; color: #0b1f45; }
        .step-desc  { font-size: 11.5px; color: #9ca3af; line-height: 1.5; }

        /* ── FILTER TABS ── */
        .filter-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .filter-tab {
          padding: 7px 16px;
          border-radius: 9px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.15s;
        }
        .filter-tab:hover { border-color: #1a5faa; color: #1a5faa; }
        .filter-tab.active { background: #0b1f45; color: #fff; border-color: #0b1f45; }

        /* ── GRID ── */
        .gest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        /* ── GESTURE CARD ── */
        .gest-card {
          background: #fff;
          border: 1.5px solid #e8ecf4;
          border-radius: 14px;
          padding: 1.25rem;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.15s, border-color 0.15s;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .gest-card:hover { box-shadow: 0 6px 24px rgba(11,31,69,0.1); transform: translateY(-2px); border-color: #c9d3e8; }
        .gest-card.selected { border-color: #1a5faa; box-shadow: 0 0 0 3px rgba(26,95,170,0.12); }

        .gest-card-top { display: flex; align-items: center; justify-content: space-between; }
        .gest-emoji-wrap {
          width: 52px; height: 52px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
        }
        .gest-shortcut {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 7px;
          border: 1.5px solid #e5e7eb;
          color: #6b7280;
          background: #f9fafb;
          font-family: monospace;
        }

        .gest-cat-badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
          width: fit-content;
        }
        .gest-name { font-size: 15px; font-weight: 700; color: #0b1f45; }
        .gest-desc { font-size: 12.5px; color: #6b7280; line-height: 1.55; }
        .gest-card-footer { font-size: 12px; color: #1a5faa; font-weight: 600; display: flex; align-items: center; gap: 4px; }

        /* ── DETAIL PANEL ── */
        .detail-panel {
          background: #fff;
          border: 1.5px solid #1a5faa;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          animation: slideIn 0.2s ease;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .detail-title-row { display: flex; align-items: center; gap: 12px; }
        .detail-emoji { font-size: 36px; }
        .detail-name { font-size: 18px; font-weight: 700; color: #0b1f45; }
        .detail-cat  { font-size: 11.5px; font-weight: 600; margin-top: 3px; }
        .btn-close { background: #f4f6fb; border: 1px solid #e8ecf4; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: #6b7280; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.15s; }
        .btn-close:hover { background: #e8ecf4; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .detail-block { background: #f9fafb; border-radius: 10px; padding: 1rem; }
        .detail-block h4 { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
        .detail-block p  { font-size: 13px; color: #374151; line-height: 1.6; }
        .tip-block { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 1rem; margin-top: 1rem; display: flex; gap: 10px; }
        .tip-block p { font-size: 12.5px; color: #92400e; line-height: 1.6; }

        /* ── TIPS CARD ── */
        .tips-card {
          background: #fff;
          border: 1px solid #e8ecf4;
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
        }
        .tips-card h2 { font-size: 15px; font-weight: 700; color: #0b1f45; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px; }
        .tips-list { display: flex; flex-direction: column; gap: 10px; }
        .tip-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #374151; line-height: 1.6; }
        .tip-dot { width: 22px; height: 22px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #1e40af; flex-shrink: 0; margin-top: 2px; }

        @media (max-width: 640px) {
          .how-steps { grid-template-columns: 1fr 1fr; }
          .how-step::after { display: none; }
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="gest-page">

        {/* Header */}
        <div className="gest-header">
          <h1>🤚 Gestes disponibles</h1>
          <p>Apprenez à contrôler vos présentations grâce aux gestes de la main détectés par la caméra.</p>
        </div>

        {/* How it works */}
        <div className="how-banner">
          <h2>⚙️ Comment ça marche ?</h2>
          <div className="how-steps">
            {[
              { icon: "📷", bg: "#eff6ff", num: "Étape 1", title: "Activez la caméra", desc: "Allez dans l'onglet Caméra et autorisez l'accès." },
              { icon: "🤚", bg: "#e1f5ee", num: "Étape 2", title: "Positionnez la main", desc: "Placez votre main dans le cadre de détection, bien éclairée." },
              { icon: "🧠", bg: "#faeeda", num: "Étape 3", title: "Détection IA", desc: "IA analyse vos gestes en temps réel ( 21 points de repère )." },
              { icon: "🖥️", bg: "#f3f4f6", num: "Étape 4", title: "Contrôle instantané", desc: "La commande est exécutée sur votre présentation en direct." },
            ].map((s, i) => (
              <div className="how-step" key={i}>
                <div className="step-circle" style={{ background: s.bg }}>{s.icon}</div>
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
                <span className="detail-emoji">{selected.icon}</span>
                <div>
                  <p className="detail-name">{selected.name}</p>
                  <p className="detail-cat" style={{ color: selected.color }}>{selected.category}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setActiveGesture(null)}>✕</button>
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
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
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
                <div className="gest-emoji-wrap" style={{ background: g.bg }}>{g.icon}</div>
                <span className="gest-shortcut">{g.shortcut}</span>
              </div>
              <span
                className="gest-cat-badge"
                style={{ background: catColors[g.category]?.bg, color: catColors[g.category]?.color }}
              >
                {g.category}
              </span>
              <p className="gest-name">{g.name}</p>
              <p className="gest-desc">{g.description}</p>
              <p className="gest-card-footer">
                {activeGesture === g.id ? "▲ Masquer les détails" : "▼ Voir les détails"}
              </p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="tips-card">
          <h2>💡 Conseils pour une meilleure détection</h2>
          <div className="tips-list">
            {[
              { n: "1", text: "Assurez-vous d'avoir un bon éclairage — la lumière frontale donne les meilleurs résultats." },
              { n: "2", text: "Placez votre main à 40–70 cm de la caméra, dans le cadre de détection vert." },
              { n: "3", text: "Portez des vêtements de couleur différente de votre peau pour faciliter la segmentation." },
              { n: "4", text: "Évitez les arrière-plans chargés ou en mouvement qui peuvent perturber la détection." },
              { n: "5", text: "Effectuez les gestes de façon nette et délibérée — les mouvements flous sont mal reconnus." },
            ].map((tip) => (
              <div className="tip-item" key={tip.n}>
                <span className="tip-dot">{tip.n}</span>
                <p>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

export default Gestures;