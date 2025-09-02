const rateLimit = require("express-rate-limit");

/**
 * Crée un rate limiter basé sur l'utilisateur Firebase.
 * @param {number} windowMinutes - Durée de la fenêtre en minutes
 * @param {number} maxRequests - Nombre max de requêtes par fenêtre
 * @param {string} message - Message renvoyé si la limite est atteinte
 */
function createUserRateLimiter(windowMinutes, maxRequests, message) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // convertit minutes en ms
    max: maxRequests,
    keyGenerator: (req) => req.firebaseUser.uid,
    message: {
      status: "error",
      message: message || "Too many requests. Please try again later.",
    },
  });
}

module.exports = {
  createUserRateLimiter,
};
