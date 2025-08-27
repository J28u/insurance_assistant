const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const User = require("../models/User");
const express = require("express");

const router = express.Router();
router.use(verifyFirebaseToken);

// Route pour créer un nouveau user dans MongoDB
router.post("/", async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid; // récupéré du middleware
    const email = req.firebaseUser.email;

    // Vérifier si l'utilisateur n'existe pas déjà
    const userExists = await User.findOne({ firebaseUid: firebaseUid });
    if (userExists) {
      return res
        .status(409)
        .json({ error: "Conflict, utilisateur déjà existant" });
    }

    const new_user = new User({ firebaseUid: firebaseUid, email: email });
    await new_user.save();

    return res.status(201).json({
      message: "User crée avec succès",
      userId: new_user._id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
