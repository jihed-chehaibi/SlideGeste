import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const COLORS = [
  { bg: "#EDE9FE", text: "#6366F1" },
  { bg: "#E0F2FE", text: "#0284C7" },
  { bg: "#FEF3C7", text: "#D97706" },
  { bg: "#ECFDF5", text: "#059669" },
  { bg: "#FEE2E2", text: "#DC2626" },
  { bg: "#FCE7F3", text: "#DB2777" },
];

function initials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function colorFor(name) {
  let hash = 0;
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[hash];
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* Déclenche la conversion pptx -> images sur le microservice.
   Fire-and-forget : on ne bloque pas l'UI pendant la conversion. */
async function triggerConversion(presentationId, filePath) {
  const base = import.meta.env.VITE_CONVERT_URL;
  if (!base) {
    console.warn("VITE_CONVERT_URL non défini — conversion non déclenchée.");
    return;
  }
  try {
    await fetch(`${base}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presentationId, filePath }),
    });
  } catch (e) {
    console.error("Conversion non démarrée :", e);
  }
}

export default function Presentations() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [renameId, setRenameId] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchPresentations();
  }, []);

  /* Tant qu'une présentation est en cours de conversion (slides_ready=false),
     on rafraîchit automatiquement pour mettre à jour son statut. */
  useEffect(() => {
    const pending = presentations.some((p) => !p.slides_ready);
    if (!pending) return;
    const t = setTimeout(fetchPresentations, 4000);
    return () => clearTimeout(t);
  }, [presentations]);

  async function fetchPresentations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setPresentations(data || []);
    setLoading(false);
  }

  async function handleUpload(file) {
    if (!file) return;
    if (!file.name.endsWith(".pptx")) {
      setError("Seuls les fichiers .pptx sont acceptés.");
      return;
    }

    setUploading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      setError("Vous devez être connecté pour importer un fichier.");
      setUploading(false);
      return;
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${timestamp}_${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from("presentations")
      .upload(filePath, file, { upsert: false });

    if (uploadErr) {
      setError(`Erreur Storage : ${uploadErr.message}`);
      setUploading(false);
      return;
    }

    /* Insert AVEC récupération de la ligne créée (pour avoir l'id) */
    const { data: inserted, error: dbErr } = await supabase
      .from("presentations")
      .insert({
        user_id: user.id,
        name: file.name.replace(".pptx", ""),
        file_path: filePath,
        file_size: file.size,
        slides_ready: false,
      })
      .select()
      .single();

    if (dbErr) {
      setError(`Erreur base de données : ${dbErr.message}`);
      await supabase.storage.from("presentations").remove([filePath]);
    } else {
      /* Lance la conversion en arrière-plan, puis rafraîchit la liste */
      triggerConversion(inserted.id, filePath);
      fetchPresentations();
    }

    setUploading(false);
  }

  async function handleDelete(pres) {
    if (!window.confirm(`Supprimer "${pres.name}" ?`)) return;
    await supabase.storage.from("presentations").remove([pres.file_path]);
    /* Nettoie aussi les images générées */
    if (pres.slide_count) {
      const slidePaths = Array.from({ length: pres.slide_count }, (_, i) =>
        `${pres.id}/${String(i + 1).padStart(3, "0")}.png`
      );
      await supabase.storage.from("slides").remove(slidePaths);
    }
    await supabase.from("presentations").delete().eq("id", pres.id);
    setPresentations((prev) => prev.filter((p) => p.id !== pres.id));
  }

  async function handleRename(pres) {
    if (!renameName.trim() || renameName === pres.name) {
      setRenameId(null);
      return;
    }
    const { error } = await supabase
      .from("presentations")
      .update({ name: renameName.trim(), updated_at: new Date() })
      .eq("id", pres.id);
    if (!error) {
      setPresentations((prev) =>
        prev.map((p) =>
          p.id === pres.id ? { ...p, name: renameName.trim() } : p
        )
      );
    }
    setRenameId(null);
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Mes présentations</h1>
          <p style={styles.subtitle}>Gérez et lancez vos slides via gestes</p>
        </div>
        <button
          style={styles.btnPrimary}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Upload..." : "⬆ Importer .pptx"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx"
          style={{ display: "none" }}
          onChange={(e) => handleUpload(e.target.files[0])}
        />
      </div>

      {/* Erreur */}
      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Drop Zone */}
      <div
        style={{
          ...styles.dropZone,
          ...(dragging ? styles.dropZoneActive : {}),
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <span style={{ fontSize: 32 }}>📁</span>
        <p style={styles.dropZoneTitle}>
          {uploading ? "Chargement..." : "Glissez un fichier .pptx ici"}
        </p>
        <p style={styles.dropZoneSub}>ou cliquez pour parcourir — max 50 MB</p>
      </div>

      {/* Compteur */}
      <p style={styles.sectionLabel}>
        {loading
          ? "Chargement..."
          : `${presentations.length} présentation${
              presentations.length !== 1 ? "s" : ""
            }`}
      </p>

      {/* État vide */}
      {!loading && presentations.length === 0 && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>
            🎞️
          </span>
          <p style={{ color: "#94A3B8" }}>
            Aucune présentation. Importez votre premier .pptx !
          </p>
        </div>
      )}

      {/* Grille */}
      <div style={styles.grid}>
        {presentations.map((pres) => {
          const color = colorFor(pres.name);
          const isRenaming = renameId === pres.id;
          const ready = pres.slides_ready;
          return (
            <div key={pres.id} style={styles.card}>
              {/* Miniature */}
              <div
                style={{
                  ...styles.thumb,
                  background: color.bg,
                  color: color.text,
                }}
              >
                {initials(pres.name)}
                {!ready && (
                  <span style={styles.convertingBadge}>Conversion…</span>
                )}
              </div>

              {/* Corps */}
              <div style={styles.cardBody}>
                {isRenaming ? (
                  <input
                    style={styles.renameInput}
                    value={renameName}
                    autoFocus
                    onChange={(e) => setRenameName(e.target.value)}
                    onBlur={() => handleRename(pres)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(pres);
                      if (e.key === "Escape") setRenameId(null);
                    }}
                  />
                ) : (
                  <p style={styles.cardName}>{pres.name}</p>
                )}

                <p style={styles.cardMeta}>
                  {formatSize(pres.file_size)} · {formatDate(pres.created_at)}
                  {ready && pres.slide_count ? ` · ${pres.slide_count} slides` : ""}
                </p>

                <div style={styles.cardActions}>
                  <button
                    style={{
                      ...styles.btnOpen,
                      ...(ready ? {} : styles.btnDisabled),
                    }}
                    disabled={!ready}
                    onClick={() => navigate(`/viewer/${pres.id}`)}
                  >
                    {ready ? "▶ Lancer" : "⏳ Conversion…"}
                  </button>
                  <button
                    style={styles.btnIcon}
                    title="Renommer"
                    onClick={() => {
                      setRenameId(pres.id);
                      setRenameName(pres.name);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    style={{ ...styles.btnIcon, ...styles.btnDanger }}
                    title="Supprimer"
                    onClick={() => handleDelete(pres)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "2rem 1.5rem",
    maxWidth: 960,
    margin: "0 auto",
    fontFamily: "Inter, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
  },
  h1: { fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0 },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 4 },
  btnPrimary: {
    background: "#6366F1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  errorBanner: {
    background: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FECACA",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 16,
    fontSize: 14,
  },
  dropZone: {
    border: "1.5px dashed #CBD5E1",
    borderRadius: 12,
    padding: "2rem",
    textAlign: "center",
    marginBottom: "2rem",
    background: "#F8FAFC",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  dropZoneActive: { borderColor: "#6366F1", background: "#EEF2FF" },
  dropZoneTitle: {
    color: "#6366F1",
    fontWeight: 600,
    marginTop: 8,
    fontSize: 15,
  },
  dropZoneSub: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 12,
  },
  emptyState: { textAlign: "center", padding: "3rem 1rem" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 14,
  },
  card: {
    background: "#fff",
    border: "0.5px solid #E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
  },
  thumb: {
    position: "relative",
    height: 110,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -1,
  },
  convertingBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    fontSize: 10,
    fontWeight: 700,
    background: "rgba(15,23,42,0.75)",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: 12,
    letterSpacing: 0,
  },
  cardBody: { padding: "12px 14px" },
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0F172A",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    margin: 0,
  },
  cardMeta: { fontSize: 12, color: "#64748B", marginTop: 4 },
  cardActions: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  btnOpen: {
    flex: 1,
    background: "#6366F1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "7px 0",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDisabled: {
    background: "#CBD5E1",
    cursor: "not-allowed",
  },
  btnIcon: {
    width: 32,
    height: 32,
    border: "0.5px solid #E2E8F0",
    borderRadius: 8,
    background: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 15,
  },
  btnDanger: { background: "#FEF2F2", borderColor: "#FECACA" },
  renameInput: {
    width: "100%",
    fontSize: 14,
    fontWeight: 600,
    border: "1.5px solid #6366F1",
    borderRadius: 6,
    padding: "3px 6px",
    outline: "none",
    color: "#0F172A",
  },
};