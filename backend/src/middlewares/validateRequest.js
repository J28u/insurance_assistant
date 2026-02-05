const { validationResult } = require("express-validator");
const ValidationError = require("../errors/ValidationError");

/**
 * Middleware Express pour valider les paramètres d'une requête
 *
 * @param {object} req - Requête Express
 * @param {object} res - Réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {Promise<void>}
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new ValidationError("Invalid input");
  }
  next();
};

module.exports = validateRequest;
