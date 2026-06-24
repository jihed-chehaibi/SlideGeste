import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Settings from "../components/Settings";
import Gestures from "../components/Gestures";
import Camera from "../components/Camera";
import Presentations from "../components/Presentations";
import Sidebar from "../components/Sidebar";
import { Icon } from "../components/Icon";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

const sessionData = [
  { jour: "Lun", sessions: 3 }, { jour: "Mar", sessions: 5 },
  { jour: "Mer", sessions: 2 }, { jour: "Jeu", sessions: 8 },
  { jour: "Ven", sessions: 6 }, { jour: "Sam", sessions: 4 },
  { jour: "Dim", sessions: 7 },
];
const gestureData = [
  { geste: "Suivant",   count: 142 }, { geste: "Précédent", count: 98 },
  { geste: "Zoom",      count: 64  }, { geste: "Pause",     count: 45 },
  { geste: "Fin",       count: 23  },
];
const recentPresentations = [
  { name: "Présentation Q2 2025",  slides: 24, date: "Aujourd'hui, 14h30", status: "Terminée"  },
  { name: "Pitch investisseurs",   slides: 18, date: "Hier, 10h15",        status: "Terminée"  },
  { name: "Formation équipe RH",   slides: 32, date: "12 Jan 2025",        status: "En cours"  },
  { name: "Rapport annuel 2024",   slides: 45, date: "10 Jan 2025",        status: "Terminée"  },
];

const NAV_LABELS = {
  dashboard:     "Dashboard",
  presentations: "Mes Présentations",
  gestures:      "Gestes",
  camera:        "Caméra",
  settings:      "Paramètres",
};

function Dashboard() {
  const [activeNav,   setActiveNav]   = useState("dashboard");
  const [user,        setUser]        = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pageKey,     setPageKey]     = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/signin");
      else setUser(data.user);
    });
  }, [navigate]);

  const handleNav = (id) => { setActiveNav(id); setPageKey((k) => k + 1); };
  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/signin"); };

  const userName    = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Utilisateur";
  const userEmail   = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        :root {
          --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
          --ease-sidebar:    cubic-bezier(0.32, 0.72, 0, 1);
        }

        @keyframes pageEnter { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }

        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Inter', 'Plus Jakarta Sans', sans-serif; background:#f1f5f9; color:#0f172a; }
        .dashboard-layout { display:flex; min-height:100vh; }

        /* ══ MAIN ══ */
        .main-content {
          margin-left: 248px; flex:1;
          display: flex; flex-direction: column;
          transition: margin-left 280ms var(--ease-sidebar);
          min-height: 100vh;
        }
        .main-content.collapsed { margin-left: 72px; }

        .topbar {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #e2e8f0;
          padding: 0 1.75rem; height: 68px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top:0; z-index:50; gap:16px;
        }
        .topbar-left  { display:flex; align-items:center; gap:14px; flex:1; }
        .topbar-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }

        .toggle-btn {
          width: 36px; height: 36px; border-radius: 9px;
          border: 1px solid #e2e8f0; background: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #64748b;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          transition: background-color 140ms var(--ease-out-strong), color 140ms var(--ease-out-strong), transform 100ms var(--ease-out-strong);
        }
        @media (hover:hover) and (pointer:fine) {
          .toggle-btn:hover { background:#f8fafc; color:#0f172a; border-color:#cbd5e1; }
        }
        .toggle-btn:active { transform: scale(0.92); }

        .topbar-breadcrumb { display:flex; align-items:center; gap:8px; }
        .breadcrumb-root    { font-size:13px; color:#94a3b8; font-weight:500; font-family:'Inter',sans-serif; }
        .breadcrumb-sep     { color:#e2e8f0; }
        .breadcrumb-current { font-size:13px; font-weight:700; color:#0f172a; font-family:'Inter',sans-serif; }

        .topbar-search {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 9px; padding: 0 12px; height: 36px;
          max-width: 260px; flex:1; cursor:text; color:#94a3b8;
          transition: border-color 140ms var(--ease-out-strong), background-color 140ms var(--ease-out-strong), box-shadow 140ms var(--ease-out-strong);
        }
        .topbar-search:focus-within { border-color:#3b82f6; background:#fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .topbar-search span { font-size:12px; color:#94a3b8; font-weight:500; font-family:'Inter',sans-serif; }

        .btn-start {
          background: #0f172a; color: #fff;
          border: none; border-radius: 9px;
          padding: 0 16px; height: 36px;
          font-size: 12.5px; font-weight: 600; font-family: 'Inter', sans-serif;
          cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap;
          box-shadow: 0 2px 8px rgba(15,23,42,0.2);
          transition: background-color 160ms var(--ease-out-strong), transform 140ms var(--ease-out-strong), box-shadow 160ms var(--ease-out-strong);
        }
        @media (hover:hover) and (pointer:fine) {
          .btn-start:hover { background: #1e293b; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(15,23,42,0.25); }
        }
        .btn-start:active { transform: scale(0.97); box-shadow: none; transition: transform 80ms var(--ease-out-strong), box-shadow 80ms var(--ease-out-strong); }
        .btn-start-pulse { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; flex-shrink:0; }
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0   rgba(34,197,94,0.6); }
          70%  { box-shadow: 0 0 0 5px rgba(34,197,94,0);   }
          100% { box-shadow: 0 0 0 0   rgba(34,197,94,0);   }
        }

        .topbar-icon-btn {
          width: 36px; height: 36px; border-radius: 9px;
          border: 1px solid #e2e8f0; background: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #64748b; position: relative;
          transition: background-color 140ms var(--ease-out-strong), color 140ms var(--ease-out-strong), transform 100ms var(--ease-out-strong);
        }
        @media (hover:hover) and (pointer:fine) {
          .topbar-icon-btn:hover { background:#f8fafc; color:#0f172a; border-color:#cbd5e1; }
        }
        .topbar-icon-btn:active { transform: scale(0.92); }
        .notif-dot { position: absolute; top:7px; right:7px; width: 7px; height: 7px; border-radius: 50%; background: #ef4444; border: 2px solid #fff; }
        .topbar-divider { width:1px; height:22px; background:#e2e8f0; margin:0 2px; flex-shrink:0; }

        .btn-signout {
          background: transparent; border: none;
          padding: 0 8px; font-size: 12.5px; font-weight: 600;
          color: #64748b; font-family: 'Inter', sans-serif;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          transition: color 120ms var(--ease-out-strong);
        }
        @media (hover:hover) and (pointer:fine) {
          .btn-signout:hover { color: #ef4444; }
        }

        /* ── PAGE BODY ── */
        .page-body { padding: 1.75rem; max-width: 1400px; margin: 0 auto; width: 100%; }

        /* ── WELCOME BANNER ── */
        .welcome-banner {
          background: linear-gradient(120deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%);
          border-radius: 16px; padding: 1.75rem 2rem; margin-bottom: 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 20px -4px rgba(37,99,235,0.3);
          opacity: 0; animation: fadeUp 340ms var(--ease-out-strong) 40ms both;
        }
        .welcome-banner::before { content:''; position:absolute; width:260px; height:260px; border-radius:50%; background: rgba(255,255,255,0.06); top:-80px; right:60px; pointer-events:none; }
        .welcome-banner::after  { content:''; position:absolute; width:120px; height:120px; border-radius:50%; background: rgba(255,255,255,0.04); bottom:-40px; left:25%; pointer-events:none; }
        .welcome-text { position:relative; z-index:1; }
        .welcome-text h2 { font-size:22px; font-weight:700; color:#fff; margin-bottom:5px; letter-spacing:-0.02em; }
        .welcome-text p  { font-size:14px; color:rgba(255,255,255,0.8); font-weight:500; }
        .welcome-icon {
          position:relative; z-index:1;
          width:84px; height:84px; border-radius:20px;
          display:flex; align-items:center; justify-content:center;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          color:#ffffff; flex-shrink:0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
        }

        /* ── KPI GRID ── */
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.1rem; margin-bottom: 1.5rem; }
        .kpi-card {
          background: #fff; border-radius: 14px; padding: 1.25rem;
          border: 1px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          display: flex; flex-direction: column; gap: 12px;
          opacity:0; animation: fadeUp 320ms var(--ease-out-strong) both;
          transition: transform 180ms var(--ease-out-strong), box-shadow 180ms var(--ease-out-strong);
        }
        .kpi-card:nth-child(1){animation-delay:80ms}
        .kpi-card:nth-child(2){animation-delay:120ms}
        .kpi-card:nth-child(3){animation-delay:160ms}
        .kpi-card:nth-child(4){animation-delay:200ms}
        @media (hover:hover) and (pointer:fine) {
          .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.05); }
        }
        .kpi-top   { display:flex; align-items:flex-start; justify-content:space-between; }
        .kpi-icon  { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
        .kpi-badge { font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px; letter-spacing:0.02em; }
        .badge-green  { background:#dcfce7; color:#166534; }
        .badge-blue   { background:#dbeafe; color:#1e40af; }
        .badge-orange { background:#ffedd5; color:#9a3412; }
        .kpi-value { font-size:26px; font-weight:800; color:#0f172a; line-height:1; letter-spacing:-0.03em; }
        .kpi-label { font-size:12px; color:#64748b; font-weight:600; font-family:'Inter',sans-serif; }

        /* ── CHARTS ROW ── */
        .charts-row { display:grid; grid-template-columns: 1.7fr 1fr; gap:1.25rem; margin-bottom:1.5rem; }
        .chart-card {
          background:#fff; border-radius:14px; padding:1.5rem;
          border:1px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          opacity:0; animation: fadeUp 320ms var(--ease-out-strong) both;
          transition: transform 180ms var(--ease-out-strong), box-shadow 180ms var(--ease-out-strong);
        }
        .chart-card:nth-of-type(1){animation-delay:260ms}
        .chart-card:nth-of-type(2){animation-delay:300ms}
        @media (hover:hover) and (pointer:fine) {
          .chart-card:hover { transform:translateY(-2px); box-shadow:0 8px 16px rgba(0,0,0,0.04); }
        }
        .card-header-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; }
        .card-title { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:2px; font-family:'Inter',sans-serif; }
        .card-sub   { font-size:11px; color:#94a3b8; font-weight:500; font-family:'Inter',sans-serif; }

        /* ── TABLE CARD ── */
        .table-card {
          background:#fff; border-radius:14px; padding:1.5rem;
          border:1px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          opacity:0; animation: fadeUp 320ms var(--ease-out-strong) 340ms both;
          transition: box-shadow 180ms var(--ease-out-strong);
        }
        @media (hover:hover) and (pointer:fine) { .table-card:hover { box-shadow: 0 8px 16px rgba(0,0,0,0.04); } }
        .pres-table { width:100%; border-collapse:collapse; margin-top:0.5rem; }
        .pres-table th {
          font-size:10px; font-weight:700; color:#94a3b8;
          text-transform:uppercase; letter-spacing:0.1em;
          padding:0 14px 12px; text-align:left;
          border-bottom:1px solid #f1f5f9; font-family:'Inter',sans-serif;
        }
        .pres-table td {
          padding:14px; font-size:13px; color:#334155;
          border-bottom:1px solid #f8fafc; vertical-align:middle;
          font-weight:500; font-family:'Inter',sans-serif;
          transition: background-color 120ms var(--ease-out-strong);
        }
        .pres-table tr:last-child td { border-bottom:none; }
        @media (hover:hover) and (pointer:fine) { .pres-table tr:hover td { background:#f8fafc; cursor:pointer; } }
        .pres-name { font-weight:700; color:#0f172a; display:flex; align-items:center; gap:9px; }
        .pres-name-icon { color:#3b82f6; display:flex; flex-shrink:0; }

        .status-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; display:inline-block; }
        .status-done    { background:#dcfce7; color:#166534; border:1px solid #bbf7d0; }
        .status-ongoing { background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe; }

        .btn-voir-tout {
          font-size:12px; color:#3b82f6; background:rgba(59,130,246,0.08);
          padding:5px 12px; border-radius:7px; border:none; cursor:pointer; font-weight:600; font-family:'Inter',sans-serif;
          transition: background-color 140ms var(--ease-out-strong), transform 100ms var(--ease-out-strong);
        }
        @media (hover:hover) and (pointer:fine) { .btn-voir-tout:hover { background:rgba(59,130,246,0.15); } }
        .btn-voir-tout:active { transform:scale(0.95); }

        .placeholder-page {
          display:flex; align-items:center; justify-content:center;
          height:60vh; flex-direction:column; gap:16px; color:#94a3b8;
          opacity:0; animation: fadeUp 300ms var(--ease-out-strong) both; font-family:'Inter',sans-serif;
        }

        @media (max-width:1024px) { .charts-row { grid-template-columns:1fr; } }
        @media (max-width:768px)  { .main-content { margin-left:0 !important; } }
        @media (prefers-reduced-motion:reduce) {
          .welcome-banner,.kpi-card,.chart-card,.table-card,.placeholder-page {
            animation:none !important; opacity:1 !important; transform:none !important;
          }
        }
      `}</style>

      <div className="dashboard-layout">

        {/* ══ SIDEBAR (composant extrait) ══ */}
        <Sidebar
          collapsed={!sidebarOpen}
          activeNav={activeNav}
          onNavClick={handleNav}
          onSignOut={handleSignOut}
          userName={userName}
          userEmail={userEmail}
          userInitial={userInitial}
        />

        {/* ══ MAIN ══ */}
        <div className={`main-content ${sidebarOpen ? "" : "collapsed"}`}>

          <header className="topbar">
            <div className="topbar-left">
              <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Réduire le menu">
                <Icon name="panel-left" size={18} />
              </button>
              <div className="topbar-breadcrumb">
                <span className="breadcrumb-root">SlideGeste</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{NAV_LABELS[activeNav]}</span>
              </div>
            </div>
            <div className="topbar-right">
              <div className="topbar-search">
                <Icon name="search" size={15} />
                <span>Rechercher...</span>
              </div>
              <button className="btn-start">
                <span className="btn-start-pulse" />
                Démarrer session
              </button>
              <div className="topbar-divider" />
              <button className="topbar-icon-btn" title="Notifications">
                <Icon name="bell" size={17} />
                <span className="notif-dot" />
              </button>
              <button className="topbar-icon-btn" title="Aide">
                <Icon name="help" size={17} />
              </button>
              <div className="topbar-divider" />
              <button className="btn-signout" onClick={handleSignOut}>
                <Icon name="logout" size={15} stroke={2.2} />
                Déconnexion
              </button>
            </div>
          </header>

          <main className="page-body" key={pageKey}>

            {activeNav === "settings"      && <Settings user={user} />}
            {activeNav === "gestures"      && <Gestures />}
            {activeNav === "camera"        && <Camera />}
            {activeNav === "presentations" && <Presentations />}

            {activeNav === "dashboard" && (
              <>
                <div className="welcome-banner">
                  <div className="welcome-text">
                    <h2>Bonjour, {userName} 👋</h2>
                    <p>Prêt à contrôler votre prochaine présentation par gestes ?</p>
                  </div>
                  <div className="welcome-icon" aria-hidden="true">
                    <Icon name="hand" size={44} stroke={1.7} />
                  </div>
                </div>

                <div className="kpi-grid">
                  {[
                    { icon:"presentation", bg:"#eff6ff", color:"#2563eb", label:"Présentations",     value:"12",     badge:"+2 ce mois", badgeClass:"badge-blue"   },
                    { icon:"hand",         bg:"#f0fdf4", color:"#16a34a", label:"Gestes détectés",   value:"1 284",  badge:"+18%",       badgeClass:"badge-green"  },
                    { icon:"clock",        bg:"#fff7ed", color:"#ea580c", label:"Temps de contrôle", value:"4h 32m", badge:"Cette sem.", badgeClass:"badge-orange" },
                    { icon:"check-circle", bg:"#f0fdf4", color:"#16a34a", label:"Précision gestes",  value:"94%",    badge:"+3%",        badgeClass:"badge-green"  },
                  ].map((kpi, i) => (
                    <div className="kpi-card" key={i}>
                      <div className="kpi-top">
                        <div className="kpi-icon" style={{ background: kpi.bg, color: kpi.color }}>
                          <Icon name={kpi.icon} size={20} />
                        </div>
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
                    <ResponsiveContainer width="100%" height={230}>
                      <LineChart data={sessionData} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="jour" tick={{ fontSize:11, fill:"#94a3b8", fontWeight:500, fontFamily:"Inter" }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis tick={{ fontSize:11, fill:"#94a3b8", fontWeight:500, fontFamily:"Inter" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius:10, fontSize:12, border:"none", boxShadow:"0 8px 16px rgba(0,0,0,0.08)", fontWeight:600, fontFamily:"Inter" }} cursor={{ stroke:"#e2e8f0", strokeWidth:2 }} />
                        <Line type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={3} dot={{ r:3.5, fill:"#fff", stroke:"#2563eb", strokeWidth:2 }} activeDot={{ r:5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-card">
                    <div className="card-header-row">
                      <div>
                        <p className="card-title">Gestes utilisés</p>
                        <p className="card-sub">Top 5 de la semaine</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={gestureData} layout="vertical" margin={{ top:0, right:8, left:8, bottom:0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize:11, fill:"#94a3b8", fontFamily:"Inter" }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="geste" type="category" tick={{ fontSize:11, fill:"#64748b", fontWeight:600, fontFamily:"Inter" }} axisLine={false} tickLine={false} width={68} />
                        <Tooltip contentStyle={{ borderRadius:10, fontSize:12, border:"none", boxShadow:"0 8px 16px rgba(0,0,0,0.08)", fontWeight:600, fontFamily:"Inter" }} cursor={{ fill:"#f8fafc" }} />
                        <Bar dataKey="count" fill="#2563eb" radius={[0,5,5,0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="table-card">
                  <div className="card-header-row">
                    <div>
                      <p className="card-title">Présentations récentes</p>
                      <p className="card-sub">Vos dernières sessions de contrôle gestuel</p>
                    </div>
                    <button className="btn-voir-tout" onClick={() => handleNav("presentations")}>
                      Voir tout →
                    </button>
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table className="pres-table">
                      <thead>
                        <tr>
                          <th>Nom de la présentation</th>
                          <th>Slides</th>
                          <th>Dernière session</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPresentations.map((p, i) => (
                          <tr key={i}>
                            <td>
                              <span className="pres-name">
                                <span className="pres-name-icon"><Icon name="folder" size={16} /></span>
                                {p.name}
                              </span>
                            </td>
                            <td><span style={{ color:"#94a3b8", fontWeight:600 }}>{p.slides} slides</span></td>
                            <td><span style={{ color:"#94a3b8", fontWeight:500 }}>{p.date}</span></td>
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
                </div>
              </>
            )}

            {activeNav === "stats" && (
              <div className="placeholder-page">
                <Icon name="bar-chart" size={52} stroke={1.6} />
                <p style={{ fontSize:18, fontWeight:700, color:"#0f172a" }}>Analytiques détaillées</p>
                <p style={{ fontSize:14, fontWeight:500 }}>Bientôt disponible.</p>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}

export default Dashboard;