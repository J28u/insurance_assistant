import React, { useState, useRef, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import app from "./firebase";
import {
  MessageSquare,
  FileStack,
  Trash2,
  Ellipsis,
  Pencil,
} from "lucide-react";
import "./style.css";
import Home from "./components/Home.jsx";
import Chat from "./components/Chat.jsx";
import Library from "./components/Library.jsx";
import SignIn from "./components/SignIn.jsx";
import SignUp from "./components/SignUp.jsx";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// ------------------------------------STYLE----------------------------------------------------

const styles = {
  container: {
    display: "flex",
    width: "100vw",
    minHeight: "100vh",
    overflowY: "auto",
  },
  sideBar: {
    width: "300px",
    backgroundColor: "#F5F8F5",
    padding: "10px",
    borderRight: "none",
    overflowY: "auto", // Permet le défilement vertical si le contenu dépasse la hauteur de l'élément.
  },
  mainContent: {
    width: "100vw",
    overflowY: "auto",
    height: "100vh",
  },
  appLogo: {
    width: "125px",
    marginTop: "15px",
    marginLeft: "5px",
    color: "#2c2c36",
  },
  timeLabel: {
    // style des catégories de conversations (7jours, hier, 30 jours)
    fontSize: "14px",
    color: "rgb(59, 58, 58)",
    padding: "8px",
    marginTop: "8px",
    fontWeight: "600",
  },
};

// ---------------------------------------------------------------------------------------------

function App() {
  const [view, setView] = useState("home"); // affichage dans la partie "Main Content" - par défaut l'accueil
  const [conversationId, setConversationId] = useState(undefined);
  const containerRef = useRef(null);
  const [response, setResponse] = useState(""); // affiche dynamiquement la réponse du LLM
  const [loading, setLoading] = useState(false); // affiche un spinner quand le LLM en phase de calcul
  const [prompt, setPrompt] = useState("");
  const [conversations, setConversations] = useState([]); // stocke toutes les conversations
  const [timeCategories, setTimeCategories] = useState([]); // infos dans la sidebar
  const [conversationTitle, setConversationTitle] = useState("");
  const [convLoading, setConvLoading] = useState(false); // spinner quand conversations en train de se charger depuis la base de données
  const [messages, setMessages] = useState([]);
  const [showFirstMessages, setShowFirstMessages] = useState(false);
  const [newChat, setNewChat] = useState(true);
  const [newConversation, setNewConversation] = useState(false);
  const [contrats, setContrats] = useState([
    "CG_habitation_RP_protectrice.pdf",
  ]);
  const [menuVisibleId, setMenuVisibleId] = useState(null);
  const menuRefs = useRef({}); // clé = conversation._id, valeur = ref DOM
  const [firebaseUser, setfirebaseUser] = useState(null);
  const [showSignIn, setShowSignIn] = useState(true);
  const [context, setContext] = useState([]);

  // ------------------------------------- FONCTIONS -------------------------------------------------------------

  const fetchConversation = async (firebaseUser) => {
    // Récupère tous les messages associés à une conversation :
    const token = await firebaseUser.getIdToken();
    if (conversationId !== undefined) {
      setConvLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/api/conversations/onlyone/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Conversations:", response.data);
        setConvLoading(false); // vire le spinner
        setMessages(response.data.conversation.messages); // met à jour les messages
      } catch (error) {
        console.error(
          "Error fetching conversations:",
          error.response ? error.response.data : error.message
        );
      }
    }
  };

  const getUserConversations = async (firebaseUser) => {
    // Récupère toutes les conversations associées à un user Id (messageId dans conversation, pas texte)
    try {
      const token = await firebaseUser.getIdToken();

      const response = await axios.get(`${API_URL}/api/conversations/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Conversations:", response.data);
      setConversations(response.data.conversations);
      categorizeConversations(response.data.conversations);
    } catch (error) {
      console.error(
        "Error fetching conversations:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const categorizeConversations = (conversations) => {
    // Regroupe les conversations par date (auj, veille, 7 dernières jours, 30 derniers jours)
    const today = new Date();
    const oneDay = 1000 * 60 * 60 * 24; // combien de millisecondes dans une journée (car Date exprimées en millisecondes)
    const categories = {
      Today: [],
      Yesterday: [],
      "Last 7 Days": [],
      "Last 30 Days": [],
    };

    conversations.forEach((conversation) => {
      const updateAt = new Date(conversation.updatedAt);
      const diffDays = Math.floor((today - updateAt) / oneDay); // nombre de jours entre auj et la dernière fois que la conversation a été mise à jour
      console.log(categories);
      console.log(diffDays);
      if (diffDays === 0) {
        categories.Today.push(conversation);
      } else if (diffDays === 1) {
        categories.Yesterday.push(conversation);
      } else if (diffDays > 1 && diffDays <= 7) {
        categories["Last 7 Days"].push(conversation);
      } else if (diffDays > 7 && diffDays <= 90) {
        categories["Last 30 Days"].push(conversation);
      }
    });
    // Trie array de conversations : plus récemment modifiée en début de liste.
    Object.keys(categories).forEach((key) => {
      categories[key].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    });
    setTimeCategories(categories);
  };

  const deleteConversation = async (firebaseUser, conversationId) => {
    // Supprime une conversation et tous les messages associés
    try {
      const token = await firebaseUser.getIdToken();
      const response = await axios.delete(
        `${API_URL}/api/conversations/conversation/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error(
        "Error deleting conversations:",
        error.response ? error.response.data : error.message
      );
    }
  };

  // Fonction pour se déconnecter de l'app
  const handleLogout = () => {
    const auth = getAuth(app);
    signOut(auth)
      .then(() => {
        setfirebaseUser(null);
      })
      .catch((error) => {
        console.error("Erreur déconnexion:", error);
      });
  };

  // --------------------------------------------------- HOOKS REACT ------------------------------------------------------------------------------
  // S'exécutent une seule fois au chargement du composant App pour installer des "écouteurs" permanents

  // Écoute les changements d’état d’authentification de Firebase (utilisateur se connecte, se déconnecte, session expire/invalidée, session persistée, refresh du token) :
  useEffect(() => {
    const auth = getAuth(app); // récupère l'instance d'authentification Firebase liée à l'app Firebase
    // Chaque fois que l’état de l’authentification de Firebase change, cette fonction de callback est appelée.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setfirebaseUser(user); // Si l'utilisateur est connecté, on le stocke dans l'état React
      } else {
        setfirebaseUser(null); // Si non le met à null
      }
    });

    return () => unsubscribe(); // Lors du démontage du composant, on arrête l'écoute des changements d'authentification avec la fonction unsubscribe.
  }, []);

  // Ecoute si utilisateur connecté -> récupère les conversations historisées)
  useEffect(() => {
    if (firebaseUser) {
      setTimeCategories([]);
      getUserConversations(firebaseUser);
    }
  }, [firebaseUser, newConversation]);

  //Dès que la variable conversationId change, si pas un nouveau chat, on fait une requête à notre application back end pour récupérer tous les messages associés
  useEffect(() => {
    if (!newChat) {
      fetchConversation(firebaseUser);
    }
  }, [conversationId]);

  // Forcer le scroll jusqu'en bas :
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight; // force le scroll jusqu'en bas
    }
  }, [messages]); // chaque fois que la variable messages se met à jour, on scrolle tout en bas du container

  useEffect(() => {
    // Quand conversationId ou showFirstMessages changent, vérifie si l’un des deux est défini. Si oui, passe la vue à chat.
    if (conversationId || showFirstMessages) {
      setView("chat");
    }
  }, [conversationId, showFirstMessages]);

  // Clic en dehors du menu = fermer
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuVisibleId &&
        menuRefs.current[menuVisibleId] &&
        menuRefs.current[menuVisibleId].current && // vérifier que current existe
        !menuRefs.current[menuVisibleId].current.contains(event.target)
      ) {
        setMenuVisibleId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuVisibleId]);

  // ----------------------------------------------------------------------------------------------------------------------------------
  // Prépare les refs ici, AVANT le return
  Object.values(timeCategories).forEach((convs) => {
    convs.forEach((conversation) => {
      if (!menuRefs.current[conversation._id]) {
        menuRefs.current[conversation._id] = React.createRef();
      }
    });
  });
  // -----------------------------------------------AFFICHAGE-----------------------------------

  return (
    <>
      {!firebaseUser ? (
        showSignIn ? (
          <SignIn
            onLoginSuccess={(user) => setFirebaseUser(user)}
            switchToSignUp={() => setShowSignIn(false)}
          />
        ) : (
          <SignUp
            onLoginSuccess={(user) => setFirebaseUser(user)}
            switchToSignIn={() => setShowSignIn(true)}
          />
        )
      ) : (
        <div style={styles.container}>
          <div style={styles.sideBar}>
            <div style={styles.appLogo}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="116.55"
                height="27.082"
                version="1.1"
                viewBox="0 0 116.55 27.082"
              >
                <g transform="translate(-49.608 -1.6152)">
                  <g transform="translate(-13.502 -2.4774)">
                    <path
                      d="m65.61 31.124c-0.15625 0-0.26562-0.0078-0.32812-0.03125-1.2422-0.11328-1.9297-0.86719-2.0625-2.2656v-2.1719c0.01953-0.23828 0.03125-0.48828 0.03125-0.75v-0.8125-3.1719-0.78125c0-0.26953-0.01172-0.53906-0.03125-0.8125v-7.4688c-0.02344-0.17578-0.03125-0.35938-0.03125-0.54688v-0.54688-1.6719l-0.04687-1.0938v-0.53125c-0.02344-0.05078-0.03125-0.12891-0.03125-0.23438v-0.17188c0-0.97656 0.17188-1.75 0.51562-2.3125 0.34375-0.57031 1.0312-0.85938 2.0625-0.85938l0.09375-0.03125h0.03125c0.97656 0.07422 1.6875 0.39062 2.125 0.95312 0.44531 0.5625 0.80469 1.2266 1.0781 1.9844 0.03906 0.17969 0.09766 0.33594 0.17188 0.46875 0.0625 0.10547 0.11328 0.26172 0.15625 0.46875l1.4062 3.0625c0.15625 0.35547 0.32031 0.89844 0.5 1.625 0.17578 0.71875 0.39453 1.5117 0.65625 2.375 0.26953 0.86719 0.60156 1.7109 1 2.5312 0.5625-2.375 1.0625-4.457 1.5-6.25 0.44531-1.7891 0.82812-3.2266 1.1406-4.3125 0.17578-0.78125 0.53125-1.5039 1.0625-2.1719 0.44531-0.64453 1.0703-0.96875 1.875-0.96875 0.86328 0 1.5039 0.29688 1.9219 0.89062 0.42578 0.58594 0.64844 1.2891 0.67188 2.1094v0.10938c0.01953 0.21875 0.03516 0.42969 0.04687 0.625 0.0078 0.19922 0.01563 0.41406 0.01563 0.64062v0.32812 0.17188c0 0.0625-0.01172 0.11719-0.03125 0.15625v1c0.01953 0.15625 0.03125 0.3125 0.03125 0.46875v0.46875 0.46875c0 0.15625 0.0078 0.32422 0.03125 0.5l0.10938 2.2344 0.39062 14.031v0.23438c0 0.51172-0.10938 0.96094-0.32812 1.3438-0.21875 0.38672-0.62109 0.57812-1.2031 0.57812h-0.03125c-1.0234-0.01953-1.6328-0.78516-1.8281-2.2969-0.04297-0.21875-0.07813-0.42578-0.10938-0.625-0.02344-0.19531-0.03125-0.38281-0.03125-0.5625v-0.10938c0-0.78125 0.0039-1.5938 0.01563-2.4375 0.0078-0.84375 0.03125-1.707 0.0625-2.5938l0.03125-0.53125c0.01953-0.78125 0.03516-1.5391 0.04687-2.2812 0.0078-0.75 0.01563-1.4766 0.01563-2.1875 0-0.72656-0.0078-1.3477-0.01563-1.8594-0.01172-0.50781-0.03906-1.0078-0.07813-1.5-0.09375 0.35547-0.1875 0.73438-0.28125 1.1406-0.08594 0.39844-0.17188 0.8125-0.26562 1.25-0.08594 0.44922-0.17188 0.875-0.26562 1.2812-0.08594 0.39844-0.18359 0.76172-0.29688 1.0938-0.33594 1.1055-0.65234 2.2422-0.95312 3.4062-0.29297 1.168-0.58594 2.3867-0.875 3.6562v0.03125c-0.13672 0.42969-0.42969 0.70312-0.875 0.82812-0.15625 0.07422-0.32422 0.10938-0.5 0.10938-0.0625 0-0.13281-0.0039-0.20312-0.01563-0.0625-0.0078-0.13672-0.03125-0.21875-0.0625h-0.10938c-0.02344-0.01953-0.04297-0.03125-0.0625-0.03125-0.46875-0.19531-0.75781-0.5625-0.85938-1.0938l-0.3125-0.70312c-0.21874-0.64453-0.48437-1.2734-0.79687-1.8906-0.33594-0.85156-0.68359-1.875-1.0469-3.0625-0.36719-1.1875-0.74609-2.3945-1.1406-3.625-0.38672-1.2266-0.80469-2.3203-1.25-3.2812v2.7969c0 1.293 0.0039 2.5078 0.01563 3.6406 0.01953 1.125 0.04687 2.2773 0.07813 3.4531 0.03125 1.1797 0.05469 2.5117 0.07813 4 0.01953 0.07422 0.03125 0.14062 0.03125 0.20312v0.17188 0.32812c0 0.19922-0.0078 0.38672-0.01563 0.5625-0.01172 0.17969-0.02734 0.35547-0.04687 0.53125v0.10938c-0.0625 0.6875-0.30859 1.2461-0.73438 1.6719-0.41797 0.41797-0.98438 0.625-1.7031 0.625zm20.203 0c-0.76172-0.03906-1.3086-0.26953-1.6406-0.6875-0.33594-0.42578-0.5-1-0.5-1.7188v-0.32812-0.15625c0-0.07031 0.0078-0.14062 0.03125-0.20312 0.25-1.9375 0.51562-3.8945 0.79688-5.875 0.28906-1.9766 0.62891-3.9219 1.0156-5.8281 0.4375-2.3125 0.87891-4.2812 1.3281-5.9062 0.44531-1.6328 0.92578-3 1.4375-4.0938 0.61328-1.082 1.3672-1.6914 2.2656-1.8281 0.0625-0.01953 0.14844-0.03125 0.26562-0.03125h0.20312c0.75 0 1.5156 0.32031 2.2969 0.95312 0.72656 0.74219 1.3828 1.8516 1.9688 3.3281 0.59375 1.4805 1.125 3.3984 1.5938 5.75 0.39453 1.9297 0.71875 3.918 0.96875 5.9688 0.25781 2.043 0.48438 3.9297 0.67188 5.6562l0.125 1.1719c0.01953 0.0625 0.03125 0.13281 0.03125 0.20312v0.15625 0.375c0 0.59375-0.08984 1.1328-0.26562 1.6094-0.17969 0.48047-0.58984 0.82031-1.2344 1.0156h-0.32812c-0.51172 0-0.89062-0.20312-1.1406-0.60938-0.24219-0.41406-0.38281-0.84375-0.42188-1.2812-0.15625-1.7188-0.32422-3.2656-0.5-4.6406l-5.7344 0.64062c-0.09375 0.57422-0.18359 1.1562-0.26562 1.75-0.07422 0.58594-0.14062 1.1875-0.20312 1.8125-0.11719 0.82422-0.38672 1.4961-0.8125 2.0156-0.41797 0.52344-1.0703 0.78125-1.9531 0.78125zm3.7656-9.5625 4.7969-0.46875-0.03125-0.17188c-0.15625-1.0625-0.3125-2.2188-0.46875-3.4688-0.15625-1.2578-0.37109-2.5508-0.64062-3.875-0.26172-1.3203-0.63672-2.5938-1.125-3.8125-0.02344-0.13281-0.05469-0.23438-0.09375-0.29688l-0.10938-0.14062-0.0625 0.03125c-0.19922 1.0234-0.4375 2.2422-0.71875 3.6563-0.28125 1.4062-0.5625 2.8555-0.84375 4.3438-0.27344 1.4922-0.50781 2.8906-0.70312 4.2031zm17.801 9.5625c-1.5625 0-2.8438-0.44141-3.8438-1.3281-1-0.89453-1.7578-2.0391-2.2656-3.4375-0.51172-1.4258-0.85156-2.8789-1.0156-4.3594-0.16797-1.4883-0.25-2.8594-0.25-4.1094v-0.4375c0.0508-1.3516 0.16406-2.7891 0.34375-4.3125 0.17578-1.5195 0.55078-2.9883 1.125-4.4063 0.58203-1.332 1.4062-2.4375 2.4688-3.3125 1.0625-0.88281 2.4609-1.3281 4.2031-1.3281 1.75 0 3.0469 0.44922 3.8906 1.3438 0.84375 0.88672 1.4219 2.1836 1.7344 3.8906 0.0703 0.29297 0.10938 0.63672 0.10938 1.0313v0.10938c0 0.41797-0.0859 0.80859-0.25 1.1719-0.16797 0.36719-0.50781 0.54688-1.0156 0.54688h-0.0469c-0.59375-0.10156-1.0312-0.4375-1.3125-1-0.27344-0.57031-0.48437-1.1797-0.64062-1.8281-0.15625-0.64453-0.35938-1.1562-0.60938-1.5312l-0.32812-0.35938c-0.27344-0.20703-0.53907-0.3125-0.79688-0.3125-0.17969 0-0.33594 0.03906-0.46875 0.10938h-0.0312l-0.5 0.15625c-0.71875 0.3125-1.293 0.83594-1.7188 1.5625-0.41797 0.71875-0.73047 1.543-0.9375 2.4688-0.21094 0.91797-0.35156 1.8281-0.42187 2.7344-0.0625 0.89844-0.0937 1.6875-0.0937 2.375 0 0.71094 0.0352 1.5859 0.10937 2.625 0.082 1.0312 0.21875 2.0938 0.40625 3.1875 0.1875 1.0859 0.45313 2.0898 0.79688 3.0156 0.34375 0.91797 0.78515 1.6211 1.3281 2.1094 0.25781 0.19922 0.55469 0.29688 0.89063 0.29688 0.25 0 0.53906-0.06641 0.875-0.20312 0.59375-0.39453 1.0039-0.91016 1.2344-1.5469 0.23828-0.63281 0.42578-1.332 0.5625-2.0938 0.0625-0.59375 0.1875-1.1484 0.375-1.6719 0.1875-0.51953 0.58204-0.82812 1.1875-0.92188h0.0625c0.5625 0 0.94532 0.21094 1.1562 0.625 0.20704 0.40625 0.3125 0.84375 0.3125 1.3125v0.09375c-0.043 1.2734-0.30468 2.4688-0.78125 3.5938-0.48046 1.1172-1.1523 2.043-2.0156 2.7812h-0.0312c-1.1797 0.90625-2.4453 1.3594-3.7969 1.3594zm10.098 0c-0.76172-0.03906-1.3086-0.26953-1.6406-0.6875-0.33594-0.42578-0.5-1-0.5-1.7188v-0.32812-0.15625c0-0.07031 8e-3 -0.14062 0.0312-0.20312 0.25-1.9375 0.51563-3.8945 0.79688-5.875 0.28906-1.9766 0.6289-3.9219 1.0156-5.8281 0.4375-2.3125 0.87891-4.2812 1.3281-5.9062 0.44531-1.6328 0.92578-3 1.4375-4.0938 0.61328-1.082 1.3672-1.6914 2.2656-1.8281 0.0625-0.01953 0.14844-0.03125 0.26563-0.03125h0.20312c0.75 0 1.5156 0.32031 2.2969 0.95312 0.72656 0.74219 1.3828 1.8516 1.9688 3.3281 0.59375 1.4805 1.125 3.3984 1.5938 5.75 0.39453 1.9297 0.71875 3.918 0.96875 5.9688 0.25781 2.043 0.48437 3.9297 0.67187 5.6562l0.125 1.1719c0.0195 0.0625 0.0312 0.13281 0.0312 0.20312v0.15625 0.375c0 0.59375-0.0898 1.1328-0.26562 1.6094-0.17969 0.48047-0.58985 0.82031-1.2344 1.0156h-0.32812c-0.51172 0-0.89063-0.20312-1.1406-0.60938-0.24219-0.41406-0.38281-0.84375-0.42187-1.2812-0.15625-1.7188-0.32422-3.2656-0.5-4.6406l-5.7344 0.64062c-0.0937 0.57422-0.18359 1.1562-0.26562 1.75-0.0742 0.58594-0.14063 1.1875-0.20313 1.8125-0.11719 0.82422-0.38672 1.4961-0.8125 2.0156-0.41797 0.52344-1.0703 0.78125-1.9531 0.78125zm3.7656-9.5625 4.7969-0.46875-0.0312-0.17188c-0.15625-1.0625-0.3125-2.2188-0.46875-3.4688-0.15625-1.2578-0.3711-2.5508-0.64063-3.875-0.26172-1.3203-0.63672-2.5938-1.125-3.8125-0.0234-0.13281-0.0547-0.23438-0.0937-0.29688l-0.10937-0.14062-0.0625 0.03125c-0.19922 1.0234-0.4375 2.2422-0.71875 3.6563-0.28125 1.4062-0.5625 2.8555-0.84375 4.3438-0.27344 1.4922-0.50782 2.8906-0.70313 4.2031zm13.262 9.5625c-0.51172 0-0.92969-0.1875-1.25-0.5625-0.32422-0.38281-0.55859-0.84375-0.70313-1.375-0.14843-0.53125-0.21875-1.0039-0.21875-1.4219v-0.60938c0-0.25781 4e-3 -0.53125 0.0156-0.8125 8e-3 -0.28125 0.0312-0.55078 0.0625-0.8125 0.0195-0.11328 0.0312-0.21094 0.0312-0.29688v-0.28125-0.42188c0.0195-0.25 0.0312-0.5 0.0312-0.75v-0.75-2.9688c-0.0234-0.25-0.0312-0.49219-0.0312-0.73438v-0.73438-1.4375c-0.0234-0.17578-0.0312-0.35938-0.0312-0.54688v-0.51562-1.9375c-0.0312-0.3125-0.0469-0.63281-0.0469-0.96875v-0.95312-0.90625c-0.0234-0.11328-0.0312-0.22656-0.0312-0.34375v-0.35938-2.2969-0.25c0-0.07031 8e-3 -0.14453 0.0312-0.21875 0.0312-0.0625 0.0469-0.125 0.0469-0.1875v-0.20312-0.90625c0-0.55078 0.20313-1 0.60938-1.3438 0.41406-0.34375 0.85156-0.60938 1.3125-0.79688 0.48828-0.14453 1.125-0.21875 1.9062-0.21875 1.1562 0 2.2969 0.18359 3.4219 0.54688 1.1328 0.36719 2.1758 0.89844 3.125 1.5938 0.94531 0.69922 1.7031 1.5469 2.2656 2.5469s0.84375 2.125 0.84375 3.375v0.32812 0.17188c0 0.0625-0.0117 0.11719-0.0312 0.15625-0.0625 0.625-0.16797 1.2266-0.3125 1.7969-0.14844 0.5625-0.36719 1.1016-0.65625 1.6094l-0.0312 0.125c-0.79297 1.3867-2.0117 2.6016-3.6562 3.6406l0.46875 1.4375c0.0391 0.17969 0.10156 0.33594 0.1875 0.46875 0.0937 0.14844 0.14844 0.29688 0.17188 0.45312 0.15625 0.44922 0.30468 0.90625 0.45312 1.375 0.14453 0.46875 0.23828 0.80469 0.28125 1 0.0391 0.19922 0.0937 0.40625 0.15625 0.625 0.0703 0.21094 0.15625 0.43359 0.25 0.67188 0.10156 0.25 0.21094 0.48438 0.32813 0.70312 0.11328 0.21875 0.23437 0.41797 0.35937 0.59375 0.17578 0.25 0.35156 0.46094 0.53125 0.625 0.1875 0.16797 0.39844 0.19531 0.64063 0.07813 0.17578-0.03906 0.34375-0.03906 0.5 0 0.15625 0.0625 0.32031 0.35156 0.5 0.85938 0.19531 0.49219 0.19531 0.85156 0 1.0781-0.19922 0.21875-0.41407 0.38672-0.64063 0.5l-0.15625 0.125c-0.25 0.15625-0.5 0.26562-0.75 0.32812-0.24219 0.05469-0.48047 0.07813-0.71875 0.07813-0.3125 0-0.60937-0.03125-0.89062-0.09375-0.27344-0.07031-0.52344-0.14844-0.75-0.23438-0.77344-0.38281-1.4922-1.2422-2.1562-2.5781-0.3125-0.61328-0.57032-1.2031-0.76563-1.7656-0.19922-0.57031-0.42187-1.2109-0.67187-1.9219l-1.0313-2.7812-0.29687 0.07813v0.26562l0.0312 0.59375v4.2656c0 0.6875-0.0859 1.3867-0.25 2.0938-0.16797 0.69922-0.33984 1.1875-0.51563 1.4688-0.35546 0.42969-0.875 0.64062-1.5625 0.64062zm2.6719-16.859v0.34375c0 0.125 8e-3 0.24219 0.0312 0.34375v2.8125c0.082 0.21875 0.22266 0.32812 0.42188 0.32812h0.0469c0.0625 0 0.22656-0.03125 0.5-0.09375 0.25781-0.09375 0.67188-0.29688 1.2344-0.60938 0.84375-0.55078 1.5391-1.25 2.0938-2.0938 0.55078-0.84375 0.82812-1.7734 0.82812-2.7969v-0.64062c-0.10547-0.88281-0.46875-1.6758-1.0938-2.375-0.625-0.70703-1.4688-1.2578-2.5312-1.6562-0.25-0.0625-0.45312-0.10938-0.60937-0.14062-0.15625-0.03906-0.31251-0.0625-0.46876-0.0625h-0.0312c0 0.02344-0.0234 0.03125-0.0625 0.03125-0.17968 0.09375-0.28906 0.19922-0.32812 0.3125l0.0312 0.65625v0.53125l-0.0625 1.9375v0.03125c-0.0547 0.25-0.0547 0.49609 0 0.73438 0.0195 0.13672 0.0312 0.27344 0.0312 0.40625v0.35938zm17.898 16.859c-0.23047 0-0.45312-0.01563-0.67187-0.04687-0.21875-0.03125-0.45313-0.07031-0.70313-0.125-1.1562-0.19531-2.125-0.73438-2.9062-1.6094-0.77343-0.875-1.3906-1.9375-1.8594-3.1875-0.49219-1.2891-0.82422-2.5547-1-3.7969-0.17969-1.2383-0.29688-2.3828-0.35938-3.4375v-0.09375c-0.0312-0.3125-0.0547-0.59766-0.0625-0.85938-0.0117-0.26953-0.0156-0.53906-0.0156-0.8125 0-1.6445 0.14453-3.332 0.4375-5.0625 0.28907-1.7266 0.91016-3.3047 1.8594-4.7344h0.0469c0.72656-1.1328 1.6484-1.9219 2.7656-2.3594 0.78907-0.38281 1.7227-0.57812 2.7969-0.57812 1.5703 0 2.8594 0.42969 3.8594 1.2812 1 0.84375 1.7812 1.9453 2.3438 3.2969 0.55079 1.375 0.91016 2.8047 1.0781 4.2813 0.16406 1.4805 0.25 2.8516 0.25 4.1094 0 1.1562-0.0742 2.3672-0.21875 3.625-0.14844 1.25-0.39844 2.4805-0.75 3.6875-0.35547 1.1992-0.83594 2.2812-1.4375 3.25-0.59375 0.96094-1.3438 1.7305-2.25 2.3125-0.89843 0.57422-1.9648 0.85938-3.2031 0.85938zm-2.7031-14.125c0 0.96875 0.0469 2.0117 0.14062 3.125 0.10157 1.1172 0.27344 2.2109 0.51563 3.2812 0.25 1.0625 0.60937 2.0391 1.0781 2.9219 0.53125 1 1.082 1.5312 1.6562 1.5938h0.10938c0.0195 0.02344 0.0508 0.03125 0.0937 0.03125 0.44531 0 0.85937-0.15625 1.2344-0.46875 0.375-0.32031 0.70703-0.70703 1-1.1562 0.28907-0.44531 0.48828-0.84766 0.59375-1.2031l0.20313-0.53125c0.3125-1.1953 0.51562-2.4688 0.60937-3.8125 0.10157-1.3438 0.15625-2.6406 0.15625-3.8906 0-0.59375-0.0234-1.3438-0.0625-2.25-0.043-0.91406-0.15234-1.8633-0.32812-2.8438-0.17969-0.97656-0.46094-1.8516-0.84375-2.625-0.375-0.78125-0.89844-1.3281-1.5625-1.6406-0.19922-0.09375-0.44531-0.14062-0.73438-0.14062-0.53125 0-1.0078 0.1875-1.4219 0.5625-0.40625 0.36719-0.7461 0.79688-1.0156 1.2969-0.26172 0.5-0.46875 0.9375-0.625 1.3125-0.3125 1.043-0.52734 2.1055-0.64062 3.1875-0.10547 1.0742-0.15625 2.1562-0.15625 3.25zm14.758 14.125c-0.59375 0-1.0547-0.16406-1.375-0.5-0.32422-0.33203-0.54297-0.75-0.65625-1.25-0.11718-0.5-0.17187-1.0156-0.17187-1.5469v-0.46875-0.1875c0-0.07031 8e-3 -0.14453 0.0312-0.21875v-0.32812c0-0.13281 0.0156-0.23438 0.0469-0.29688 0.0195-0.3125 0.0312-0.63281 0.0312-0.96875v-1.0312-2c0-1.1562-0.0156-2.4141-0.0469-3.7812-0.0234-1.3633-0.0312-2.5938-0.0312-3.6875l-0.0312-4v-2.7656c0-0.59375 0.0625-1.1602 0.1875-1.7031 0.125-0.55078 0.36328-0.99219 0.71875-1.3281 0.35156-0.33203 0.86328-0.5 1.5312-0.5 0.70703 0.02344 1.2734 0.23047 1.7031 0.625 0.4375 0.38672 0.80078 0.87109 1.0938 1.4531 0.28907 0.57422 0.54688 1.1836 0.76563 1.8281l0.10937 0.1875c0.0195 0.09375 0.0469 0.18359 0.0781 0.26562 0.0312 0.07422 0.0547 0.15234 0.0781 0.23438 0.0195 0.09375 0.0391 0.17969 0.0625 0.25 0.0312 0.0625 0.0547 0.125 0.0781 0.1875l0.23437 0.53125c0.17578 0.33594 0.42188 0.91797 0.73438 1.75 0.3125 0.83594 0.67187 1.8242 1.0781 2.9688 0.40625 1.1484 0.85157 2.3867 1.3438 3.7188 0.48828 1.3359 0.98828 2.6797 1.5 4.0312 0.0312-0.09375 0.0469-0.20312 0.0469-0.32812v-0.4375c-0.0312-0.17578-0.0469-0.32812-0.0469-0.45312v-0.3125-0.14062c0-1.082 4e-3 -1.9688 0.0156-2.6562 0.0195-0.6875 0.0312-1.3281 0.0312-1.9219v-1.9844-0.03125c0-0.72656-0.0469-1.5195-0.14063-2.375-0.0937-0.86328-0.1875-1.7188-0.28125-2.5625-0.0859-0.84375-0.125-1.6094-0.125-2.2969v-0.35938c-0.0234-0.05078-0.0312-0.11719-0.0312-0.20312v-0.3125c0-0.10156 8e-3 -0.17578 0.0312-0.21875 0.0312-0.38281 0.17578-0.74219 0.4375-1.0781 0.26953-0.33203 0.80469-0.5 1.6094-0.5 0.47656 0 0.82031 0.15234 1.0312 0.45312 0.21875 0.30469 0.34765 0.67188 0.39062 1.1094 0.0508 0.42969 0.0781 0.85547 0.0781 1.2812v0.85938c0 0.76172 8e-3 1.3438 0.0312 1.75 0.0195 0.39844 0.0312 0.71484 0.0312 0.95313 0.0195 0.29297 0.0351 0.58594 0.0469 0.875 8e-3 0.28125 0.0156 0.57031 0.0156 0.85938 0.0625 1.1367 0.11719 2.2773 0.17187 3.4219 0.0625 1.1367 0.0937 2.2305 0.0937 3.2812v1.7969c0 1.9297-0.0312 3.6953-0.0937 5.2969-0.0547 0.51172-0.0547 1 0 1.4688 0 0.24219-0.0234 0.48047-0.0625 0.71875-0.0312 0.23047-0.0703 0.45312-0.10937 0.67188-0.043 0.17969-0.0937 0.42188-0.15625 0.73438-0.0547 0.3125-0.15235 0.58984-0.29688 0.82812-0.14843 0.23047-0.37109 0.34375-0.67187 0.34375h-0.64063c-0.80439 0.11328-1.3552 0.03516-1.656-0.23438-0.29297-0.26953-0.54297-0.71094-0.75-1.3281l-1.5-4.5c-0.0234-0.01953-0.0312-0.03906-0.0312-0.0625l-0.0937-0.20312v-0.03125c-0.29297-0.78125-0.57422-1.5156-0.84375-2.2031-0.26172-0.6875-0.51172-1.3125-0.75-1.875-0.38672-0.92578-0.6875-1.6797-0.90625-2.2656-0.21875-0.59375-0.43359-1.1602-0.64062-1.7031-0.19922-0.55078-0.46485-1.2383-0.79688-2.0625v1.2656c0 0.76172 4e-3 1.6406 0.0156 2.6406 8e-3 1 0.0195 2.0234 0.0312 3.0625 8e-3 1.043 0.0234 2.0312 0.0469 2.9688 0.0312 0.9375 0.0547 1.7422 0.0781 2.4062 0.0195 0.04297 0.0312 0.10156 0.0312 0.17188v0.15625 0.32812c0 0.60547-0.0703 1.1719-0.20313 1.7031-0.13672 0.53125-0.39062 0.96094-0.76562 1.2812-0.375 0.32422-0.95313 0.48438-1.7344 0.48438z"
                      aria-label="MACARON"
                    />
                  </g>
                </g>
              </svg>
            </div>

            {/* Quand clique sur le bouton 'New Chat', met ConversationId à undefined et initialise nouvelle conversation */}
            <button
              onClick={() => {
                setConversationId(undefined);
                setNewChat(true);
                setShowFirstMessages(false);
                setMessages([]);
                setView("home");
              }}
              className="new-chat-button"
            >
              <MessageSquare size={20} />
              <span>Nouveau Chat</span>
            </button>
            <button
              onClick={() => {
                setView("library");
              }}
              className="new-chat-button"
            >
              <FileStack size={20} />
              <span>Bibliothèque</span>
            </button>

            <div style={{ height: "70vh" }}>
              {Object.entries(timeCategories).map(
                (
                  [label, convs] // pour chaque catégorie (7j, hier, ...)
                ) =>
                  convs.length > 0 ? ( // si il y a des conversations, afficher le titre de la catégorie
                    <div key={label}>
                      <div style={styles.timeLabel}>{label}</div>
                      {convs.map(
                        (
                          conversation // pour chaque conversation de la catégorie affiche le titre
                        ) => (
                          <div
                            key={conversation._id}
                            className={`chat-item ${
                              conversation._id === conversationId
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setConversationId(conversation._id);
                              setConversationTitle(conversation.title);
                              setNewChat(false); // met à false pour pouvoir récupérer la conversation via le Hook
                            }}
                          >
                            {conversation.title}
                            <button
                              className="chat-item-button"
                              onClick={(e) => {
                                e.stopPropagation(); // cliquer sur le bouton ne change pas la conversation affichée
                                // Toggle le menu juste pour cette conversation
                                setMenuVisibleId((prev) =>
                                  prev === conversation._id
                                    ? null
                                    : conversation._id
                                );
                              }}
                            >
                              <Ellipsis size={15} />
                            </button>
                            {menuVisibleId === conversation._id && (
                              <div
                                className="menu-container"
                                ref={menuRefs.current[conversation._id]}
                              >
                                <button
                                  onClick={() =>
                                    console.log("Renommer", conversation._id)
                                  }
                                >
                                  <Pencil size={15} /> Renommer
                                </button>
                                <button
                                  style={{ color: "red" }}
                                  onClick={() => {
                                    deleteConversation(
                                      firebaseUser,
                                      conversation._id
                                    );
                                    // setNewChat(false);
                                  }}
                                >
                                  <Trash2 size={15} /> Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : null // Si pas de conversations dans historique, ne rien afficher
              )}
            </div>
          </div>
          <div style={styles.mainContent} ref={containerRef}>
            {view === "home" && (
              <Home
                firebaseUser={firebaseUser}
                handleLogout={handleLogout}
                setNewConversation={setNewConversation}
                newConversation={newConversation}
                newChat={newChat}
                setConversationTitle={setConversationTitle}
                conversationId={conversationId}
                setConversationId={setConversationId}
                response={response}
                setResponse={setResponse}
                setLoading={setLoading}
                loading={loading}
                setPrompt={setPrompt}
                prompt={prompt}
                messages={messages}
                setMessages={setMessages}
                showFirstMessages={showFirstMessages}
                setShowFirstMessages={setShowFirstMessages}
                context={context}
                setContext={setContext}
              />
            )}
            {view === "library" && <Library contracts={contrats} />}
            {view === "chat" && (
              <Chat
                firebaseUser={firebaseUser}
                handleLogout={handleLogout}
                setNewConversation={setNewConversation}
                newConversation={newConversation}
                newChat={newChat}
                setConversationTitle={setConversationTitle}
                conversationTitle={conversationTitle}
                conversationId={conversationId}
                setConversationId={setConversationId}
                response={response}
                setResponse={setResponse}
                setLoading={setLoading}
                loading={loading}
                convLoading={convLoading}
                setPrompt={setPrompt}
                prompt={prompt}
                messages={messages}
                setMessages={setMessages}
                showFirstMessages={showFirstMessages}
                setShowFirstMessages={setShowFirstMessages}
                context={context}
                setContext={setContext}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
