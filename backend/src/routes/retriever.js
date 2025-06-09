const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

router.get("/prompt_with_context/:question", async (req, res) => {
  try {
    const inputs = req.params;
    const params = {};

    // Appelle le pipeline Kedro "classic_rag"
    const python = spawn("python", [
      path.resolve(__dirname, "../../../kedro_pipelines/src/rag/run_kedro.py"),
      "classic_rag",
      JSON.stringify(inputs),
      JSON.stringify(params),
    ]);

    // Récupération de la sortie du script Python :
    let output = "";
    let errorOutput = ""; // Tout ce que le script Python écrit sur la sortie d'erreur
    python.stdout.on("data", (data) => {
      // Affiche les logs Python en temps réel dans la console Node.js
      process.stdout.write(data.toString());
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      process.stderr.write(data.toString());
      errorOutput += data.toString();
    });

    // Quand le script se termine:
    python.on("close", (code) => {
      // supprime les fichiers pdfs uploadés
      // Si le script Python a échoué
      if (code !== 0) {
        console.error("Erreur Python:", errorOutput); // on log l'erreur
        return res // on renvoie une erreur 500
          .status(500)
          .json({ error: "Processing failed", details: errorOutput });
      }
      // Sinon récupère le prompt :
      // Prend la dernière ligne non vide
      const lines = output.trim().split("\n");
      const lastLine = lines
        .reverse()
        .find((line) => line.trim().startsWith("{"));
      let result;
      result = JSON.parse(lastLine);
      return res.json({
        status: "ok",
        prompt: result.rag_prompt,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
