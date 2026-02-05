const admin = require("../firebaseAdmin");

/**
 * Middleware Express pour vérifier un token Firebase ID.
 *
 * <ul>
 * <li> - Récupère le token depuis l'en-tête Authorization (format: "Bearer <token>").</li>
 * <li> - Vérifie le token via Firebase Admin SDK (signature, expiration, qu'il vient du projet Firebase)</li>
 * <li> - Ajoute l'utilisateur décodé (UID, email ...) dans `req.firebaseUser` si le token est valide, pour l'utiliser dans les routes.</li>
 * </ul>
 *
 * @param {object} req - Requête Express entrante
 * @param {object} res - Réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {Promise<void>}
 */
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant ou invalide" });
  }

  const idToken = authHeader.split(" ")[1]; // On extrait le token Firebase ID : partie après "Bearer "

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error("Erreur de vérification Firebase:", error);
    return res.status(403).json({ message: "Token Firebase invalide" });
  }
};

module.exports = verifyFirebaseToken;
