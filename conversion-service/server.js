import express from "express";
import cors from "cors";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const execFileP = promisify(execFile);

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_BUCKET        = process.env.SOURCE_BUCKET || "presentations";
const SLIDES_BUCKET        = process.env.SLIDES_BUCKET || "slides";
const TARGET_WIDTH         = parseInt(process.env.SLIDE_WIDTH || "1920", 10);
const PORT                 = process.env.PORT || 8080;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("⚠️  SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/convert", async (req, res) => {
  const { presentationId, filePath } = req.body || {};
  if (!presentationId || !filePath) {
    return res.status(400).json({ error: "presentationId et filePath sont requis." });
  }

  let workdir;
  try {
    const { data: blob, error: dlErr } = await supabase.storage
      .from(SOURCE_BUCKET)
      .download(filePath);
    if (dlErr || !blob) {
      throw new Error("Téléchargement du fichier source échoué : " + (dlErr?.message || "inconnu"));
    }

    workdir = await mkdtemp(path.join(tmpdir(), "pptx-"));
    const inputPath = path.join(workdir, "input.pptx");
    const buffer    = Buffer.from(await blob.arrayBuffer());
    await writeFile(inputPath, buffer);

    const profileDir = path.join(workdir, "lo-profile");
    await execFileP("soffice", [
      "--headless",
      "--norestore",
      `-env:UserInstallation=file://${profileDir}`,
      "--convert-to", "pdf",
      "--outdir", workdir,
      inputPath,
    ], { timeout: 120000 });

    const pdfPath = path.join(workdir, "input.pdf");

    await execFileP("pdftoppm", [
      "-png",
      "-scale-to-x", String(TARGET_WIDTH),
      "-scale-to-y", "-1",
      pdfPath,
      path.join(workdir, "slide"),
    ], { timeout: 120000 });

    const files = (await readdir(workdir))
      .filter((f) => f.startsWith("slide") && f.endsWith(".png"))
      .sort((a, b) => {
        const na = parseInt(a.match(/(\d+)/)?.[1] || "0", 10);
        const nb = parseInt(b.match(/(\d+)/)?.[1] || "0", 10);
        return na - nb;
      });

    if (files.length === 0) throw new Error("Aucune image générée.");

    const slides = [];
    for (let i = 0; i < files.length; i++) {
      const pageBuffer = await readFile(path.join(workdir, files[i]));
      const index      = String(i + 1).padStart(3, "0");
      const destPath   = `${presentationId}/${index}.png`;

      const { error: upErr } = await supabase.storage
        .from(SLIDES_BUCKET)
        .upload(destPath, pageBuffer, { contentType: "image/png", upsert: true });

      if (upErr) throw new Error("Upload de la slide échoué : " + upErr.message);
      slides.push(destPath);
    }

    await supabase
      .from("presentations")
      .update({ slide_count: files.length, slides_ready: true })
      .eq("id", presentationId);

    res.json({ ok: true, slideCount: files.length, slides });
  } catch (err) {
    console.error("Conversion error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (workdir) rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
});

app.listen(PORT, () => console.log(`✅ Service de conversion en écoute sur le port ${PORT}`));