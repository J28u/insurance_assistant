const { runPythonScript } = require("../utils/pythonRunner");
const { getUserVectorstorePath } = require("../utils/fileUtils");

/**
 * Récupère un prompt enrichi avec le contexte pertinent à partir d'une question.
 * @param {string} question - La question utilisateur
 * @param {string} firebaseUid - UID Firebase de l'utilisateur
 * @returns {Promise<string>} - Le prompt enrichi
 */
async function getPromptWithContext(question, firebaseUid) {
  const vectorstorePath = getUserVectorstorePath(firebaseUid);
  const inputs = { question };
  const params = {};

  // Appel le pipeline Kedro "classic_rag"
  const stdout = await runPythonScript({
    scriptPath: process.env.KEDRO_SCRIPT_PATH,
    pipeline: process.env.KEDRO_RAG_PIPELINE,
    inputs,
    params,
    vectorstorePath: vectorstorePath,
    captureOutput: true,
  });

  // Si réussite on récupère le prompt : Prend la dernière ligne non vide
  const lines = stdout.trim().split("\n");
  const lastLine = lines.reverse().find((line) => line.trim().startsWith("{"));
  const result = JSON.parse(lastLine);

  return result.rag_prompt;
}

module.exports = { getPromptWithContext };
