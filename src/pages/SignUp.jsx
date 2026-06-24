import { useState } from "react";
import { supabase } from "../lib/supabase";
import logo from "../assets/Logo2.png";

function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Compte créé avec succès !");
    console.log(data);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        :root {
          --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
        }

        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .signup-page {
          min-height: 100vh;
          background: #f0f4ff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .signup-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(15, 52, 109, 0.12);
          overflow: hidden;
          max-width: 960px;
          width: 100%;
          animation: cardEnter 420ms var(--ease-out-strong) both;
        }

        /* ── Panneau gauche ── */
        .signup-left {
          background: linear-gradient(150deg, #0f346d 0%, #1a5faa 60%, #1e78c8 100%);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 520px;
          position: relative;
          overflow: hidden;
        }

        .signup-left::before {
          content: '';
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          top: -100px;
          right: -100px;
        }

        .signup-left::after {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          bottom: -60px;
          left: -60px;
        }

        .left-logo {
          width: 160px;
          object-fit: contain;
          margin-bottom: 2rem;
          filter: brightness(0) invert(1);
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

        /* ── Stagger sur les feature items ── */
        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.82);
          font-size: 13px;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
          opacity: 0;
          animation: fadeSlideUp 360ms var(--ease-out-strong) both;
        }

        .feature-item:nth-child(1) { animation-delay: 180ms; }
        .feature-item:nth-child(2) { animation-delay: 240ms; }
        .feature-item:nth-child(3) { animation-delay: 300ms; }

        .feature-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
          color: #a5f3fc;
        }

        /* ── Panneau droit ── */
        .signup-right {
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .right-logo {
          width: 145px;
          object-fit: contain;
          margin-bottom: 1.75rem;
          opacity: 0;
          animation: fadeSlideUp 340ms var(--ease-out-strong) 80ms both;
        }

        .form-heading {
          font-size: 21px;
          font-weight: 700;
          color: #0f346d;
          margin-bottom: 4px;
          opacity: 0;
          animation: fadeSlideUp 320ms var(--ease-out-strong) 120ms both;
        }

        .form-subheading {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 1.75rem;
          opacity: 0;
          animation: fadeSlideUp 320ms var(--ease-out-strong) 150ms both;
        }

        .form-body {
          opacity: 0;
          animation: fadeSlideUp 320ms var(--ease-out-strong) 190ms both;
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
          transition:
            border-color 160ms var(--ease-out-strong),
            box-shadow 160ms var(--ease-out-strong),
            background-color 160ms var(--ease-out-strong) !important;
        }

        .custom-input:focus {
          border-color: #1a5faa !important;
          box-shadow: 0 0 0 3px rgba(26, 95, 170, 0.12) !important;
          background: #fff !important;
          outline: none !important;
        }

        .custom-input::placeholder {
          color: #9ca3af;
        }

        @media (hover: hover) and (pointer: fine) {
          .custom-input:hover:not(:focus) {
            border-color: #d1d5db !important;
            background: #fff !important;
          }
        }

        /* ── Bouton avec vrai feedback tactile ── */
        .btn-signup {
          background: linear-gradient(135deg, #0f346d, #1a5faa) !important;
          border: none !important;
          border-radius: 10px !important;
          padding: 12px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          color: #fff !important;
          letter-spacing: 0.02em !important;
          transition:
            opacity 180ms var(--ease-out-strong),
            transform 160ms var(--ease-out-strong),
            box-shadow 180ms var(--ease-out-strong) !important;
        }

        @media (hover: hover) and (pointer: fine) {
          .btn-signup:hover:not(:disabled) {
            opacity: 0.92 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 16px rgba(15, 52, 109, 0.28) !important;
          }
        }

        /* Asymétrique : relâchement rapide (100ms) vs hover normal (160ms) */
        .btn-signup:active:not(:disabled) {
          transform: scale(0.97) !important;
          box-shadow: none !important;
          opacity: 1 !important;
          transition:
            transform 100ms var(--ease-out-strong),
            box-shadow 100ms var(--ease-out-strong),
            opacity 100ms var(--ease-out-strong) !important;
        }

        .btn-signup:disabled {
          opacity: 0.65 !important;
          cursor: not-allowed !important;
        }

        .divider-text {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        .signin-link {
          color: #1a5faa;
          font-weight: 600;
          text-decoration: none;
          transition: color 140ms var(--ease-out-strong);
        }

        .signin-link:hover {
          color: #0f346d;
          text-decoration: underline;
        }
          .toggle-password {
  color: #9ca3af;
  transition: color 140ms var(--ease-out-strong);
}

@media (hover: hover) and (pointer: fine) {
  .toggle-password:hover {
    color: #374151 !important;
  }
}

        /* ── prefers-reduced-motion : mouvement supprimé, opacités finales maintenues ── */
        @media (prefers-reduced-motion: reduce) {
          .signup-card,
          .feature-item,
          .right-logo,
          .form-heading,
          .form-subheading,
          .form-body {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="signup-page">
        <div className="signup-card">
          <div className="row g-0">

            {/* ── Panneau gauche ── */}
            <div className="col-lg-5 signup-left d-none d-lg-flex flex-column">
              <img src={logo} alt="SlideGeste" className="left-logo" />
              <h2 className="left-title">
                Créez votre<br />compte gratuit
              </h2>
              <p className="left-sub">
                Rejoignez SlideGeste et accédez à toutes les fonctionnalités en quelques secondes.
              </p>
              <div>
                {[
                  { icon: "✓", text: "Inscription rapide et sécurisée" },
                  { icon: "✓", text: "Données protégées et chiffrées" },
                  { icon: "✓", text: "Accès instantané après création" },
                ].map((f, i) => (
                  <div key={i} className="feature-item">
                    <span className="feature-check">{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Panneau droit — formulaire ── */}
            <div className="col-lg-7 signup-right">
              <img src={logo} alt="SlideGeste" className="right-logo" />

              <p className="form-heading">Créer un compte</p>
              <p className="form-subheading">
                Remplis le formulaire pour commencer.
              </p>

              <div className="form-body">
                <form onSubmit={handleSignUp}>
                  <div className="mb-3">
                    <label className="custom-label">Nom complet</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      placeholder="Prénom Nom"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="custom-label">Adresse email</label>
                    <input
                      type="email"
                      className="form-control custom-input"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
  <label className="custom-label">Mot de passe</label>
  <div style={{ position: "relative" }}>
    <input
      type={showPassword ? "text" : "password"}
      className="form-control custom-input"
      placeholder="••••••••"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      style={{ paddingRight: "42px" }}
    />
    <button
      type="button"
      className="toggle-password"
      onClick={() => setShowPassword((v) => !v)}
      style={{
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        padding: "0",
        cursor: "pointer",
        color: "#9ca3af",
        display: "flex",
        alignItems: "center",
        transition: "color 140ms var(--ease-out-strong)",
      }}
      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
    >
      {showPassword ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  </div>
</div>

                  <button
                    type="submit"
                    className="btn btn-signup w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Création en cours...
                      </>
                    ) : (
                      "Créer mon compte →"
                    )}
                  </button>
                </form>

                <div className="d-flex align-items-center gap-2 my-2">
                  <hr className="flex-grow-1 m-0" />
                  <span className="divider-text">ou</span>
                  <hr className="flex-grow-1 m-0" />
                </div>

                <p className="text-center mt-3 mb-0" style={{ fontSize: "13px", color: "#6b7280" }}>
                  Déjà un compte ?{" "}
                  <a href="/signin" className="signin-link">Se connecter</a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default SignUp;