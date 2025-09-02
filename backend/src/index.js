const express = require("express");
const app = express();
app.use(express.json()); // permettre à express de parser le JSON dans le corps des requêtes

const PORT = 3000;
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config(); // charge les variables d'environnement (MONGODB_URL) à partir du fichier .env

const cors = require("cors");
app.use(cors()); // pour que notre API accepte les requêtes à partir de toutes les URLs

const conversationRoutes = require("./routes/conversations");
const uploadRoutes = require("./routes/upload");
const retrieverRoutes = require("./routes/retriever");
const userRoutes = require("./routes/users");
const errorHandler = require("./middlewares/errorHandler");

// Connection à MongoDB
async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connexion à MongoDB réussie");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

main().catch((err) => console.log(err)); // exécute la fonction main et catch l'erreur si il y en a une

app.use("/api/conversations", conversationRoutes); // Quand quelqu'un fait une requête sur /api/conversations on lui retourne ce qu'il y a dans conversationRoutes
app.use("/api/upload", uploadRoutes);
app.use("/api/retriever", retrieverRoutes);
app.use("/api/users", userRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
