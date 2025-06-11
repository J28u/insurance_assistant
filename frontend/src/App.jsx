import { useState, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import "./style.css";
import DeepseekInput from "./components/DeepseekInput.jsx";
import Conversation from "./components/Conversation.jsx";
import axios from "axios";

// ------------------------------------STYLE----------------------------------------------------

const styles = {
  container: {
    display: "flex",
    width: "100vw",
    minHeight: "100vh",
    overflowY: "auto",
  },
  sideBar: {
    width: "200px",
    backgroundColor: "#f9fbff",
    padding: "10px",
    borderRight: "1px solid #ededf1",
    position: "sticky",
    top: "0",
  },
  mainContent: {
    width: "100vw",
    overflowY: "auto",
    height: "100vh",
  },
  deepseekLogo: {
    width: "125px",
    marginTop: "15px",
    color: "#2c2c36",
  },
  chatItem: {
    // style des conversations historisées
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#1f2937",
    marginBottom: "4px",
    fontWeight: "400",
    lineHeight: "1.5",
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

  // ------------------------------------- FONCTIONS -------------------------------------------------------------

  const fetchConversation = async () => {
    // Récupère tous les messages associés à une conversation :
    if (conversationId !== undefined) {
      setConvLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:3000/api/conversations/onlyone/${conversationId}`
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

  const getUserConversations = async (userId) => {
    // Récupère toutes les conversations associées à un user Id (messageId dans conversation, pas texte)
    try {
      // Requête de type GET pour récupérer de l'information (POST pour envoyer de l'information)
      const response = await axios.get(
        `http://localhost:3000/api/conversations/user/${userId}`
      );
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
      } else if (diffDays > 7 && diffDays <= 30) {
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

  // --------------------------------------------------- HOOKS REACT ------------------------------------------------------------------------------
  // Exécute du code après le premier rendu du composant (récupère les conversations historisées)
  useEffect(() => {
    getUserConversations("68235ea293d0a7e8eab16d47");
  }, [newConversation]);

  //Dès que la variable conversationId change, si pas un nouveau chat, on fait une requête à notre application back end pour récupérer tous les messages associés
  useEffect(() => {
    if (!newChat) {
      fetchConversation();
    }
  }, [conversationId]);

  // Forcer le scroll jusqu'en bas :
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight; // force le scroll jusqu'en bas
    }
  }, [messages]); // chaque fois que la variable messages se met à jour, on scrolle tout en bas du container

  // ----------------------------------------------------------------------------------------------------------------------------------

  // -----------------------------------------------AFFICHAGE-----------------------------------

  return (
    <div style={styles.container}>
      <div style={styles.sideBar}>
        <div style={styles.deepseekLogo}>
          <svg
            viewBox="-2 0 175 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <defs></defs>
            <path
              id="path"
              d="M75.32 25.23L72.83 25.23L72.83 21.37L75.32 21.37C76.86 21.37 78.42 20.99 79.43 19.92C80.44 18.85 80.81 17.2 80.81 15.57C80.81 13.94 80.44 12.3 79.43 11.23C78.42 10.16 76.86 9.78 75.32 9.78C73.77 9.78 72.22 10.16 71.21 11.23C70.19 12.3 69.83 13.94 69.83 15.57L69.83 31.44L65.46 31.44L65.46 5.92L69.83 5.92L69.83 7.54L70.63 7.54C70.71 7.45 70.8 7.36 70.9 7.27C71.99 6.27 73.66 5.92 75.32 5.92C77.89 5.92 80.48 6.56 82.17 8.34C83.85 10.12 84.46 12.86 84.46 15.58C84.46 18.29 83.85 21.03 82.17 22.81C80.48 24.6 77.89 25.23 75.32 25.23Z"
              fill="currentColor"
              fillOpacity="1.000000"
              fillRule="nonzero"
            ></path>
            <path
              id="path"
              d="M8.79 6.59L11.28 6.59L11.28 10.45L8.79 10.45C7.25 10.45 5.69 10.83 4.68 11.91C3.67 12.98 3.3 14.62 3.3 16.25C3.3 17.88 3.67 19.52 4.68 20.59C5.69 21.66 7.25 22.05 8.79 22.05C10.34 22.05 11.89 21.66 12.9 20.59C13.92 19.52 14.28 17.88 14.28 16.25L14.28 0.39L18.65 0.39L18.65 25.91L14.28 25.91L14.28 24.28L13.48 24.28C13.4 24.38 13.31 24.47 13.21 24.55C12.12 25.55 10.45 25.91 8.79 25.91C6.22 25.91 3.63 25.27 1.94 23.48C0.26 21.7 -0.35 18.97 -0.35 16.25C-0.35 13.53 0.26 10.8 1.94 9.01C3.63 7.23 6.22 6.59 8.79 6.59Z"
              fill="currentColor"
              fillOpacity="1.000000"
              fillRule="nonzero"
            ></path>
            <path
              id="path"
              d="M40.59 15.91L40.59 17.46L28.95 17.46L28.95 14.36L36.67 14.36C36.49 13.23 36.08 12.18 35.36 11.42C34.3 10.31 32.69 9.91 31.08 9.91C29.48 9.91 27.86 10.31 26.81 11.42C25.76 12.52 25.38 14.22 25.38 15.91C25.38 17.6 25.76 19.3 26.81 20.41C27.86 21.52 29.48 21.91 31.08 21.91C32.69 21.91 34.3 21.52 35.36 20.41C35.5 20.25 35.64 20.08 35.76 19.9L40.08 19.9C39.71 21.24 39.1 22.45 38.2 23.4C36.44 25.25 33.75 25.91 31.08 25.91C28.41 25.91 25.72 25.25 23.97 23.4C22.21 21.55 21.58 18.72 21.58 15.91C21.58 13.1 22.21 10.27 23.97 8.42C25.72 6.58 28.41 5.92 31.08 5.92C33.75 5.92 36.44 6.58 38.2 8.42C39.96 10.27 40.59 13.1 40.59 15.91Z"
              fill="currentColor"
              fillOpacity="1.000000"
              fillRule="nonzero"
            ></path>
            <path
              id="path"
              d="M62.52 15.91L62.52 17.46L50.88 17.46L50.88 14.36L58.61 14.36C58.43 13.23 58.02 12.18 57.29 11.42C56.24 10.31 54.63 9.91 53.02 9.91C51.42 9.91 49.8 10.31 48.75 11.42C47.7 12.52 47.32 14.22 47.32 15.91C47.32 17.6 47.7 19.3 48.75 20.41C49.8 21.52 51.42 21.91 53.02 21.91C54.63 21.91 56.24 21.52 57.29 20.41C57.44 20.25 57.58 20.08 57.7 19.9L62.02 19.9C61.64 21.24 61.04 22.45 60.14 23.4C58.38 25.25 55.69 25.91 53.02 25.91C50.35 25.91 47.66 25.25 45.9 23.4C44.15 21.55 43.52 18.72 43.52 15.91C43.52 13.1 44.15 10.27 45.9 8.42C47.66 6.58 50.35 5.92 53.02 5.92C55.69 5.92 58.38 6.58 60.14 8.42C61.89 10.27 62.52 13.1 62.52 15.91Z"
              fill="currentColor"
              fillOpacity="1.000000"
              fillRule="nonzero"
            ></path>
            <path
              id="path"
              d="M96.9 25.91C99.57 25.91 102.26 25.52 104.01 24.43C105.77 23.34 106.4 21.67 106.4 20.01C106.4 18.35 105.77 16.68 104.01 15.59C102.26 14.5 99.57 14.11 96.9 14.11L96.99 14.11C95.85 14.11 94.7 13.96 93.96 13.53C93.21 13.11 92.94 12.46 92.94 11.82C92.94 11.17 93.21 10.53 93.96 10.1C94.7 9.68 95.85 9.53 96.99 9.53C98.13 9.53 99.28 9.68 100.03 10.1C100.78 10.53 101.04 11.17 101.04 11.82L105.49 11.82C105.49 10.16 104.92 8.49 103.34 7.4C101.75 6.31 99.32 5.92 96.9 5.92C94.48 5.92 92.05 6.31 90.46 7.4C88.87 8.49 88.3 10.16 88.3 11.82C88.3 13.48 88.87 15.15 90.46 16.24C92.05 17.33 94.48 17.72 96.9 17.72C98.16 17.72 99.53 17.87 100.36 18.29C101.19 18.71 101.48 19.36 101.48 20.01C101.48 20.65 101.19 21.3 100.36 21.72C99.53 22.14 98.26 22.3 97 22.3C95.74 22.3 94.47 22.14 93.65 21.72C92.82 21.3 92.52 20.65 92.52 20.01L87.4 20.01C87.4 21.67 88.03 23.34 89.78 24.43C91.54 25.52 94.22 25.91 96.9 25.91Z"
              fill="currentColor"
              fillOpacity="1.000000"
              fillRule="nonzero"
            ></path>
            <path
              id="path"
              d="M128.33 15.91L128.33 17.46L116.69 17.46L116.69 14.36L124.42 14.36C124.24 13.23 123.83 12.18 123.1 11.42C122.05 10.31 120.44 9.91 118.83 9.91C117.23 9.91 115.61 10.31 114.56 11.42C113.51 12.52 113.13 14.22 113.13 15.91C113.13 17.6 113.51 19.3 114.56 20.41C115.61 21.52 117.23 21.91 118.83 21.91C120.44 21.91 122.05 21.52 123.1 20.41C123.25 20.25 123.39 20.08 123.51 19.9L127.83 19.9C127.45 21.24 126.85 22.45 125.95 23.4C124.19 25.25 121.5 25.91 118.83 25.91C116.16 25.91 113.47 25.25 111.71 23.4C109.96 21.55 109.33 18.72 109.33 15.91C109.33 13.1 109.96 10.27 111.71 8.42C113.47 6.58 116.16 5.92 118.83 5.92C121.5 5.92 124.19 6.58 125.95 8.42C127.7 10.27 128.33 13.1 128.33 15.91Z"
              fill="currentColor"
              fillOpacity="1.000000"
              fillRule="nonzero"
            ></path>
            <path
              id="path"
              d="M150.27 15.91L150.27 17.46L138.63 17.46L138.63 14.36L146.36 14.36C146.17 13.23 145.77 12.18 145.04 11.42C143.99 10.31 142.37 9.91 140.77 9.91C139.17 9.91 137.55 10.31 136.5 11.42C135.44 12.52 135.07 14.22 135.07 15.91C135.07 17.6 135.44 19.3 136.5 20.41C137.55 21.52 139.17 21.91 140.77 21.91C142.37 21.91 143.99 21.52 145.04 20.41C145.19 20.25 145.32 20.08 145.45 19.9L149.77 19.9C149.39 21.24 148.79 22.45 147.88 23.4C146.13 25.25 143.44 25.91 140.77 25.91C138.1 25.91 135.4 25.25 133.65 23.4C131.9 21.55 131.27 18.72 131.27 15.91C131.27 13.1 131.9 10.27 133.65 8.42C135.4 6.58 138.1 5.92 140.77 5.92C143.44 5.92 146.13 6.58 147.88 8.42C149.64 10.27 150.27 13.1 150.27 15.91Z"
              fill="currentColor"
              fillOpacity="1.000000"
              fillRule="nonzero"
            ></path>
            <rect
              id="rect"
              x="153.211426"
              y="-0.499512"
              width="4.371000"
              height="26.415646"
              fill="currentColor"
              fillOpacity="1.000000"
            ></rect>
            <path
              id="polygon"
              d="M165.04 15.31L172.21 25.91L166.79 25.91L159.62 15.31L166.79 6.81L172.21 6.81L165.04 15.31Z"
              fill="currentColor"
              fillOpacity="1.000000"
              fillRule="nonzero"
            ></path>
          </svg>
        </div>

        {/* Quand clique sur le bouton 'New Chat', met ConversationId à undefined et initialise nouvelle conversation */}
        <button
          onClick={() => {
            setConversationId(undefined);
            setNewChat(true);
            setShowFirstMessages(false);
            setMessages([]);
          }}
          className="new-chat-button"
        >
          <MessageSquare size={20} />
          <span>New Chat</span>
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
                        style={{
                          marginRight: "5px",
                          ...styles.chatItem,
                          backgroundColor:
                            conversation._id === conversationId
                              ? "#dbeafe"
                              : "transparent",
                          transition: "background-color 0.3s", // smooth transition for hover
                        }}
                        onClick={() => {
                          setConversationId(conversation._id);
                          setConversationTitle(conversation.title);
                          setNewChat(false); // met à false pour pouvoir récupérer la conversation via le Hook
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.backgroundColor = "#e9f2fd")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.backgroundColor =
                            conversation._id === conversationId
                              ? "#dbeafe"
                              : "transparent")
                        }
                      >
                        {conversation.title}
                      </div>
                    )
                  )}
                </div>
              ) : null // Si pas de conversations dans historique, ne rien afficher
          )}
        </div>
      </div>

      <div style={styles.mainContent} ref={containerRef}>
        {
          // '{}' pour afficher ou non certaines parties du code
          conversationId || showFirstMessages ? ( // si au moins une des deux variables est définie on affiche la conversation, sinon la page d'accueil
            <div>
              <Conversation
                conversationTitle={conversationTitle}
                convLoading={convLoading}
                messages={messages}
                loading={loading}
                conversationId={conversationId}
              />
            </div>
          ) : (
            <div>
              <div>
                <div
                  style={{
                    height: "35vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "end",
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", height: "60px" }}>
                    <span
                      role="img"
                      aria-label="cool smiley"
                      style={{
                        fontSize: "35px",
                        display: "flex",
                        width: "20px",
                        marginBottom: "5px",
                        marginLeft: "10px",
                        alignItems: "center",
                        marginRight: "30px",
                      }}
                    >
                      🤓
                    </span>
                    <div
                      style={{
                        marginLeft: "10px",
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "500",
                        fontSize: "20px",
                      }}
                    >
                      Bonjour, je suis Macaron, votre assistant assurance.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    paddingBottom: "20px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#404040",
                    fontSize: "13px",
                    marginTop: "5px",
                  }}
                >
                  Posez-moi vos questions, je suis là pour sucrer vos doutes.
                </div>
              </div>
            </div>
          )
        }
        <div>
          <DeepseekInput
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
          />
        </div>
      </div>
    </div>
  );
}

export default App;
