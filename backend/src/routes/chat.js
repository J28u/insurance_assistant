/**
 *  Chat routes
 * - Ajoute le system prompt et le contexte à la question de l'utilisateur
 * - Appelle le LLM et retourne la réponse
 */
const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { body } = require("express-validator");
const NotFoundError = require("../errors/NotFoundError");
const Conversation = require("../models/Conversation");
const validateRequest = require("../middlewares/validateRequest");
const { createUserRateLimiter } = require("../utils/rateLimiter");
const { getPromptWithContext } = require("../services/retriever");
const { streamLLMResponse } = require("../utils/llmStreamer");
const {
  createConversation,
  updateConversation,
} = require("../services/conversation");

const router = express.Router();
router.use(verifyFirebaseToken);

// Fonction pour créer un titre propre pour une conversation à partir de la question de l'utilisateur
const cleanTitle = (text, maxLength = 30) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  let truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    truncated = truncated.slice(0, lastSpace);
  }
  return truncated + "…";
};

// Fonction pour gérer la conversation MongoDB
async function handleUserMessage(firebaseUid, conversationId, question) {
  let user_messages = [{ role: "user", content: question }];
  let title = "";
  let conv_id = conversationId;

  const convExists = await Conversation.findById(conversationId);

  if (!convExists) {
    title = cleanTitle(question);
    conv_id = await createConversation(firebaseUid, title, user_messages);
  } else {
    title = convExists.title;
    await updateConversation(firebaseUid, conv_id, user_messages);
  }

  return { conv_id, title };
}

function setChatHeaders(res, convId, title) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Conversation-Id", convId);
  res.setHeader("X-Conversation-Title", encodeURIComponent(title));
  res.setHeader(
    "Access-Control-Expose-Headers",
    "X-Conversation-Id, X-Conversation-Title"
  );
}

// --- Rate limiters --- //
const chatRateLimiter = createUserRateLimiter(
  Number(process.env.RATE_LIMIT_CHAT_WINDOW),
  Number(process.env.RATE_LIMIT_CHAT_MAX)
);
const contextRateLimiter = createUserRateLimiter(
  Number(process.env.RATE_LIMIT_CONTEXT_WINDOW),
  Number(process.env.RATE_LIMIT_CONTEXT_MAX)
);

/**
 * POST /chat
 *
 * Route qui permet à un utilisateur de poser une question au LLM.
 *
 * - Crée ou met à jour la conversation dans MongoDB avec le message de l'utilisateur.
 * - Appelle le LLM en streaming et renvoie la réponse progressivement au frontend.
 * - Retourne les headers `X-Conversation-Id` et `X-Conversation-Title` pour permettre
 *   au frontend de rattacher la conversation.
 *
 * Corps de la requête (JSON) :
 * {
 *   "question": "string",                // Question de l'utilisateur
 *   "userPreviousMessages": [ ... ],     // Messages précédents du chat
 *   "conversationId": "string",          // Id de la conversation existante
 * }
 *
 * Réponse :
 * - Flux texte en temps réel via res.write() (streaming de la réponse du LLM)
 * - Headers exposés :
 *   - X-Conversation-Id : l'ID de la conversation MongoDB
 *   - X-Conversation-Title : le titre de la conversation
 */
router.post(
  "/",
  chatRateLimiter,
  [
    body("question")
      .isString()
      .trim()
      .notEmpty()
      .isLength({ max: Number(process.env.QUESTION_SIZE_MAX) }),
    body("userPreviousMessages")
      .optional()
      .isArray({ max: process.env.MAX_PREVIOUS_MESSAGES })
      .custom((messages) => {
        // vérifie que chaque message a bien role et content
        return messages.every(
          (msg) =>
            msg &&
            typeof msg.role === "string" &&
            typeof msg.content === "string"
        );
      }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { question, userPreviousMessages, conversationId } = req.body;
      const firebaseUid = req.firebaseUser.uid;

      if (!question) {
        throw new NotFoundError("Missing question");
      }

      // Mise à jour - Création de la conversation MongoDB
      const { conv_id, title } = await handleUserMessage(
        firebaseUid,
        conversationId,
        question
      );

      setChatHeaders(res, conv_id, title);

      // Préparation du prompt
      const systemPrompt = process.env.SYSTEM_PROMPT;
      const prompt_with_context = await getPromptWithContext(
        question,
        firebaseUid
      );

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...userPreviousMessages,
        { role: "user", content: prompt_with_context },
      ];

      // Stream vers le frontend + récupération de la réponse complète
      const controller = new AbortController();
      req.on("close", () => controller.abort()); // stop LLM si client part
      const answer = await streamLLMResponse(messages, controller.signal, res);

      // Mise à jour de la conversation avec réponse :
      await updateConversation(firebaseUid, conv_id, [
        { role: "assistant", content: answer },
      ]);

      res.end();
    } catch (err) {
      console.error(err);
      res.end("Internal server error");
    }
  }
);

/**
 * GET /context
 * Récupère le contexte utilisé pour répondre à la question
 */
router.get("/context", contextRateLimiter, async (req, res, next) => {
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

module.exports = router;
