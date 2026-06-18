import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/Logo2.png";
import Settings from "../components/Settings";
import Presentations from "../components/Presentations";
import Gestures from "../components/Gestures";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts"; 
import Camera from "../components/Camera";



const sessionData = [
  { jour: "Lun", sessions: 3 },
  { jour: "Mar", sessions: 5 },
  { jour: "Mer", sessions: 2 },
  { jour: "Jeu", sessions: 8 },
  { jour: "Ven", sessions: 6 },
  { jour: "Sam", sessions: 4 },
  { jour: "Dim", sessions: 7 },
];

const gestureData = [
  { geste: "Suivant", count: 142 },
  { geste: "Précédent", count: 98 },
  { geste: "Zoom", count: 64 },
  { geste: "Pause", count: 45 },
  { geste: "Fin", count: 23 },
];

const recentPresentations = [
  { name: "Présentation Q2 2025", slides: 24, date: "Aujourd'hui, 14h30", status: "Terminée" },
  { name: "Pitch investisseurs", slides: 18, date: "Hier, 10h15", status: "Terminée" },
  { name: "Formation équipe RH", slides: 32, date: "12 Jan 2025", status: "En cours" },
  { name: "Rapport annuel 2024", slides: 45, date: "10 Jan 2025", status: "Terminée" },
];

const navItems = [
  { icon: "📊", label: "Dashboard",         id: "dashboard" },
  { icon: "🖥️", label: "Mes Présentations", id: "presentations" },
  { icon: "🤚", label: "Gestes",            id: "gestures" },
  { icon: "📷", label: "Caméra",            id: "camera" },
  { icon: "📈", label: "Statistiques",      id: "stats" },
  { icon: "⚙️", label: "Paramètres",        id: "settings" },
];

function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/signin");
      else setUser(data.user);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Utilisateur";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f4f6fb; }
        .dashboard-layout { display: flex; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── SIDEBAR ── */
        .sidebar { width: 256px; background: #0b1f45; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; transition: width 0.25s cubic-bezier(.4,0,.2,1); overflow: hidden; }
        .sidebar.collapsed { width: 68px; }
        .sidebar-logo { padding: 0 1rem; height: 64px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
        .sidebar-logo img { width: 32px; height: 32px; object-fit: contain; filter: brightness(0) invert(1); flex-shrink: 0; }
        .sidebar-logo-text { font-size: 15px; font-weight: 700; color: #fff; white-space: nowrap; opacity: 1; transition: opacity 0.15s; letter-spacing: -0.01em; }
        .sidebar.collapsed .sidebar-logo-text { opacity: 0; pointer-events: none; }
        .nav-section-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.1em; padding: 1.25rem 1.1rem 0.4rem; white-space: nowrap; overflow: hidden; transition: opacity 0.15s; }
        .sidebar.collapsed .nav-section-label { opacity: 0; }
        .sidebar-nav { flex: 1; padding: 0.5rem 0.6rem; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; overflow-x: hidden; }
        .sidebar-nav::-webkit-scrollbar { width: 0; }
        .nav-item { display: flex; align-items: center; gap: 11px; padding: 9px 11px; border-radius: 9px; cursor: pointer; color: rgba(255,255,255,0.52); font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; border: none; background: transparent; width: 100%; text-align: left; transition: background 0.15s, color 0.15s; position: relative; }
        .nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.88); }
        .nav-item.active { background: rgba(255,255,255,0.12); color: #fff; }
        .nav-item.active::before { content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px; border-radius: 0 3px 3px 0; background: #4da3ff; }
        .nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; opacity: 0.85; }
        .nav-item.active .nav-icon { opacity: 1; }
        .nav-label { overflow: hidden; transition: opacity 0.15s; flex: 1; }
        .sidebar.collapsed .nav-label { opacity: 0; width: 0; }
        .nav-badge { background: #4da3ff; color: #fff; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 20px; flex-shrink: 0; transition: opacity 0.15s; }
        .sidebar.collapsed .nav-badge { opacity: 0; }
        .sidebar-footer { padding: 0.75rem 0.6rem 1rem; border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
        .user-card { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 9px; background: rgba(255,255,255,0.06); cursor: pointer; overflow: hidden; transition: background 0.15s; }
        .user-card:hover { background: rgba(255,255,255,0.1); }
        .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4da3ff, #1a5faa); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; border: 1.5px solid rgba(255,255,255,0.2); }
        .user-info { overflow: hidden; flex: 1; }
        .user-name { font-size: 12.5px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-email { font-size: 10.5px; color: rgba(255,255,255,0.42); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar.collapsed .user-info { display: none; }
        .user-menu-icon { color: rgba(255,255,255,0.35); font-size: 15px; flex-shrink: 0; transition: opacity 0.15s; }
        .sidebar.collapsed .user-menu-icon { opacity: 0; width: 0; }

        /* ── MAIN CONTENT ── */
        .main-content { margin-left: 256px; flex: 1; display: flex; flex-direction: column; transition: margin-left 0.25s cubic-bezier(.4,0,.2,1); background: #f4f6fb; min-height: 100vh; }
        .main-content.collapsed { margin-left: 68px; }

        /* ── TOPBAR ── */
        .topbar { background: #fff; border-bottom: 1px solid #e8ecf4; padding: 0 1.5rem; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; gap: 12px; }
        .topbar-left { display: flex; align-items: center; gap: 14px; flex: 1; }
        .toggle-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e8ecf4; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7280; transition: background 0.15s, color 0.15s, border-color 0.15s; flex-shrink: 0; font-size: 16px; }
        .toggle-btn:hover { background: #f4f6fb; color: #0b1f45; border-color: #c9d3e8; }
        .topbar-breadcrumb { display: flex; align-items: center; gap: 6px; }
        .breadcrumb-root { font-size: 13px; color: #9ca3af; font-weight: 500; }
        .breadcrumb-sep { color: #d1d5db; font-size: 13px; }
        .breadcrumb-current { font-size: 14px; font-weight: 700; color: #0b1f45; }
        .topbar-search { display: flex; align-items: center; gap: 8px; background: #f4f6fb; border: 1px solid #e8ecf4; border-radius: 9px; padding: 0 12px; height: 36px; max-width: 260px; flex: 1; cursor: text; transition: border-color 0.15s, background 0.15s; }
        .topbar-search:hover { border-color: #c9d3e8; background: #eef1f8; }
        .topbar-search span { font-size: 12.5px; color: #9ca3af; }
        .topbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .topbar-icon-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e8ecf4; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 16px; transition: background 0.15s, color 0.15s; position: relative; font-family: 'Plus Jakarta Sans', sans-serif; }
        .topbar-icon-btn:hover { background: #f4f6fb; color: #0b1f45; }
        .notif-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: #ef4444; border: 1.5px solid #fff; }
        .topbar-divider { width: 1px; height: 22px; background: #e8ecf4; margin: 0 4px; flex-shrink: 0; }
        .btn-start { background: #0b1f45; color: #fff; border: none; border-radius: 9px; padding: 0 16px; height: 36px; font-size: 13px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: background 0.15s, transform 0.1s; white-space: nowrap; }
        .btn-start:hover { background: #1a3a6e; transform: translateY(-1px); }
        .btn-start:active { transform: scale(0.97); }
        .btn-start-pulse { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 0 rgba(74,222,128,0.5); animation: pulse 1.8s infinite; flex-shrink: 0; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); } 70% { box-shadow: 0 0 0 5px rgba(74,222,128,0); } 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); } }
        .topbar-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #4da3ff, #0b1f45); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; cursor: pointer; border: 2px solid #e8ecf4; transition: border-color 0.15s; }
        .topbar-avatar:hover { border-color: #4da3ff; }
        .btn-signout { background: transparent; border: none; padding: 0 6px; font-size: 12px; font-weight: 500; color: #9ca3af; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; transition: color 0.15s; display: flex; align-items: center; gap: 5px; }
        .btn-signout:hover { color: #ef4444; }

        /* ── PAGE BODY ── */
        .page-body { padding: 1.75rem; }

        /* ── WELCOME BANNER ── */
        .welcome-banner { background: linear-gradient(135deg, #0f346d 0%, #1a5faa 60%, #1e78c8 100%); border-radius: 16px; padding: 1.5rem 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
        .welcome-banner::before { content: ''; position: absolute; width: 220px; height: 220px; border-radius: 50%; background: rgba(255,255,255,0.06); top: -60px; right: 80px; }
        .welcome-banner::after { content: ''; position: absolute; width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,0.04); bottom: -40px; right: 20px; }
        .welcome-text h2 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .welcome-text p { font-size: 13px; color: rgba(255,255,255,0.65); }
        .welcome-emoji { font-size: 48px; position: relative; z-index: 1; }

        /* ── KPI CARDS ── */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .kpi-card { background: #fff; border-radius: 14px; padding: 1.25rem; border: 1px solid #e8ecf4; display: flex; flex-direction: column; gap: 10px; }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; }
        .kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .kpi-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-blue  { background: #dbeafe; color: #1e40af; }
        .badge-orange{ background: #ffedd5; color: #9a3412; }
        .kpi-value { font-size: 26px; font-weight: 700; color: #0f346d; line-height: 1; }
        .kpi-label { font-size: 12px; color: #9ca3af; font-weight: 500; }

        /* ── CHARTS ROW ── */
        .charts-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .chart-card { background: #fff; border-radius: 14px; padding: 1.25rem; border: 1px solid #e8ecf4; }
        .card-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .card-title { font-size: 14px; font-weight: 700; color: #0f346d; }
        .card-sub   { font-size: 11.5px; color: #9ca3af; }

        /* ── TABLE ── */
        .table-card { background: #fff; border-radius: 14px; padding: 1.25rem; border: 1px solid #e8ecf4; }
        .pres-table { width: 100%; border-collapse: collapse; }
        .pres-table th { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 12px 10px; text-align: left; border-bottom: 1px solid #e8ecf4; }
        .pres-table td { padding: 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #f4f6fb; vertical-align: middle; }
        .pres-table tr:last-child td { border-bottom: none; }
        .pres-table tr:hover td { background: #f9fafb; }
        .pres-name { font-weight: 600; color: #111827; }
        .status-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
        .status-done    { background: #d1fae5; color: #065f46; }
        .status-ongoing { background: #dbeafe; color: #1e40af; }

        @media (max-width: 992px) { .kpi-grid { grid-template-columns: repeat(2,1fr); } .charts-row { grid-template-columns: 1fr; } }
        @media (max-width: 576px) { .kpi-grid { grid-template-columns: 1fr; } .sidebar { display: none; } .main-content { margin-left: 0 !important; } }
      `}</style>

      <div className="dashboard-layout">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-logo">
            <img src={logo} alt="SlideGeste" />
            <span className="sidebar-logo-text">SlideGeste</span>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Principal</div>
            {[
              { icon: "📊", label: "Dashboard",         id: "dashboard" },
              { icon: "🖥️", label: "Mes Présentations", id: "presentations", badge: "3" },
            ].map((item) => (
              <button key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)} title={item.label}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}

            <div className="nav-section-label">Contrôle</div>
            {[
              { icon: "🤚", label: "Gestes", id: "gestures" },
              { icon: "📷", label: "Caméra", id: "camera" },
            ].map((item) => (
              <button key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)} title={item.label}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}

            <div className="nav-section-label">Analyse</div>
            {[
              { icon: "📈", label: "Statistiques", id: "stats" },
            ].map((item) => (
              <button key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)} title={item.label}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}

            <div className="nav-section-label">Compte</div>
            {[
              { icon: "⚙️", label: "Paramètres", id: "settings" },
            ].map((item) => (
              <button key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)} title={item.label}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-info">
                <p className="user-name">{userName}</p>
                <p className="user-email">{userEmail}</p>
              </div>
              <span className="user-menu-icon">⋯</span>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className={`main-content ${sidebarOpen ? "" : "collapsed"}`}>

          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">☰</button>
              <div className="topbar-breadcrumb">
                <span className="breadcrumb-root">SlideGeste</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">
                  {navItems.find((n) => n.id === activeNav)?.label}
                </span>
              </div>
              <div className="topbar-search">
                <i>🔍</i>
                <span>Rechercher...</span>
              </div>
            </div>
            <div className="topbar-right">
              <button className="btn-start">
                <span className="btn-start-pulse" />
                Démarrer session
              </button>
              <div className="topbar-divider" />
              <button className="topbar-icon-btn" title="Notifications">
                🔔<span className="notif-dot" />
              </button>
              <button className="topbar-icon-btn" title="Aide">❓</button>
              <div className="topbar-divider" />
              <div className="topbar-avatar" title={userName}>{userInitial}</div>
              <button className="btn-signout" onClick={handleSignOut}>Déconnexion</button>
            </div>
          </header>

          {/* ── PAGE BODY : routing interne ── */}
          <main className="page-body">

            
            {activeNav === "settings" && <Settings user={user} />}
            {activeNav === "presentations" && <Presentations user={user} />}
            {activeNav === "gestures" && <Gestures  />}
            {activeNav === "camera" && <Camera />}
            {/* ── DASHBOARD HOME ── */}
            {activeNav === "dashboard" && (
              <>
                <div className="welcome-banner">
                  <div className="welcome-text">
                    <h2>Bonjour, {userName} 👋</h2>
                    <p>Prêt à contrôler votre prochaine présentation par gestes ?</p>
                  </div>
                  <div className="welcome-emoji">🤚</div>
                </div>

                <div className="kpi-grid">
                  {[
                    { icon: "🖥️", bg: "#eff6ff", label: "Présentations",   value: "12",     badge: "+2 ce mois",    badgeClass: "badge-blue"   },
                    { icon: "🤚", bg: "#f0fdf4", label: "Gestes détectés", value: "1 284",  badge: "+18%",          badgeClass: "badge-green"  },
                    { icon: "⏱️", bg: "#fff7ed", label: "Temps de contrôle", value: "4h 32m", badge: "Cette semaine", badgeClass: "badge-orange" },
                    { icon: "✅", bg: "#f0fdf4", label: "Précision gestes", value: "94%",    badge: "+3%",           badgeClass: "badge-green"  },
                  ].map((kpi, i) => (
                    <div className="kpi-card" key={i}>
                      <div className="kpi-top">
                        <div className="kpi-icon" style={{ background: kpi.bg }}>{kpi.icon}</div>
                        <span className={`kpi-badge ${kpi.badgeClass}`}>{kpi.badge}</span>
                      </div>
                      <div className="kpi-value">{kpi.value}</div>
                      <div className="kpi-label">{kpi.label}</div>
                    </div>
                  ))}
                </div>

                <div className="charts-row">
                  <div className="chart-card">
                    <div className="card-header-row">
                      <div>
                        <p className="card-title">Sessions par jour</p>
                        <p className="card-sub">7 derniers jours</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={sessionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="jour" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #e8ecf4" }} />
                        <Line type="monotone" dataKey="sessions" stroke="#1a5faa" strokeWidth={2.5} dot={{ r: 4, fill: "#1a5faa" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-card">
                    <div className="card-header-row">
                      <div>
                        <p className="card-title">Gestes utilisés</p>
                        <p className="card-sub">Top 5</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={gestureData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="geste" type="category" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={55} />
                        <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #e8ecf4" }} />
                        <Bar dataKey="count" fill="#1a5faa" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="table-card">
                  <div className="card-header-row">
                    <div>
                      <p className="card-title">Présentations récentes</p>
                      <p className="card-sub">Dernières sessions de contrôle</p>
                    </div>
                    <button onClick={() => setActiveNav("presentations")} style={{ fontSize: 12, color: "#1a5faa", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      Voir tout →
                    </button>
                  </div>
                  <table className="pres-table">
                    <thead>
                      <tr>
                        <th>Nom</th><th>Slides</th><th>Dernière session</th><th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPresentations.map((p, i) => (
                        <tr key={i}>
                          <td><span className="pres-name">🖥️ {p.name}</span></td>
                          <td>{p.slides} slides</td>
                          <td>{p.date}</td>
                          <td>
                            <span className={`status-badge ${p.status === "Terminée" ? "status-done" : "status-ongoing"}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            
            
            {activeNav === "camera" && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", flexDirection:"column", gap:12, color:"#9ca3af" }}>
                <span style={{ fontSize: 48 }}>📷</span>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#0b1f45" }}>Caméra</p>
                <p style={{ fontSize: 13 }}>Page en cours de développement</p>
              </div>
            )}
            {activeNav === "stats" && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", flexDirection:"column", gap:12, color:"#9ca3af" }}>
                <span style={{ fontSize: 48 }}>📈</span>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#0b1f45" }}>Statistiques</p>
                <p style={{ fontSize: 13 }}>Page en cours de développement</p>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}

export default Dashboard;