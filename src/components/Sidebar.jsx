import { useRef, useState, useLayoutEffect, useEffect, useCallback } from "react";
import { Icon } from "./Icon";

/* Structure de navigation — pilote l'affichage et l'ordre de la cascade */
const NAV_SECTIONS = [
  {
    title: "Principal",
    items: [
      { id: "dashboard",     icon: "dashboard",    label: "Dashboard" },
      { id: "presentations", icon: "presentation", label: "Mes Présentations" },
    ],
  },
  {
    title: "Contrôle",
    items: [
      { id: "gestures", icon: "hand",   label: "Gestes" },
      { id: "camera",   icon: "camera", label: "Caméra" },
    ],
  },
 
  {
    title: "Compte",
    items: [
      { id: "settings", icon: "settings", label: "Paramètres" },
    ],
  },
];

const LogoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
  </svg>
);

export default function Sidebar({
  collapsed,
  activeNav,
  onNavClick,
  onSignOut,
  userName,
  userEmail,
  userInitial,
}) {
  const navRef    = useRef(null);
  const itemRefs  = useRef({});
  const footerRef = useRef(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, ready: false });
  const [menuOpen,  setMenuOpen]  = useState(false);

  /* Mesure la position de l'item actif → l'indicateur glisse vers lui */
  const measure = useCallback(() => {
    const el = itemRefs.current[activeNav];
    if (el) {
      setIndicator({ top: el.offsetTop, height: el.offsetHeight, ready: true });
    }
  }, [activeNav]);

  useLayoutEffect(() => { measure(); }, [measure, collapsed]);

  useEffect(() => {
    measure();
    if (document?.fonts?.ready) document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  /* Ferme le menu compte au clic extérieur ou avec Échap */
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (footerRef.current && !footerRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  /* Index courant pour l'animation en cascade */
  let runningIndex = 0;

  return (
    <>
      <style>{`
        :root {
          --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
          --ease-sidebar:    cubic-bezier(0.32, 0.72, 0, 1);
          --ease-spring:     cubic-bezier(0.34, 1.3, 0.64, 1);
          --sb-bg:           #0a0f1e;
          --sb-border:       rgba(255,255,255,0.05);
          --sb-active-bg:    rgba(59,130,246,0.12);
          --sb-active-text:  #93c5fd;
          --sb-active-bar:   #3b82f6;
          --sb-label:        #334155;
          --sb-text:         #94a3b8;
          --sb-hover:        rgba(255,255,255,0.04);
          --sb-icon-bg:      rgba(255,255,255,0.04);
          --sb-icon-active:  rgba(59,130,246,0.16);
        }

        @keyframes sbItemIn  { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
        @keyframes sbFade    { from { opacity:0; } to { opacity:1; } }
        @keyframes sbDrop    { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sbMenuIn  { from { opacity:0; transform:translateY(8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }

        /* ══ SIDEBAR ══ */
        .sidebar {
          width: 248px;
          background: var(--sb-bg);
          display: flex; flex-direction: column;
          position: fixed; top:0; left:0; height:100vh;
          z-index: 100;
          transition: width 280ms var(--ease-sidebar);
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        .sidebar.collapsed { width: 72px; }
        /* Laisse échapper le menu compte (utile en mode replié) */
        .sidebar.menu-open { overflow: visible; }

        /* Header logo */
        .sb-header {
          padding: 0 14px; height: 68px;
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid var(--sb-border);
          flex-shrink: 0;
          animation: sbDrop 420ms var(--ease-out-strong) both;
        }
        .sb-logo-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37,99,235,0.35);
          transition: transform 240ms var(--ease-spring), box-shadow 240ms var(--ease-out-strong);
        }
        @media (hover:hover) and (pointer:fine) {
          .sb-header:hover .sb-logo-icon {
            transform: rotate(-6deg) scale(1.06);
            box-shadow: 0 6px 18px rgba(37,99,235,0.5);
          }
        }
        .sb-logo-text {
          font-size: 15px; font-weight: 700; color: #f8fafc;
          white-space: nowrap; letter-spacing: -0.03em;
          opacity: 1; transition: opacity 180ms var(--ease-out-strong);
        }
        .sb-logo-text span { color: #3b82f6; }
        .sidebar.collapsed .sb-logo-text { opacity:0; pointer-events:none; }

        /* Nav */
        .sb-nav {
          flex:1; padding: 10px 10px;
          display: flex; flex-direction: column; gap: 2px;
          overflow-y: auto; overflow-x: hidden;
          position: relative;
        }
        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

        .sb-indicator {
          position: absolute;
          left: 10px; right: 10px; top: 0;
          border-radius: 9px;
          background: var(--sb-active-bg);
          box-shadow: 0 0 0 1px rgba(59,130,246,0.14),
                      0 6px 16px -4px rgba(59,130,246,0.28);
          z-index: 0; pointer-events: none;
          transition: transform 400ms var(--ease-spring),
                      height 400ms var(--ease-spring),
                      opacity 220ms ease;
        }
        .sb-indicator::before {
          content:''; position:absolute; left:0; top:22%; bottom:22%;
          width:3px; border-radius:0 3px 3px 0; background: var(--sb-active-bar);
        }

        .sb-group { display: contents; }

        .sb-section {
          font-size: 10px; font-weight: 600;
          color: var(--sb-label);
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 14px 10px 5px;
          white-space: nowrap;
          animation: sbFade 500ms ease both;
          transition: opacity 180ms var(--ease-out-strong);
        }
        .sidebar.collapsed .sb-section { opacity:0; height:28px; padding-top:14px; }

        .sb-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 9px;
          cursor: pointer; border: none; background: transparent;
          width: 100%; text-align: left;
          color: var(--sb-text);
          font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;
          white-space: nowrap; overflow: hidden;
          position: relative; z-index: 1;
          animation: sbItemIn 420ms var(--ease-out-strong) both;
          transition: color 160ms var(--ease-out-strong),
                      background-color 140ms var(--ease-out-strong),
                      transform 120ms var(--ease-spring);
        }
        @media (hover:hover) and (pointer:fine) {
          .sb-item:not(.active):hover { color: #cbd5e1; transform: translateX(3px); }
          .sb-item:not(.active):hover .sb-item-icon { background: rgba(255,255,255,0.08); transform: scale(1.1); }
        }
        .sb-item:active { transform: scale(0.97); }
        .sb-item.active { color: var(--sb-active-text); }

        .sb-item-icon {
          width: 30px; height: 30px; border-radius: 7px;
          background: var(--sb-icon-bg);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background-color 160ms var(--ease-out-strong),
                      transform 200ms var(--ease-spring),
                      box-shadow 200ms var(--ease-out-strong);
        }
        .sb-item.active .sb-item-icon {
          background: var(--sb-icon-active);
          box-shadow: 0 0 14px -2px rgba(59,130,246,0.55);
        }
        .sb-item-label { flex:1; overflow:hidden; transition: opacity 180ms var(--ease-out-strong); }
        .sidebar.collapsed .sb-item-label { opacity:0; width:0; }

        /* ══ FOOTER — carte compte interactive ══ */
        .sb-footer {
          padding: 10px;
          border-top: 1px solid var(--sb-border);
          flex-shrink: 0;
          position: relative;
          animation: sbDrop 460ms var(--ease-out-strong) 240ms both;
        }

        .sb-user {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 9px 10px; border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.04);
          cursor: pointer; overflow: hidden;
          font-family: 'Inter', sans-serif; text-align: left;
          transition: background-color 160ms var(--ease-out-strong),
                      border-color 160ms var(--ease-out-strong),
                      transform 140ms var(--ease-spring);
        }
        @media (hover:hover) and (pointer:fine) {
          .sb-user:hover { background: rgba(255,255,255,0.06); transform: translateY(-1px); }
        }
        .sb-user:active { transform: scale(0.98); }
        .sb-user.open { background: rgba(59,130,246,0.10); border-color: rgba(59,130,246,0.35); }
        .sb-user:focus-visible { outline: 2px solid rgba(59,130,246,0.55); outline-offset: 2px; }

        .sb-avatar {
          position: relative;
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(59,130,246,0.3);
        }
        .sb-status {
          position: absolute; right: -1px; bottom: -1px;
          width: 9px; height: 9px; border-radius: 50%;
          background: #22c55e; border: 2px solid var(--sb-bg);
        }

        .sb-user-info { overflow: hidden; flex:1; transition: opacity 180ms var(--ease-out-strong); }
        .sb-user-name  { font-size: 12px; font-weight: 600; color: #e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-user-email { font-size: 10px; color: #475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
        .sidebar.collapsed .sb-user-info { opacity:0; width:0; overflow:hidden; }

        .sb-user-chevron {
          margin-left: auto; color: #475569; display: flex; flex-shrink: 0;
          transition: transform 260ms var(--ease-spring), color 160ms ease;
        }
        .sb-user.open .sb-user-chevron { transform: rotate(180deg); color: #94a3b8; }
        .sidebar.collapsed .sb-user-chevron { opacity:0; width:0; }

        /* ── POPOVER MENU ── */
        .sb-menu {
          position: absolute;
          left: 10px; right: 10px;
          bottom: calc(100% - 6px);
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px; padding: 6px;
          box-shadow: 0 16px 40px -10px rgba(0,0,0,0.65);
          z-index: 130;
          animation: sbMenuIn 180ms var(--ease-spring) both;
        }
        .sidebar.collapsed .sb-menu {
          left: calc(100% + 12px); right: auto; bottom: 10px; width: 210px;
        }

        .sb-menu-head { display:flex; align-items:center; gap:10px; padding:8px 8px 10px; }
        .sb-menu-avatar { width:36px; height:36px; }
        .sb-menu-id { overflow:hidden; }
        .sb-menu-name  { font-size:13px; font-weight:700; color:#f1f5f9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .sb-menu-email { font-size:11px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
        .sb-menu-sep { height:1px; background:rgba(255,255,255,0.08); margin:2px 4px 6px; }

        .sb-menu-item {
          display:flex; align-items:center; gap:11px; width:100%;
          padding:9px 10px; border:none; background:transparent; border-radius:8px;
          color:#cbd5e1; font-size:13px; font-weight:500; font-family:'Inter',sans-serif;
          cursor:pointer; text-align:left;
          transition: background-color 130ms ease, color 130ms ease, transform 120ms var(--ease-spring);
        }
        .sb-menu-item:hover { background: rgba(255,255,255,0.06); color:#f1f5f9; }
        .sb-menu-item:active { transform: scale(0.98); }
        .sb-menu-item.danger { color:#f87171; }
        .sb-menu-item.danger:hover { background: rgba(239,68,68,0.12); color:#fca5a5; }

        @media (max-width:768px) { .sidebar { transform:translateX(-100%); } }

        @media (prefers-reduced-motion:reduce) {
          .sb-header,.sb-footer,.sb-item,.sb-section,.sb-menu { animation:none !important; }
          .sb-indicator { transition:opacity 200ms ease !important; }
        }
      `}</style>

      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${menuOpen ? "menu-open" : ""}`}>

        {/* Header */}
        <div className="sb-header">
          <div className="sb-logo-icon"><LogoIcon /></div>
          <span className="sb-logo-text">Slide<span>Geste</span></span>
        </div>

        {/* Navigation */}
        <nav className="sb-nav" ref={navRef}>
          <div
            className="sb-indicator"
            aria-hidden="true"
            style={{
              transform: `translateY(${indicator.top}px)`,
              height: indicator.height,
              opacity: indicator.ready ? 1 : 0,
            }}
          />
          {NAV_SECTIONS.map((section) => (
            <div className="sb-group" key={section.title}>
              <div className="sb-section">{section.title}</div>
              {section.items.map((item) => {
                const delay = 120 + runningIndex * 45;
                runningIndex += 1;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => { itemRefs.current[item.id] = el; }}
                    className={`sb-item ${isActive ? "active" : ""}`}
                    style={{ animationDelay: `${delay}ms` }}
                    onClick={() => onNavClick(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sb-item-icon"><Icon name={item.icon} size={16} /></span>
                    <span className="sb-item-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer — carte compte + menu */}
        <div className="sb-footer" ref={footerRef}>

          {menuOpen && (
            <div className="sb-menu" role="menu">
              
              <div className="sb-menu-sep" />
              <button
                className="sb-menu-item"
                role="menuitem"
                onClick={() => { onNavClick("settings"); setMenuOpen(false); }}
              >
                <Icon name="settings" size={16} />
                <span>Paramètres</span>
              </button>
              <button
                className="sb-menu-item danger"
                role="menuitem"
                onClick={() => { onSignOut?.(); setMenuOpen(false); }}
              >
                <Icon name="logout" size={16} stroke={2.2} />
                <span>Déconnexion</span>
              </button>
            </div>
          )}

          <button
            className={`sb-user ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={collapsed ? userName : undefined}
          >
            <div className="sb-avatar">
              {userInitial}
              <span className="sb-status" aria-hidden="true" />
            </div>
            <div className="sb-user-info">
              <p className="sb-user-name">{userName}</p>
              <p className="sb-user-email">{userEmail}</p>
            </div>
            <span className="sb-user-chevron"><Icon name="chevron-up" size={15} /></span>
          </button>
        </div>
      </aside>
    </>
  );
}