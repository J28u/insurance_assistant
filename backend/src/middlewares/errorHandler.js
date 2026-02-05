const multer = require("multer");

/**
 * Middleware Express pour envoyer une réponse claire au frontend avec le bon status code,
 * sans exposer d'infos sensibles.
 *
 * Gère :
 *  - Erreurs Multer (LIMIT_FILE_SIZE, LIMIT_FILE_COUNT, etc.)
 *  - Erreurs custom avec `statusCode` (ex: NotFoundError, AccessDeniedError)
 *  - Autres erreurs inconnues (500 Internal Server Error)
 *
 * @param {Error} err - Erreur interceptée, éventuellement enrichie d'un statusCode
 * @param {object} req - Requête Express
 * @param {object} res - Réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {Promise<void>}
 */
function errorHandler(err, req, res, next) {
  console.error(err); // Log complet à afficher dans le backend

  // Gestion des erreurs Multer
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = `File too large. Maximum size is ${process.env.MAX_UPLOAD_MB}MB`;
        break;
      case "LIMIT_FILE_COUNT":
        message = `Too many files uploaded. Max : ${process.env.MAX_FILES_PER_UPLOAD}`;
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file type for file upload.";
        break;
      default:
        message = `Upload error`;
        break;
    }

    return res.status(400).json({ status: "error", message: message });
  }

  // Erreurs personnalisées avec statusCode
  if (err.statusCode) {
    return res
      .status(err.statusCode)
      .json({ status: "error", message: err.message });
  }

  // Erreur serveur par défaut
  res.status(500).json({ status: "error", message: `Internal server error` });
}

module.exports = errorHandler;
