const mongoose = require('mongoose');

// Explicite la structure des données dans la collection Conversation
const ConversationSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: "Message"}],
    title: {type:String},
    createdAt: {type: Date, default: Date.now}, // Se créer de manière automatique dans la base quand on pousse un élément
    updatedAt: {type: Date, default: Date.now},
});

module.exports = mongoose.model('Conversation', ConversationSchema);
