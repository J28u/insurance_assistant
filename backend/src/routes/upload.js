const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Dossier de destination
const uploadDir = path.resolve(
  __dirname,
  "../../../kedro_pipelines/data/01_raw"
);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // dossier où enregistrer
  },
  filename: function (req, file, cb) {
    // Sauvegarde avec le nom original (attention aux collisions !)
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Route pour loader les documents pdfs, les découper en chunk et les loader dans le vectorstore
router.post("/", upload.array("pdfs"), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }
    const pdfPaths = req.files.map((f) => path.resolve(f.path));
    const params = { pdf_paths: pdfPaths };
    const inputs = {};

    // Appelle le pipeline Kedro "embedding"
    const python = spawn("python", [
      path.resolve(__dirname, "../../../kedro_pipelines/src/rag/run_kedro.py"),
      "embedding",
      JSON.stringify(inputs),
      JSON.stringify(params),
    ]);

    // Récupération de la sortie du script Python :
    let errorOutput = ""; // Tout ce que le script Python écrit sur la sortie d'erreur
    python.stdout.on("data", (data) => {
      // Affiche les logs Python en temps réel dans la console Node.js
      process.stdout.write(data.toString());
    });

    python.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
      errorOutput += data.toString();
    });

    // Quand le script se termine:
    python.on("close", (code) => {
      req.files.forEach((f) => fs.unlinkSync(f.path)); // supprime les fichiers pdfs uploadés
      // Si le script Python a échoué
      if (code !== 0) {
        console.error("Erreur Python:", errorOutput); // on log l'erreur
        return res // on renvoie une erreur 500
          .status(500)
          .json({ error: "Processing failed", details: errorOutput });
      }
      // Succès : le vectorstore est sauvegardé par Kedro, pas besoin de parser la sortie
      return res.json({
        status: "ok",
        message: "Vectorstore saved successfully.",
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
