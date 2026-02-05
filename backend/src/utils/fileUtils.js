const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Construit le chemin vectorstore spécifique à un utilisateur.
 * @param {string} userId - Firebase UID de l'utilisateur
 * @returns {string} chemin complet vers le vectorstore
 */
function getUserVectorstorePath(userId) {
  const baseDir = path.resolve(__dirname, process.env.VECTORSTORES_DIR);
  const userDir = path.join(baseDir, userId);
  fs.mkdirSync(userDir, { recursive: true });
  return path.join(userDir, process.env.VECTORSTORE_FILE_NAME);
}

/**
 * Crée un dossier temporaire pour les uploads (permissions strictes, seul le processus Node peut lire/écrire).
 */
function createUploadTempDir() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-upload-"));
  fs.chmodSync(tmpDir, 0o700);
  return tmpDir;
}

module.exports = { getUserVectorstorePath, createUploadTempDir };
