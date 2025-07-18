// Middleware de vérification du token

// backend/src/middlewares/verifyFirebaseToken.js
const admin = require("../firebaseAdmin");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant ou invalide" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken; // stocke tout le token décodé
    next();
  } catch (error) {
    console.error("Erreur de vérification Firebase:", error);
    return res.status(403).json({ message: "Token Firebase invalide" });
  }
};

module.exports = verifyFirebaseToken;
