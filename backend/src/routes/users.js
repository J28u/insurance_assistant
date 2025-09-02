/**
 * User routes (MongoDB)
 * - Création d'utilisateur
 */

const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { createUserRateLimiter } = require("../utils/rateLimiter");
const ConflictError = require("../errors/ConflictError");
const User = require("../models/User");

const router = express.Router();
router.use(verifyFirebaseToken);

// --- Rate limiter --- //
const rateLimiter = createUserRateLimiter(
  parseInt(process.env.RATE_LIMIT_USER_WINDOW),
  parseInt(process.env.RATE_LIMIT_USER_MAX)
);

/**
 * POST /
 * Crée un nouveau user dans MongoDB.
 */
router.post("/", rateLimiter, async (req, res, next) => {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const email = req.firebaseUser.email;

    const userExists = await User.findOne({ firebaseUid: firebaseUid });
    if (userExists) {
      throw new ConflictError("User already exists in database");
    }

    const new_user = new User({ firebaseUid: firebaseUid, email: email });
    await new_user.save();

    return res.status(201).json({
      status: "ok",
      message: "User successfully created",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
