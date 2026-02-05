const User = require("../../models/User");
const Conversation = require("../../models/Conversation");
const NotFoundError = require("../../errors/NotFoundError");
const AccessDeniedError = require("../../errors/AccessDeniedError");

/**
 * Vérifie si un utilisateur existe dans la base MongoDB.
 *
 * @param {string} firebaseUid - ID générée par Firebase
 * @returns {Promise<void>} - Lance une erreur si l'utilisateur n'existe pas
 */
async function validateUser(firebaseUid) {
  const user = await User.findOne({ firebaseUid: firebaseUid });
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}

/**
 * Vérifie si une conversation existe dans la base MongoDB.
 *
 * @param {string} conversationId - ID conversation généré par MongoDB
 * @returns {Promise<void>} - Lance une erreur si la conversation n'existe pas
 */
async function validateConversation(conversationId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }
  return conversation;
}

/**
 * Vérifie si une conversation appartient bien à un utilisateur.
 *
 * @param {Conversation} conversation - ID conversation généré par MongoDB
 * @param {string} userId - ID user généré par MongoDB
 * @returns {Promise<void>} - Lance une erreur si la conversation n'appartient pas à l'utilisateur
 */
async function validateConversationBelongsToUser(conversation, userId) {
  if (!conversation.userId.equals(userId)) {
    throw new AccessDeniedError(
      "User is not allowed to access this conversation"
    );
  }
  return conversation;
}

module.exports = {
  validateUser,
  validateConversation,
  validateConversationBelongsToUser,
};
