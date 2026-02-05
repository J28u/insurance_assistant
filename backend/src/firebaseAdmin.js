var admin = require("firebase-admin"); // import de la librairie firebase-admin, qui permet de gérer Firebase avec des privilèges élevés

// Objet qui contient les identifiants du service Firebase nécessaires pour authentifier le backend auprès de Firebase.
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // dans .env les retours à la ligne (\n) deviennent des chaînes "\\n", on les retransforme en vrais retours à la ligne
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

// Initialisation de l'application Firebase Admin (si pas déjà fait)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // configure Firebase Admin avec les credentials
  });
}

// Exporte l'instance Firebase Admin pour pouvoir l'utiliser dans le reste du projet avec const admin = require("./firebaseAdmin");
module.exports = admin;
