/**
 * Conversation routes (MongoDB)
 * - Liste des conversations utilisateur
 * - Récupération d'une conversation avec ses messages
 * - Suppression d'une conversation
 */

const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { createUserRateLimiter } = require("../utils/rateLimiter");
const {
  validateUser,
  validateConversation,
  validateConversationBelongsToUser,
} = require("../utils/validation/mongoValidation");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const router = express.Router();
router.use(verifyFirebaseToken);

// --- Rate limiters --- //
const convListRateLimiter = createUserRateLimiter(
  Number(process.env.RATE_LIMIT_CONV_LIST_WINDOW),
  Number(process.env.RATE_LIMIT_CONV_LIST_MAX)
);
const convDeleteRateLimiter = createUserRateLimiter(
  Number(process.env.RATE_LIMIT_CONV_DELETE_WINDOW),
  Number(process.env.RATE_LIMIT_CONV_DELETE_MAX)
);

/**
 * GET /user
 * Récupère toutes les conversations d’un utilisateur.
 */
router.get("/user", convListRateLimiter, async (req, res, next) => {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const user = await validateUser(firebaseUid);

    const conversations = await Conversation.find({ userId: user._id });
    return res.status(200).json({
      message: "Conversations retrieved",
      conversations,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/**
 * GET /onlyone/:conversationId
 * Récupère une conversation spécifique avec ses messages.
 */
router.get(
  "/onlyone/:conversationId",
  convListRateLimiter,
  async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      const firebaseUid = req.firebaseUser.uid;

      const user = await validateUser(firebaseUid);
      const conversation = await validateConversation(conversationId);
      await validateConversationBelongsToUser(conversation, user._id);

      // populate remplace les IDs des messages dans le champs messages par les documents complets
      const conversation_with_messages = await conversation.populate(
        "messages"
      );

      return res.status(200).json({
        message: "Conversation retrieved",
        conversation_with_messages,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

/**
 * DELETE /conversation/:conversationId
 * Supprime une conversation et ses messages associés.
 */
router.delete(
  "/conversation/:conversationId",
  convDeleteRateLimiter,
  async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      const firebaseUid = req.firebaseUser.uid;

      const user = await validateUser(firebaseUid);
      const conversation = await validateConversation(conversationId);
      await validateConversationBelongsToUser(conversation, user._id);

      await Message.deleteMany({ conversationId: conversation._id }); // Supprime tous les messages liés dans la collection Message
      await conversation.deleteOne();

      res.status(200).json({
        message: "Conversation successfully deleted",
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

module.exports = router;
