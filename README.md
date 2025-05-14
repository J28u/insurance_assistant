# 🤓☂️ Personal Insurance Chatbot — Fullstack JS (Vite + Express + MongoDB)
Chatbot à déployer en local pour poser des questions sur ses contrats d'assurance sans envoyer ses infos persos à OpenAi. 

## But du projet 
Développer une application capable d'assister un utilisateur dans la compréhension de ses contrats d'assurance, à l'aide d'un chatbot intelligent.

## Etat actuel (Livrables semaine 6 projet fil rouge)

* ✅  Structure du projet mise en place 
* ✅  Connexion à MongoDB via Mongoose 
* ✅  Intégration du LLM (Ollama) 
* ✅  Interface utilisateur basique (clone de DeepSeek) 
* ✅  Application fonctionnelle en local 

Source : [Youtube](https://www.youtube.com/watch?v=y3K4hji9W8g)


## 📁 Structure du projet

```
.
├── backend/                # API Express + Mongoose
│   └── src/
│       └── models/         # Schémas Mongoose pour les collections MongoDB
│       │   ├── Conversation.js 
│       │   ├── Message.js 
│       │   └── User.js
│       └── routes/         # Routes Express pour l'API
│           └── conversations.js # Gestion des routes pour les conversations
│       └── index.js        # Connexion à la base de données et configuration des routes
│
├── frontend/               # Frontend React avec Vite
│   ├── public/             # Fichiers statiques accessibles par le navigateur
│   └── src/
│       ├── assets/         # Ressources pour l'application (images, polices, etc.)
│       ├── components/     # Composants React utilisés dans l'application
│       │   ├── Conversation.jsx
│       │   └── DeepseekInput.jsx
│       ├── App.jsx         # Composant principal définissant l'interface utilisateur (UI)
│       ├── index.css       # Styles globaux pour l'application
│       ├── main.jsx        # Point d'entrée principal du frontend React
│       └── style.css       # Styles spécifiques pour les boutons, spinner et zone de prompt
│
└── README.md               # Fichier de documentation du projet
```


## 🚀 Installation [partie en construction 🚧]

### Prérequis

- Node.js (v18+ recommandé)
- MongoDB (local ou en ligne via MongoDB Atlas)

### 1. Cloner le projet

```bash
git clone https://github.com/<ton-username>/<nom-du-repo>.git
cd <nom-du-repo>
```

### 2. Créer une base MongoDB (pour l'historisation des conversations)
- appeler cette base 'chatbotdb'
- créer une collection users avec un utilisateur dont l'id est 68235ea293d0a7e8eab16d47
- créer un fichier .env dans /backend/src avec les variables suivantes :

```env
MONGODB_URL = mongodb+srv://<db_username>:<db_password>@cluster0.agni83b.mongodb.net/chatbotdb?retryWrites=true&w=majority&appName=Cluster0
```

### 3. Déployer le backend 
- installer les dépendances
```bash
cd backend
npm install
```

* lancer l'api :
```bash
node index.js
```

### 4. Déployer le frontend

- installer les dépendances
```bash
cd frontend
npm install
```

* lancer l'application
```bash
npm run dev
```

## 📡 API - Endpoint principaux
- POST /api/conversations/ : créer une nouvelle conversation
- GET /api/conversations/user/:userId : récupérer les conversations d’un utilisateur
- GET /api/conversations/onlyone/:conversationId : récupérer les messages d’une conversation

## 🧩 Composants React
- DeepseekInput.jsx : champ de message + boutons pour interagir avec le LLM
- Conversation.jsx : affichage de la conversation (titre, messages utilisateur et LLM)
- App.jsx : assemble l’interface

## ✨ Fonctionnalités
- Création d'une conversation
- Envoi de messages à un LLM
- Historisation dans MongoDB
- UI dynamique avec React
