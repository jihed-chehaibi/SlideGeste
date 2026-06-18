import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// npm install bootstrap
// main.jsx : import 'bootstrap/dist/css/bootstrap.min.css';
// Place LogoSlideGeste.png dans src/assets/
import logo from "../assets/Logo2.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Un lien de réinitialisation a été envoyé à " + email);
    navigate("/signin");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .fp-page {
          min-height: 100vh;
          background: #f0f4ff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .fp-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(15, 52, 109, 0.12);
          overflow: hidden;
          max-width: 960px;
          width: 100%;
        }

        /* ── Panneau gauche ── */
        .fp-left {
          background: linear-gradient(150deg, #0f346d 0%, #1a5faa 60%, #1e78c8 100%);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 520px;
          position: relative;
          overflow: hidden;
        }

        .fp-left::before {
          content: '';
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          top: -100px;
          right: -100px;
        }

        .fp-left::after {
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

        .left-icon-wrap {
          width: 64px;
          height: 64px;
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

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: rgba(255,255,255,0.82);
          font-size: 13px;
          margin-bottom: 14px;
          position: relative;
          z-index: 1;
        }

        .step-number {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          color: #a5f3fc;
          margin-top: 1px;
        }

        .step-text {
          line-height: 1.5;
        }

        .step-text strong {
          display: block;
          color: #fff;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .step-text span {
          color: rgba(255,255,255,0.55);
          font-size: 12px;
        }

        /* ── Panneau droit ── */
        .fp-right {
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

        .info-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12.5px;
          color: #1e40af;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          line-height: 1.6;
        }

        .info-icon {
          font-size: 15px;
          flex-shrink: 0;
          margin-top: 1px;
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

        .custom-input::placeholder {
          color: #9ca3af;
        }

        .btn-send {
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

        .btn-send:hover:not(:disabled) {
          opacity: 0.88 !important;
          transform: translateY(-1px) !important;
        }

        .btn-send:active {
          transform: scale(0.98) !important;
        }

        .btn-send:disabled {
          opacity: 0.65 !important;
        }

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

        .signin-link {
          color: #1a5faa;
          font-weight: 600;
          text-decoration: none;
        }

        .signin-link:hover {
          color: #0f346d;
          text-decoration: underline;
        }
      `}</style>

      <div className="fp-page">
        <div className="fp-card">
          <div className="row g-0">

            {/* ── Panneau gauche ── */}
            <div className="col-lg-5 fp-left d-none d-lg-flex flex-column">
              <img src={logo} alt="SlideGeste" className="left-logo" />
              <div className="left-icon-wrap">🔑</div>
              <h2 className="left-title">
                Mot de passe<br />oublié ?
              </h2>
              <p className="left-sub">
                Pas de panique ! Suivez ces étapes simples pour récupérer l'accès à votre compte SlideGeste.
              </p>
              <div>
                {[
                  { n: "1", title: "Entrez votre email", desc: "Celui utilisé lors de l'inscription" },
                  { n: "2", title: "Consultez votre boîte mail", desc: "Un lien vous sera envoyé dans quelques secondes" },
                  { n: "3", title: "Cliquez sur le lien", desc: "Vous serez redirigé pour créer un nouveau mot de passe" },
                ].map((s) => (
                  <div key={s.n} className="step-item">
                    <span className="step-number">{s.n}</span>
                    <div className="step-text">
                      <strong>{s.title}</strong>
                      <span>{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Panneau droit — formulaire ── */}
            <div className="col-lg-7 fp-right">
              <img src={logo} alt="SlideGeste" className="right-logo" />

              <p className="form-heading">Réinitialiser le mot de passe</p>
              <p className="form-subheading">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <div className="info-box">
                <span className="info-icon">ℹ️</span>
                <span>
                  Le lien de réinitialisation expirera après <strong>1 heure</strong>. Vérifiez aussi vos spams si vous ne recevez pas l'email.
                </span>
              </div>

              <form onSubmit={handleForgotPassword}>
                <div className="mb-4">
                  <label className="custom-label">Adresse email</label>
                  <input
                    type="email"
                    className="form-control custom-input"
                    placeholder="jean@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-send w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien de réinitialisation →"
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

              <p className="text-center mt-4 mb-0" style={{ fontSize: "13px", color: "#6b7280" }}>
                Pas encore de compte ?{" "}
                <a href="/signup" className="signin-link">S'inscrire gratuitement</a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;