const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const express = require("express");

const router = express.Router();

// Route pour créer une nouvelle conversation dans MongoDB
router.post("/", async (req, res) => {
  try {
    const { userId, conversationId, messages } = req.body;

    // Vérifier si l'utilisateur existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    let conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      // Vérifier que le message n'est pas vide avant d'accéder à messages[0]
      if (!messages || messages.length === 0) {
        return res.status(400).json({ error: "Aucun message fourni" });
      }

      const title = messages[0].content.slice(0, 30); // Extraire le titre du message

      // Créer la conversation
      conversation = new Conversation({ userId, title });

      await conversation.save(); // Sauvegarder la conversation dans la base de données
    }
    console.log(req.body); // au cas où besoin de débuguer

    // Créer les messages :
    const messageDocs = await Message.insertMany(
      messages.map((msg) => ({
        conversationId: conversation._id,
        role: msg.role,
        content: msg.content,
      }))
    );

    // Ajouter les IDs des messages à la conversation
    conversation.messages.push(...messageDocs.map((msg) => msg._id)); // Mise à jour, ajoute les Ids des nouveaux messages (conserve les anciens d'où les ...)
    console.log(conversation.messages);

    // Sauvegarde la conversation mise à jour
    await conversation.save();

    return res.status(201).json({
      message: "Conversation créee avec succès",
      conversationId: conversation._id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour récupérer les conversations d'un utilisateur dans MongoDB:
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // récupère l'ID à partir des paramètres de la requête

    //Vérifier si l'utilisateur existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Trouver toutes les conversations associées à l'utilisateur
    const conversations = await Conversation.find({ userId });
    return res.status(200).json({
      message: "Conversations récupérées",
      conversations,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
