import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";

// Composant Settings à intégrer dans le Dashboard
// Dans Dashboard.jsx, remplace le contenu de <main className="page-body"> par :
// { activeNav === "settings" ? <Settings user={user} /> : /* ... reste du dashboard */ }

function Settings({ user }) {
  const [activeTab, setActiveTab] = useState("profile");

  const userName = user?.user_metadata?.full_name || "";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .settings-wrap {
          max-width: 860px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── PAGE HEADER ── */
        .settings-header {
          margin-bottom: 1.5rem;
        }
        .settings-header h1 {
          font-size: 20px;
          font-weight: 700;
          color: #0b1f45;
          margin-bottom: 4px;
        }
        .settings-header p {
          font-size: 13px;
          color: #9ca3af;
        }

        /* ── TABS ── */
        .settings-tabs {
          display: flex;
          gap: 2px;
          background: #fff;
          border: 1px solid #e8ecf4;
          border-radius: 12px;
          padding: 5px;
          margin-bottom: 1.5rem;
          width: fit-content;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .tab-btn:hover { background: #f4f6fb; color: #0b1f45; }
        .tab-btn.active {
          background: #0b1f45;
          color: #fff;
        }
        .tab-icon { font-size: 14px; }

        /* ── CARD ── */
        .settings-card {
          background: #fff;
          border: 1px solid #e8ecf4;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }

        .card-section-title {
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid #f0f2f8;
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .card-section-title h2 {
          font-size: 14px;
          font-weight: 700;
          color: #0b1f45;
          margin: 0;
        }
        .card-section-title p {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }
        .section-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: #eff6ff;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .card-body {
          padding: 1.5rem;
        }

        /* ── FORM ── */
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .form-row.single { grid-template-columns: 1fr; }

        .form-field { display: flex; flex-direction: column; gap: 6px; }

        .field-label {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .field-input {
          border: 1.5px solid #e5e7eb;
          border-radius: 9px;
          padding: 10px 13px;
          font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #111827;
          background: #f9fafb;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .field-input:focus {
          border-color: #1a5faa;
          box-shadow: 0 0 0 3px rgba(26,95,170,0.1);
          background: #fff;
        }
        .field-input:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }
        .field-input::placeholder { color: #9ca3af; }

        .field-hint {
          font-size: 11.5px;
          color: #9ca3af;
          margin-top: 2px;
        }

        /* ── AVATAR SECTION ── */
        .avatar-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #f0f2f8;
        }
        .avatar-big {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4da3ff, #0b1f45);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          font-weight: 700;
          flex-shrink: 0;
          border: 3px solid #e8ecf4;
          position: relative;
          overflow: hidden;
        }
        .avatar-big img {
          width: 100%; height: 100%; object-fit: cover;
          position: absolute; top: 0; left: 0;
        }
        .avatar-info h3 {
          font-size: 15px;
          font-weight: 700;
          color: #0b1f45;
          margin-bottom: 3px;
        }
        .avatar-info p {
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 10px;
        }
        .avatar-btns { display: flex; gap: 8px; }

        .btn-upload {
          background: #0b1f45;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 12.5px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-upload:hover { background: #1a3a6e; }

        .btn-remove {
          background: transparent;
          color: #6b7280;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 12.5px;
          font-weight: 500;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-remove:hover { border-color: #ef4444; color: #ef4444; }

        /* ── SAVE BUTTON ── */
        .btn-save {
          background: linear-gradient(135deg, #0b1f45, #1a5faa);
          color: #fff;
          border: none;
          border-radius: 9px;
          padding: 11px 24px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          display: flex; align-items: center; gap: 7px;
        }
        .btn-save:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-save:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── TOGGLE SWITCH ── */
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 0;
          border-bottom: 1px solid #f0f2f8;
        }
        .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
        .toggle-info h4 {
          font-size: 13.5px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 2px;
        }
        .toggle-info p {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .switch {
          position: relative;
          width: 40px; height: 22px;
          flex-shrink: 0;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .switch-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: #d1d5db;
          border-radius: 22px;
          transition: background 0.2s;
        }
        .switch-slider::before {
          content: '';
          position: absolute;
          width: 16px; height: 16px;
          left: 3px; top: 3px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .switch input:checked + .switch-slider { background: #1a5faa; }
        .switch input:checked + .switch-slider::before { transform: translateX(18px); }

        /* ── SELECT ── */
        .field-select {
          border: 1.5px solid #e5e7eb;
          border-radius: 9px;
          padding: 10px 13px;
          font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #111827;
          background: #f9fafb;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-select:focus {
          border-color: #1a5faa;
          box-shadow: 0 0 0 3px rgba(26,95,170,0.1);
          background-color: #fff;
        }

        /* ── PASSWORD STRENGTH ── */
        .pw-strength-wrap {
          height: 4px;
          background: #e5e7eb;
          border-radius: 99px;
          margin-top: 7px;
          overflow: hidden;
        }
        .pw-strength-bar {
          height: 100%;
          border-radius: 99px;
          transition: width 0.3s, background 0.3s;
        }
        .pw-strength-label {
          font-size: 11px;
          margin-top: 4px;
          font-weight: 500;
        }

        /* ── DANGER ZONE ── */
        .danger-card {
          background: #fff;
          border: 1.5px solid #fecaca;
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .danger-info h3 {
          font-size: 14px;
          font-weight: 700;
          color: #991b1b;
          margin-bottom: 3px;
        }
        .danger-info p {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }
        .btn-danger {
          background: transparent;
          color: #ef4444;
          border: 1.5px solid #fecaca;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .btn-danger:hover { background: #fef2f2; border-color: #ef4444; }

        /* ── SUCCESS ALERT ── */
        .alert-success {
          display: flex;
          align-items: center;
          gap: 9px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 9px;
          padding: 10px 14px;
          font-size: 13px;
          color: #166534;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        /* ── SESSION CARD ── */
        .session-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 12px 0;
          border-bottom: 1px solid #f0f2f8;
        }
        .session-item:last-child { border-bottom: none; }
        .session-icon {
          width: 36px; height: 36px;
          border-radius: 9px;
          background: #f4f6fb;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .session-info h4 { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
        .session-info p  { font-size: 11.5px; color: #9ca3af; margin: 0; }
        .session-badge {
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 20px;
          background: #d1fae5;
          color: #065f46;
        }
        .btn-revoke {
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          padding: 5px 11px;
          font-size: 11.5px;
          font-weight: 500;
          color: #6b7280;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-revoke:hover { border-color: #ef4444; color: #ef4444; }

        @media (max-width: 640px) {
          .form-row { grid-template-columns: 1fr; }
          .settings-tabs { flex-wrap: wrap; }
        }
      `}</style>

      <div className="settings-wrap">

        {/* Header */}
        <div className="settings-header">
          <h1>⚙️ Paramètres</h1>
          <p>Gérez votre profil, sécurité et préférences de l'application.</p>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          {[
            { id: "profile",     icon: "👤", label: "Profil" },
            { id: "security",    icon: "🔒", label: "Sécurité" },
            { id: "preferences", icon: "🎛️", label: "Préférences" },
          ].map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════ TAB PROFIL ══════════════════ */}
        {activeTab === "profile" && (
          <ProfileTab user={user} userInitial={userInitial} userName={userName} userEmail={userEmail} />
        )}

        {/* ══════════════════ TAB SÉCURITÉ ══════════════════ */}
        {activeTab === "security" && (
          <SecurityTab userEmail={userEmail} />
        )}

        {/* ══════════════════ TAB PRÉFÉRENCES ══════════════════ */}
        {activeTab === "preferences" && (
          <PreferencesTab />
        )}

      </div>
    </>
  );
}

/* ──────────────────────────────
   TAB 1 — PROFIL
────────────────────────────── */
function ProfileTab({ user, userInitial, userName, userEmail }) {
  const [fullName, setFullName]   = useState(userName);
  const [email, setEmail]         = useState(userEmail);
  const [phone, setPhone]         = useState(user?.user_metadata?.phone || "");
  const [bio, setBio]             = useState(user?.user_metadata?.bio || "");
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || null);
  const fileInputRef              = useRef();

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const { error } = await supabase.auth.updateUser({
      email,
      data: { full_name: fullName, phone, bio },
    });

    setLoading(false);
    if (error) { alert(error.message); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target.result);
    reader.readAsDataURL(file);
    // Pour uploader sur Supabase Storage :
    // const { data } = await supabase.storage.from('avatars').upload(`${user.id}.png`, file);
  };

  return (
    <>
      {success && (
        <div className="alert-success">✅ Profil mis à jour avec succès !</div>
      )}

      {/* Avatar */}
      <div className="settings-card">
        <div className="card-section-title">
          <div className="section-icon">🖼️</div>
          <div>
            <h2>Photo de profil</h2>
            <p>JPG, PNG ou GIF — 2 Mo max.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="avatar-row">
            <div className="avatar-big">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : userInitial}
            </div>
            <div className="avatar-info">
              <h3>{fullName || userEmail}</h3>
              <p>{userEmail}</p>
              <div className="avatar-btns">
                <button className="btn-upload" onClick={() => fileInputRef.current.click()}>
                  📤 Changer la photo
                </button>
                <button className="btn-remove" onClick={() => setAvatarUrl(null)}>
                  Supprimer
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Infos personnelles */}
      <div className="settings-card">
        <div className="card-section-title">
          <div className="section-icon">👤</div>
          <div>
            <h2>Informations personnelles</h2>
            <p>Vos informations publiques de profil.</p>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-field">
                <label className="field-label">Nom complet</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="field-label">Téléphone</label>
                <input
                  type="tel"
                  className="field-input"
                  placeholder="+33 6 00 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="field-label">Adresse email</label>
                <input
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="field-hint">⚠️ Modifier l'email envoie un lien de confirmation.</span>
              </div>
              <div className="form-field">
                <label className="field-label">Rôle</label>
                <input
                  type="text"
                  className="field-input"
                  value="Utilisateur"
                  disabled
                />
              </div>
            </div>
            <div className="form-row single">
              <div className="form-field">
                <label className="field-label">Biographie</label>
                <textarea
                  className="field-input"
                  placeholder="Quelques mots sur vous..."
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Sauvegarde...</>
              ) : "💾 Sauvegarder les modifications"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────
   TAB 2 — SÉCURITÉ
────────────────────────────── */
function SecurityTab({ userEmail }) {
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");

  const strength = newPw.length === 0 ? null : newPw.length < 6 ? "faible" : newPw.length < 10 ? "moyen" : "fort";
  const strengthColor = { faible: "#ef4444", moyen: "#f59e0b", fort: "#10b981" };
  const strengthWidth = { faible: "25%", moyen: "55%", fort: "100%" };

  const handleChangePw = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (newPw !== confirmPw) { setErrorMsg("Les mots de passe ne correspondent pas."); return; }
    if (newPw.length < 6)    { setErrorMsg("Minimum 6 caractères requis."); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (error) { setErrorMsg(error.message); return; }
    setSuccess(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <>
      {success && <div className="alert-success">✅ Mot de passe modifié avec succès !</div>}

      {/* Mot de passe */}
      <div className="settings-card">
        <div className="card-section-title">
          <div className="section-icon">🔑</div>
          <div>
            <h2>Changer le mot de passe</h2>
            <p>Utilisez un mot de passe fort d'au moins 8 caractères.</p>
          </div>
        </div>
        <div className="card-body">
          {errorMsg && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9, padding:"10px 14px", fontSize:13, color:"#991b1b", marginBottom:"1rem" }}>
              ⚠️ {errorMsg}
            </div>
          )}
          <form onSubmit={handleChangePw}>
            <div className="form-row single" style={{ marginBottom: "1rem" }}>
              <div className="form-field">
                <label className="field-label">Mot de passe actuel</label>
                <input type="password" className="field-input" placeholder="••••••••"
                  value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="field-label">Nouveau mot de passe</label>
                <input type="password" className="field-input" placeholder="••••••••"
                  value={newPw} onChange={(e) => { setNewPw(e.target.value); setErrorMsg(""); }} />
                {strength && (
                  <>
                    <div className="pw-strength-wrap">
                      <div className="pw-strength-bar" style={{ width: strengthWidth[strength], background: strengthColor[strength] }} />
                    </div>
                    <p className="pw-strength-label" style={{ color: strengthColor[strength] }}>
                      Force : {strength.charAt(0).toUpperCase() + strength.slice(1)}
                    </p>
                  </>
                )}
              </div>
              <div className="form-field">
                <label className="field-label">Confirmer le mot de passe</label>
                <input type="password" className="field-input" placeholder="••••••••"
                  value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setErrorMsg(""); }} />
              </div>
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm" /> Modification...</> : "🔒 Modifier le mot de passe"}
            </button>
          </form>
        </div>
      </div>

      {/* Sessions actives */}
      <div className="settings-card">
        <div className="card-section-title">
          <div className="section-icon">📱</div>
          <div>
            <h2>Sessions actives</h2>
            <p>Appareils connectés à votre compte.</p>
          </div>
        </div>
        <div className="card-body">
          {[
            { icon: "💻", name: "Chrome — Windows 11", location: "Tunis, Tunisie", current: true },
            { icon: "📱", name: "Safari — iPhone 14",   location: "Tunis, Tunisie", current: false },
          ].map((s, i) => (
            <div className="session-item" key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="session-icon">{s.icon}</div>
                <div className="session-info">
                  <h4>{s.name}</h4>
                  <p>📍 {s.location}</p>
                </div>
              </div>
              {s.current
                ? <span className="session-badge">✓ Session actuelle</span>
                : <button className="btn-revoke">Révoquer</button>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="danger-card">
        <div className="danger-info">
          <h3>🗑️ Supprimer le compte</h3>
          <p>Cette action est irréversible. Toutes vos données seront définitivement supprimées.</p>
        </div>
        <button className="btn-danger">Supprimer mon compte</button>
      </div>
    </>
  );
}

/* ──────────────────────────────
   TAB 3 — PRÉFÉRENCES
────────────────────────────── */
function PreferencesTab() {
  const [notifs, setNotifs] = useState({
    email:   true,
    session: true,
    updates: false,
    tips:    true,
  });
  const [lang, setLang]   = useState("fr");
  const [theme, setTheme] = useState("light");
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  };

  return (
    <>
      {success && <div className="alert-success">✅ Préférences sauvegardées !</div>}

      {/* Langue & Thème */}
      <div className="settings-card">
        <div className="card-section-title">
          <div className="section-icon">🌍</div>
          <div>
            <h2>Langue & Affichage</h2>
            <p>Personnalisez l'interface de l'application.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-field">
              <label className="field-label">Langue de l'interface</label>
              <select className="field-select" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
                <option value="ar">🇹🇳 العربية</option>
              </select>
            </div>
            <div className="form-field">
              <label className="field-label">Thème</label>
              <select className="field-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">☀️ Clair</option>
                <option value="dark">🌙 Sombre</option>
                <option value="system">🖥️ Système</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="settings-card">
        <div className="card-section-title">
          <div className="section-icon">🔔</div>
          <div>
            <h2>Notifications</h2>
            <p>Choisissez les alertes que vous souhaitez recevoir.</p>
          </div>
        </div>
        <div className="card-body">
          {[
            { key: "email",   title: "Notifications par email",          desc: "Recevez un récapitulatif de vos sessions par email." },
            { key: "session", title: "Début de session",                  desc: "Alerte quand une nouvelle session de présentation démarre." },
            { key: "updates", title: "Mises à jour de l'application",     desc: "Soyez informé des nouvelles fonctionnalités SlideGeste." },
            { key: "tips",    title: "Conseils & astuces",                desc: "Recevez des suggestions pour mieux utiliser les gestes." },
          ].map((n) => (
            <div className="toggle-row" key={n.key}>
              <div className="toggle-info">
                <h4>{n.title}</h4>
                <p>{n.desc}</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifs[n.key]}
                  onChange={() => setNotifs((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                />
                <span className="switch-slider" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-save" onClick={handleSave}>
        💾 Sauvegarder les préférences
      </button>
    </>
  );
}

export default Settings;