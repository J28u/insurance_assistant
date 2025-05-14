const mongoose = require('mongoose');

// Explicite la structure des données dans la collection Message
const MessageSchema = new mongoose.Schema({
    conversationId: {type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true},
    role : {type: "String", enum:["user", "bot"], required: true},
    content : { type: String, required: true},
    createdAt: {type: Date, default: Date.now},
});

module.exports = mongoose.model('Message', MessageSchema); 
// Créer un modèle Mongoose qui représente la collection MongoDB 'Message' 
// en se basant sur le schéma MessageSchéma qui définit la structure des données dans cette collection

// export : rend le modèle accessible dans d'autres fichiers du projet.