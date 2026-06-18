import { useState } from "react";
import { supabase } from "../lib/supabase";

// Assure-toi d'avoir installé Bootstrap :
// npm install bootstrap
// Et dans main.jsx : import 'bootstrap/dist/css/bootstrap.min.css';

// Place le fichier LogoSlideGeste.png dans src/assets/
import logo from "../assets/Logo2.png";

function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
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
        }

        .signup-left {
          background: linear-gradient(150deg, #0f346d 0%, #1a5faa 60%, #1e78c8 100%);
          padding: 2.5rem 2.5rem;
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
          width: 180px;
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
          color: rgba(255,255,255,0.65);
          line-height: 1.8;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.82);
          font-size: 13px;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }

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

        .signup-right {
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .right-logo {
          width: 150px;
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

        .btn-signup {
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

        .btn-signup:hover:not(:disabled) {
          opacity: 0.88 !important;
          transform: translateY(-1px) !important;
        }

        .btn-signup:active {
          transform: scale(0.98) !important;
        }

        .btn-signup:disabled {
          opacity: 0.65 !important;
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
        }

        .signin-link:hover {
          color: #0f346d;
          text-decoration: underline;
        }
      `}</style>

      <div className="signup-page">
        <div className="signup-card">
          <div className="row g-0">

            {/* Panneau gauche */}
            <div className="col-lg-5 signup-left d-none d-lg-flex flex-column">
              <img src={logo} alt="SlideGeste" className="left-logo" />
              <h2 className="left-title">
                Créez votre<br />compte gratuit
              </h2>
              <p className="left-sub">
                Rejoignez la plateforme SlideGeste et accédez à toutes les fonctionnalités en quelques secondes.
              </p>
              <div>
                {[
                  "Inscription rapide et sécurisée",
                  "Données protégées et chiffrées",
                  "Accès instantané après création",
                ].map((text, i) => (
                  <div key={i} className="feature-item">
                    <span className="feature-check">✓</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Panneau droit — formulaire */}
            <div className="col-lg-7 signup-right">
              <img src={logo} alt="SlideGeste" className="right-logo d-lg-none" />
              <img src={logo} alt="SlideGeste" className="right-logo d-none d-lg-block" />

              <p className="form-heading">Créer un compte</p>
              <p className="form-subheading">Remplis le formulaire pour commencer.</p>

              <form onSubmit={handleSignUp}>
                <div className="mb-3">
                  <label className="custom-label">Nom complet</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="Jihed Chehaibi"
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
                    placeholder="jihed@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="custom-label">Mot de passe</label>
                  <input
                    type="password"
                    className="form-control custom-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
    </>
  );
}

export default SignUp;