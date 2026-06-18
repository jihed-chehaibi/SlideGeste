import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/Logo2.png";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // Supabase envoie le token dans l'URL sous forme de hash (#access_token=...&type=recovery)
  // On écoute l'événement PASSWORD_RECOVERY pour confirmer que la session est prête
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    alert("Mot de passe mis à jour avec succès !");
    navigate("/signin");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .rp-page {
          min-height: 100vh;
          background: #f0f4ff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .rp-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(15, 52, 109, 0.12);
          overflow: hidden;
          max-width: 960px;
          width: 100%;
        }

        /* ── Panneau gauche ── */
        .rp-left {
          background: linear-gradient(150deg, #0f346d 0%, #1a5faa 60%, #1e78c8 100%);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 520px;
          position: relative;
          overflow: hidden;
        }

        .rp-left::before {
          content: '';
          position: absolute;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          top: -100px; right: -100px;
        }

        .rp-left::after {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          bottom: -60px; left: -60px;
        }

        .left-logo {
          width: 160px;
          object-fit: contain;
          margin-bottom: 2rem;
          filter: brightness(0) invert(1);
          position: relative;
          z-index: 1;
        }

        .left-icon-wrap {
          width: 64px; height: 64px;
          border-radius: 16px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .left-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          margin-bottom: 0.75rem;
          position: relative;
          z-index: 1;
        }

        .left-sub {
          font-size: 13.5px;
          color: rgba(255,255,255,0.62);
          line-height: 1.8;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }

        .tip-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: rgba(255,255,255,0.82);
          font-size: 13px;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }

        .tip-icon {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
          color: #a5f3fc;
          margin-top: 1px;
        }

        /* ── Panneau droit ── */
        .rp-right {
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .right-logo {
          width: 145px;
          object-fit: contain;
          margin-bottom: 1.75rem;
        }

        .form-heading {
          font-size: 21px;
          font-weight: 700;
          color: #0f346d;
          margin-bottom: 4px;
        }

        .form-subheading {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 1.75rem;
          line-height: 1.6;
        }

        /* Banner "session en attente" */
        .waiting-banner {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12.5px;
          color: #92400e;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          line-height: 1.6;
        }

        /* Banner erreur */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 12.5px;
          color: #991b1b;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          line-height: 1.6;
        }

        .custom-label {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
          display: block;
        }

        .custom-input {
          border: 1.5px solid #e5e7eb !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          font-size: 14px !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          color: #111827 !important;
          background: #f9fafb !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }

        .custom-input:focus {
          border-color: #1a5faa !important;
          box-shadow: 0 0 0 3px rgba(26, 95, 170, 0.12) !important;
          background: #fff !important;
          outline: none !important;
        }

        .custom-input::placeholder { color: #9ca3af; }

        .custom-input.is-invalid {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.10) !important;
        }

        /* Barre de force du mot de passe */
        .strength-bar-wrap {
          height: 4px;
          background: #e5e7eb;
          border-radius: 99px;
          margin-top: 8px;
          overflow: hidden;
        }

        .strength-bar {
          height: 100%;
          border-radius: 99px;
          transition: width 0.3s, background 0.3s;
        }

        .strength-label {
          font-size: 11px;
          margin-top: 4px;
          font-weight: 500;
        }

        .btn-reset {
          background: linear-gradient(135deg, #0f346d, #1a5faa) !important;
          border: none !important;
          border-radius: 10px !important;
          padding: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          color: #fff !important;
          transition: opacity 0.2s, transform 0.15s !important;
          letter-spacing: 0.02em !important;
        }

        .btn-reset:hover:not(:disabled) {
          opacity: 0.88 !important;
          transform: translateY(-1px) !important;
        }

        .btn-reset:disabled { opacity: 0.55 !important; }

        .btn-back {
          background: transparent !important;
          border: 1.5px solid #e5e7eb !important;
          border-radius: 10px !important;
          padding: 11px !important;
          font-size: 13.5px !important;
          font-weight: 600 !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          color: #374151 !important;
          transition: border-color 0.2s, background 0.2s !important;
        }

        .btn-back:hover {
          background: #f9fafb !important;
          border-color: #1a5faa !important;
          color: #1a5faa !important;
        }
      `}</style>

      <div className="rp-page">
        <div className="rp-card">
          <div className="row g-0">

            {/* ── Panneau gauche ── */}
            <div className="col-lg-5 rp-left d-none d-lg-flex flex-column">
              <img src={logo} alt="SlideGeste" className="left-logo" />
              <div className="left-icon-wrap">🛡️</div>
              <h2 className="left-title">Nouveau<br />mot de passe</h2>
              <p className="left-sub">
                Choisissez un mot de passe fort pour sécuriser votre compte SlideGeste.
              </p>
              <div>
                {[
                  "Au moins 6 caractères",
                  "Mélangez lettres, chiffres et symboles",
                  "N'utilisez pas un mot de passe déjà utilisé",
                ].map((tip, i) => (
                  <div key={i} className="tip-item">
                    <span className="tip-icon">✓</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Panneau droit ── */}
            <div className="col-lg-7 rp-right">
              <img src={logo} alt="SlideGeste" className="right-logo" />

              <p className="form-heading">Nouveau mot de passe</p>
              <p className="form-subheading">
                Choisissez un nouveau mot de passe sécurisé pour votre compte.
              </p>

              {/* Avertissement si la session n'est pas encore prête */}
              {!sessionReady && (
                <div className="waiting-banner">
                  <span style={{ fontSize: "15px", flexShrink: 0 }}>⏳</span>
                  <span>
                    Vérification du lien en cours… Si la page reste bloquée,{" "}
                    <strong>rechargez la page</strong> ou redemandez un nouveau lien.
                  </span>
                </div>
              )}

              {/* Message d'erreur */}
              {errorMsg && (
                <div className="error-banner">
                  <span style={{ fontSize: "15px", flexShrink: 0 }}>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <label className="custom-label">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className={`form-control custom-input ${errorMsg.includes("correspond") ? "is-invalid" : ""}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                    required
                    disabled={!sessionReady}
                  />
                  {/* Barre de force */}
                  {password.length > 0 && (
                    <>
                      <div className="strength-bar-wrap">
                        <div
                          className="strength-bar"
                          style={{
                            width: password.length < 6 ? "25%" : password.length < 10 ? "55%" : "100%",
                            background: password.length < 6 ? "#ef4444" : password.length < 10 ? "#f59e0b" : "#10b981",
                          }}
                        />
                      </div>
                      <p
                        className="strength-label"
                        style={{
                          color: password.length < 6 ? "#ef4444" : password.length < 10 ? "#f59e0b" : "#10b981",
                        }}
                      >
                        {password.length < 6 ? "Faible" : password.length < 10 ? "Moyen" : "Fort"}
                      </p>
                    </>
                  )}
                </div>

                <div className="mb-4">
                  <label className="custom-label">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    className={`form-control custom-input ${errorMsg.includes("correspond") ? "is-invalid" : ""}`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(""); }}
                    required
                    disabled={!sessionReady}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-reset w-100 mb-3"
                  disabled={loading || !sessionReady}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Mise à jour en cours...
                    </>
                  ) : (
                    "Enregistrer le nouveau mot de passe →"
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-back w-100"
                  onClick={() => navigate("/signin")}
                >
                  ← Retour à la connexion
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;