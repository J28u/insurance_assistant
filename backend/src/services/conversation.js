const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const {
  validateUser,
  validateConversation,
  validateConversationBelongsToUser,
} = require("../utils/validation/mongoValidation");

async function createConversation(firebaseUid, title, messages = []) {
  const user = await validateUser(firebaseUid);
  const userId = user._id;

  const conversation = new Conversation({ userId, title });
  await conversation.save();

  if (messages.length > 0) {
    await Message.insertMany(
      messages.map((msg) => ({
        conversationId: conversation._id,
        role: msg.role,
        content: msg.content,
      }))
    );
  }

  return conversation._id;
}

async function updateConversation(firebaseUid, conversationId, messages = []) {
  const user = await validateUser(firebaseUid);
  const conversation = await validateConversation(conversationId);
  await validateConversationBelongsToUser(conversation, user._id);

  if (messages.length > 0) {
    const messageDocs = await Message.insertMany(
      messages.map((msg) => ({
        conversationId,
        role: msg.role,
        content: msg.content,
      }))
    );
    // Mise à jour de la conversation : ajoute les IDs des nouveaux messages à la conversation (conserve les anciens d'où les '...')
    conversation.messages.push(...messageDocs.map((msg) => msg._id));
    await conversation.save();
  }
}

module.exports = { createConversation, updateConversation };
