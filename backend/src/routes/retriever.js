/**
 *  Retriever routes
 * - Génère un prompt basé sur la quetsion de l'utilisateur et les documents du vectorstore
 */

const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { createUserRateLimiter } = require("../utils/rateLimiter");
const { runPythonScript } = require("../utils/pythonRunner");

const router = express.Router();
router.use(verifyFirebaseToken);

// --- Rate limiter --- //
const rateLimiter = createUserRateLimiter(
  parseInt(process.env.RATE_LIMIT_RETRIEVER_WINDOW),
  parseInt(process.env.RATE_LIMIT_RETRIEVER_MAX)
);

/**
 * GET /
 * Récupère un prompt enrichi avec le contexte pertinent à partir d'une question.
 */
router.get(
  "/prompt_with_context/:question",
  rateLimiter,
  async (req, res, next) => {
    try {
      const inputs = req.params;
      const params = {};

      // Appel le pipeline Kedro "classic_rag"
      const stdout = await runPythonScript({
        scriptPath: process.env.KEDRO_SCRIPT_PATH,
        pipeline: process.env.KEDRO_RAG_PIPELINE,
        inputs: inputs,
        params: params,
        captureOutput: true,
      });

      // Si réussite on récupère le prompt : Prend la dernière ligne non vide
      const lines = stdout.trim().split("\n");
      const lastLine = lines
        .reverse()
        .find((line) => line.trim().startsWith("{"));
      const result = JSON.parse(lastLine);

      return res.json({
        status: "ok",
        prompt: result.rag_prompt,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

module.exports = router;
