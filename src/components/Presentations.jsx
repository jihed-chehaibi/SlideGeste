import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import PresentationViewer from "./PresentationViewer";

// Place ce composant dans src/components/Presentations.jsx
// Dans Dashboard.jsx : {activeNav === "presentations" && <Presentations user={user} />}

function Presentations({ user }) {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [uploading, setUploading]         = useState(false);
  const [viewingPres, setViewingPres]     = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch]               = useState("");
  const [deleteId, setDeleteId]           = useState(null); // modal confirm
  const [successMsg, setSuccessMsg]       = useState("");
  const [errorMsg, setErrorMsg]           = useState("");
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef = useRef();

  // ── Fetch presentations ──
  const fetchPresentations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { setErrorMsg(error.message); }
    else { setPresentations(data); }
    setLoading(false);
  };

  useEffect(() => { fetchPresentations(); }, []);

  // ── Upload avec XHR pour vraie progression en temps réel ──
  // Limite portée à 200 Mo (configurer aussi dans Supabase Dashboard > Storage)
  const MAX_SIZE_MB = 200;

  const handleUpload = async (file) => {
    if (!file) return;

    const allowed = [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Format non supporté. Accepté : .pptx et .pdf uniquement.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`Fichier trop lourd. Maximum ${MAX_SIZE_MB} Mo.`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setErrorMsg("");

    const ext      = file.name.split(".").pop().toLowerCase();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${Date.now()}_${safeName}`;

    try {
      // ── Obtenir l'URL d'upload signée (upload direct sans passer par le client Supabase JS)
      const { data: uploadUrlData, error: urlErr } = await supabase.storage
        .from("presentations")
        .createSignedUploadUrl(filePath);

      if (urlErr) throw new Error(urlErr.message);

      // ── Upload XHR avec progression réelle ──
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            // La progression XHR = 0→90%, les 10% restants = insertion BDD
            const pct = Math.round((e.loaded / e.total) * 90);
            setUploadProgress(pct);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload échoué (${xhr.status})`));
        });
        xhr.addEventListener("error", () => reject(new Error("Erreur réseau")));
        xhr.addEventListener("abort", () => reject(new Error("Upload annulé")));

        xhr.open("PUT", uploadUrlData.signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setUploadProgress(92);

      // ── URL signée longue durée pour lecture ──
      const { data: readUrl } = await supabase.storage
        .from("presentations")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      setUploadProgress(96);

      // ── Insérer les métadonnées en base ──
      const { error: dbError } = await supabase.from("presentations").insert({
        user_id:   user.id,
        name:      file.name.replace(/\.[^/.]+$/, ""),
        file_url:  readUrl?.signedUrl || filePath,
        file_type: ext,
        file_size: file.size,
      });

      if (dbError) throw new Error(dbError.message);

      setUploadProgress(100);
      showSuccess("Présentation importée avec succès !");
      fetchPresentations();

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // ── Supprimer ──
  const handleDelete = async (pres) => {
    // Supprimer le fichier du storage
    const filePath = `${user.id}/${pres.file_url.split("/").pop()}`;
    await supabase.storage.from("presentations").remove([filePath]);

    // Supprimer de la base
    const { error } = await supabase
      .from("presentations")
      .delete()
      .eq("id", pres.id);

    if (error) { setErrorMsg(error.message); }
    else {
      showSuccess("Présentation supprimée.");
      setPresentations((prev) => prev.filter((p) => p.id !== pres.id));
    }
    setDeleteId(null);
  };

  // ── Helpers ──
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  const filtered = presentations.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const presToDelete = presentations.find((p) => p.id === deleteId);

  return (
    <>
      <style>{`
        .pres-page { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── PAGE HEADER ── */
        .pres-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .pres-header-left h1 { font-size: 20px; font-weight: 700; color: #0b1f45; margin-bottom: 3px; }
        .pres-header-left p  { font-size: 13px; color: #9ca3af; }
        .btn-import { background: #0b1f45; color: #fff; border: none; border-radius: 10px; padding: 0 20px; height: 40px; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.15s, transform 0.1s; white-space: nowrap; }
        .btn-import:hover { background: #1a3a6e; transform: translateY(-1px); }
        .btn-import:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* ── ALERTS ── */
        .alert-ok  { display: flex; align-items: center; gap: 9px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #166534; font-weight: 500; margin-bottom: 1.25rem; }
        .alert-err { display: flex; align-items: center; gap: 9px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #991b1b; font-weight: 500; margin-bottom: 1.25rem; }

        /* ── UPLOAD PROGRESS ── */
        .upload-bar-wrap { background: #e8ecf4; border-radius: 99px; height: 5px; margin-bottom: 1.25rem; overflow: hidden; }
        .upload-bar { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #1a5faa, #4da3ff); transition: width 0.4s ease; }

        /* ── DROPZONE ── */
        .dropzone { border: 2px dashed #c9d3e8; border-radius: 14px; padding: 2.5rem 1.5rem; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; margin-bottom: 1.5rem; background: #fff; }
        .dropzone:hover, .dropzone.active { border-color: #1a5faa; background: #f0f6ff; }
        .dropzone-icon { font-size: 40px; margin-bottom: 0.75rem; }
        .dropzone h3 { font-size: 15px; font-weight: 700; color: #0b1f45; margin-bottom: 5px; }
        .dropzone p  { font-size: 12.5px; color: #9ca3af; }
        .dropzone .formats { display: inline-flex; gap: 6px; margin-top: 10px; }
        .format-badge { background: #f0f4ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 600; color: #1e40af; }

        /* ── SEARCH + STATS ROW ── */
        .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .search-input-wrap { position: relative; flex: 1; max-width: 320px; }
        .search-input-wrap span { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 15px; }
        .search-input { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 9px; padding: 9px 13px 9px 38px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: #111827; background: #fff; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .search-input:focus { border-color: #1a5faa; box-shadow: 0 0 0 3px rgba(26,95,170,0.1); }
        .search-input::placeholder { color: #9ca3af; }
        .count-label { font-size: 13px; color: #9ca3af; font-weight: 500; white-space: nowrap; }

        /* ── GRID ── */
        .pres-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }

        /* ── CARD ── */
        .pres-card { background: #fff; border: 1px solid #e8ecf4; border-radius: 14px; overflow: hidden; transition: box-shadow 0.2s, transform 0.15s; display: flex; flex-direction: column; }
        .pres-card:hover { box-shadow: 0 6px 24px rgba(11,31,69,0.1); transform: translateY(-2px); }

        .card-thumb { height: 130px; display: flex; align-items: center; justify-content: center; position: relative; }
        .thumb-pptx { background: linear-gradient(135deg, #fff1f2, #fce7f3); }
        .thumb-pdf  { background: linear-gradient(135deg, #fef3c7, #fde68a); }
        .thumb-icon { font-size: 52px; }
        .thumb-type { position: absolute; top: 10px; right: 10px; font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
        .type-pptx { background: #fce7f3; color: #be185d; }
        .type-pdf  { background: #fef3c7; color: #92400e; }

        .card-body-inner { padding: 1rem; flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .card-name { font-size: 13.5px; font-weight: 700; color: #0b1f45; line-height: 1.35; word-break: break-word; }
        .card-meta { font-size: 11.5px; color: #9ca3af; display: flex; align-items: center; gap: 8px; }
        .card-meta span { display: flex; align-items: center; gap: 3px; }

        .card-actions { display: flex; gap: 6px; padding: 0.75rem 1rem; border-top: 1px solid #f0f2f8; }
        .btn-action { flex: 1; padding: 7px; border-radius: 8px; font-size: 12px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; gap: 5px; transition: background 0.15s, color 0.15s; }
        .btn-open   { background: #eff6ff; color: #1e40af; }
        .btn-open:hover { background: #dbeafe; }
        .btn-delete { background: #fef2f2; color: #ef4444; }
        .btn-delete:hover { background: #fee2e2; }

        /* ── EMPTY STATE ── */
        .empty-state { text-align: center; padding: 4rem 1rem; color: #9ca3af; }
        .empty-state .empty-icon { font-size: 56px; margin-bottom: 1rem; }
        .empty-state h3 { font-size: 16px; font-weight: 700; color: #0b1f45; margin-bottom: 6px; }
        .empty-state p  { font-size: 13px; }

        /* ── SKELETON ── */
        .skeleton { border-radius: 14px; background: linear-gradient(90deg, #f0f2f8 25%, #e8ecf4 50%, #f0f2f8 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── MODAL ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(11,31,69,0.45); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(2px); }
        .modal-box { background: #fff; border-radius: 16px; padding: 2rem; max-width: 400px; width: 100%; box-shadow: 0 20px 60px rgba(11,31,69,0.2); }
        .modal-icon { font-size: 40px; text-align: center; margin-bottom: 1rem; }
        .modal-title { font-size: 17px; font-weight: 700; color: #0b1f45; text-align: center; margin-bottom: 6px; }
        .modal-sub   { font-size: 13px; color: #6b7280; text-align: center; margin-bottom: 1.5rem; line-height: 1.6; }
        .modal-name  { font-weight: 700; color: #0b1f45; }
        .modal-btns  { display: flex; gap: 10px; }
        .btn-cancel  { flex: 1; padding: 11px; border-radius: 9px; border: 1.5px solid #e5e7eb; background: transparent; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; color: #374151; cursor: pointer; transition: border-color 0.15s; }
        .btn-cancel:hover { border-color: #9ca3af; }
        .btn-confirm-del { flex: 1; padding: 11px; border-radius: 9px; border: none; background: #ef4444; font-size: 13.5px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; color: #fff; cursor: pointer; transition: background 0.15s; }
        .btn-confirm-del:hover { background: #dc2626; }
      `}</style>

      <div className="pres-page">

        {/* Header */}
        <div className="pres-header">
          <div className="pres-header-left">
            <h1>🖥️ Mes Présentations</h1>
            <p>Importez et gérez vos fichiers PowerPoint et PDF.</p>
          </div>
          <button
            className="btn-import"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Import en cours...</>
            ) : (
              <> ＋ Importer une présentation</>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            style={{ display: "none" }}
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        </div>

        {/* Alerts */}
        {successMsg && <div className="alert-ok">✅ {successMsg}</div>}
        {errorMsg   && <div className="alert-err">⚠️ {errorMsg} <button onClick={() => setErrorMsg("")} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#991b1b", fontWeight:700 }}>✕</button></div>}

        {/* Upload progress */}
        {uploading && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: "#374151", fontWeight: 600 }}>
                {uploadProgress < 92 ? "⬆️ Upload en cours…" : uploadProgress < 100 ? "🔗 Finalisation…" : "✅ Terminé"}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1a5faa" }}>{uploadProgress}%</span>
            </div>
            <div className="upload-bar-wrap">
              <div className="upload-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          className={`dropzone ${dragOver ? "active" : ""}`}
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleUpload(e.dataTransfer.files[0]);
          }}
        >
          <div className="dropzone-icon">📂</div>
          <h3>Glissez votre fichier ici</h3>
          <p>ou cliquez pour parcourir vos fichiers</p>
          <div className="formats">
            <span className="format-badge">📊 PPTX</span>
            <span className="format-badge">📄 PDF</span>
            <span style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>— max 200 Mo</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-input-wrap">
            <span>🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Rechercher une présentation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="count-label">
            {filtered.length} présentation{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="pres-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 220 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <h3>{search ? "Aucun résultat trouvé" : "Aucune présentation importée"}</h3>
            <p>{search ? "Essayez un autre mot-clé." : "Cliquez sur « Importer » ou glissez un fichier pour commencer."}</p>
          </div>
        ) : (
          <div className="pres-grid">
            {filtered.map((pres) => (
              <div className="pres-card" key={pres.id}>
                {/* Thumbnail */}
                <div className={`card-thumb ${pres.file_type === "pdf" ? "thumb-pdf" : "thumb-pptx"}`}>
                  <span className="thumb-icon">
                    {pres.file_type === "pdf" ? "📄" : "📊"}
                  </span>
                  <span className={`thumb-type ${pres.file_type === "pdf" ? "type-pdf" : "type-pptx"}`}>
                    {pres.file_type}
                  </span>
                </div>

                {/* Info */}
                <div className="card-body-inner">
                  <p className="card-name">{pres.name}</p>
                  <div className="card-meta">
                    <span>🗓️ {formatDate(pres.created_at)}</span>
                    <span>💾 {formatSize(pres.file_size)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="card-actions">
                  <button
                    className="btn-action btn-open"
                    onClick={() => setViewingPres(pres)}
                  >
                    👁️ Ouvrir
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => setDeleteId(pres.id)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── VIEWER PLEIN ÉCRAN ── */}
      {viewingPres && (
        <PresentationViewer
          pres={viewingPres}
          onClose={() => setViewingPres(null)}
        />
      )}

      {/* ── MODAL CONFIRMATION SUPPRESSION ── */}
      {deleteId && presToDelete && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🗑️</div>
            <p className="modal-title">Supprimer la présentation ?</p>
            <p className="modal-sub">
              Vous êtes sur le point de supprimer{" "}
              <span className="modal-name">« {presToDelete.name} »</span>.
              <br />Cette action est irréversible.
            </p>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setDeleteId(null)}>Annuler</button>
              <button className="btn-confirm-del" onClick={() => handleDelete(presToDelete)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Presentations;