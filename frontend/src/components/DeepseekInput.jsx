// Composant pour gérer la fenêtre d'input (annuler la requete, envoyer l'input au LLM, afficher sa réponse ...)

import React from "react";
import { useState, useRef } from "react"; // useRef = Hook qui permet de référencer un élément DOM
import "../style.css";
import { ArrowUp } from "lucide-react";
import axios from "axios";

function DeepseekInput({
  setNewConversation,
  newConversation,
  newChat,
  setConversationTitle,
  conversationId,
  setConversationId,
  response,
  setResponse,
  setLoading,
  loading,
  setPrompt,
  prompt,
  messages,
  setMessages,
  showFirstMessages,
  setShowFirstMessages,
}) {
  const [stop, setStop] = useState(true); // bouton pour arrêter la requête apparait ou non
  const [isAborted, setIsAborted] = useState(false); // savoir si la requête a été annulée ou non
  const [abortController, setAbortController] = useState(new AbortController());
  const fileInputRef = useRef(); // référence au champ <input type="file">

  // Fonction pour annuler la requête
  const handleAbort = () => {
    abortController.abort();
    setIsAborted(true);
  };

  // Fonction déclenchée lorsqu'au moins un fichier est sélectionné
  const handleUpload = async (event) => {
    const files = event.target.files; // récupère tous les fichiers sélectionnés
    const formData = new FormData(); // Objet pour envoyer des fichiers via HTTP
    for (let i = 0; i < files.length; i++) {
      formData.append("pdfs", files[i]); // Le même champs pour plusieurs fichiers.
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/api/upload",
        formData // envoi des fichiers au backend
      );
    } catch (error) {
      console.error(
        "Error uploading pdfs:",
        error.response?.data || error.message
      );
    }
  };

  const sendLastTwoMessages = async (userId, conversationId, messages) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/conversations",
        {
          userId: userId,
          conversationId: conversationId,
          messages: messages,
        }
      );
      setConversationId(response.data.conversationId);
      if (newChat) {
        setNewConversation(!newConversation);
      }
    } catch (error) {
      console.error(
        "Error sending last 2 messages:",
        error.response?.data || error.message
      );
    }
  };

  // Fonction qui récupère le prompt enrichie du context
  const getPromptWithContext = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/retriever/prompt_with_context/${prompt}`
      );
      console.log("Enriched prompt:", response.data);
      return response.data.prompt;
    } catch (error) {
      console.error(
        "Error retrieving contexr=t:",
        error.response ? error.response.data : error.message
      );
    }
  };

  // Fonction qui envoie le prompt au LLM et récupère la réponse en format str
  const fetchStream = async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    var answer = "";
    setAbortController(controller);
    setIsAborted(false);
    const systemPrompt = `
      Tu es Macaron, un assistant virtuel amical et expert juridique spécialisé dans les assurances de personnes et les assurances de dommages.
      Tu t'exprime en français naturel, correct et professionnel. Tu dois éviter les fautes de grammaire et t'adresser à l'utilisateur avec clarté.
      Réponds en HTML structuré avec des balises comme <h2>, <h3>, <p>, et <ul>. Utilise des emojis pour rendre le texte engageant.

      - Si les utilisateurs te saluent, présente-toi et réponds de manière amicale.
      - Si les utilisateurs te posent des questions hors sujet, ne donne pas de réponse et reprécise ton domaine de compétence.
      - Si les utilisateurs te posent des questions adaptées à ton périmètre d'expertise, utilise les éléments de contexte fournis dans les messages précédents pour répondre sans détour à la question finale.
      - Si tu ne trouves pas la réponse, réponds simplement "je ne sais pas", n'essaie pas d'inventer une réponse.
      - Si le contexte ne contient pas assez d'information pour répondre à la question dis "je ne sais pas".
      - Les réponses doivent être précises, justifiées mais concises, et uniquement basées sur le contexte fourni.
      `;

    var question = prompt;
    setPrompt(""); // vide le champ de saisie
    setStop(false);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: question },
    ]); //Mets à jour la liste des messages avec le prompt de l'utilisateur
    var pp = await getPromptWithContext(); // Récupère le prompt enrichi
    const startTime = performance.now(); // début chrono
    try {
      const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "hf.co/cognitivecomputations/Dolphin3.0-Llama3.1-8B-GGUF:Q6_K",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...messages,
            { role: "user", content: pp },
          ],
          stream: true,
          temperature: 0.2,
        }),
        signal: signal, // Permet de dire quelle requête on veut stopper
      });
      // Mets à jour les messages avec un message vide (pour pouvoir le mettre à jour au fur et à mesure avec les chunks)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "" },
      ]);
      setShowFirstMessages(true); // Affiche page avec les messages (pas la page d'accueil)

      if (conversationId == undefined) {
        setConversationTitle(question.slice(0, 30));
      }

      const reader = res.body.getReader(); // Récupère le chunk
      const decoder = new TextDecoder(); // Transforme le chunk en str

      // Boucle tant qu'il y a des chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decoded = decoder.decode(value);
        console.log(decoded);

        // Récupère uniquement le champs "response"
        const matches = decoded.match(/"content":"(.*?)"/g);
        if (matches) {
          const newText = matches
            // Si correspondance, enlève "response:" puis, enlève les guillemets
            .map((m) => m.replace(/"content":"/, "").replace(/"$/, ""))
            // join au cas où plusieurs occurences
            .join("");

          answer += newText;
          // met à jour variable dynamique globale
          setResponse((prev) => prev + newText);
          console.log(answer);
          // Met à jour le dernier message avec la réponse (concaténation des chunks)
          setMessages((prevMessages) => {
            return prevMessages.map((msg, index) =>
              index === prevMessages.length - 1
                ? { ...msg, content: answer }
                : msg
            );
          });
        }
      }
      sendLastTwoMessages("68235ea293d0a7e8eab16d47", conversationId, [
        { role: "user", content: question },
        { role: "assistant", content: answer },
      ]);
      setStop(true);
      const endTime = performance.now(); // fin chrono
      const duration = endTime - startTime;
      console.log(`Temps de réponse du LLM ${duration.toFixed(2)} ms`);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        setIsAborted(true);
      } else {
        console.error("Fetch error:", error);
      }
    }
  };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "20px",
        position: "relative",
        bottom: "20px",
      }}
    >
      <div
        style={{
          width: "60%",
          backgroundColor: "#f3f4f6",
          borderRadius: "16px",
          boxShadow: "0px 0px 0px .5px #dce0e9",
        }}
      >
        <div style={{ padding: "10px", minHeight: "60px" }}>
          <input
            value={prompt}
            className="custom-input"
            type="text"
            placeholder="Poser une question"
            // Met à jour la variable prompt si input change
            onChange={(e) => {
              setPrompt(e.target.value);
            }}
            // Exécute la fonction fetchStream() si on appuie sur "Entrée"
            onKeyDown={(e) => {
              if (e.key === "Enter" && prompt.trim() !== "") {
                fetchStream();
              }
            }}
          />
        </div>
        <div
          style={{ display: "flex", paddingLeft: "10px", marginBottom: "5px" }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="left-buttons">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.656 17.344c-1.016-1.015-1.15-2.75-.313-4.925.325-.825.73-1.617 1.205-2.365L3.582 10l-.033-.054c-.5-.799-.91-1.596-1.206-2.365-.836-2.175-.703-3.91.313-4.926.56-.56 1.364-.86 2.335-.86 1.425 0 3.168.636 4.957 1.756l.053.034.053-.034c1.79-1.12 3.532-1.757 4.957-1.757.972 0 1.776.3 2.335.86 1.014 1.015 1.148 2.752.312 4.926a13.892 13.892 0 0 1-1.206 2.365l-.034.054.034.053c.5.8.91 1.596 1.205 2.365.837 2.175.704 3.911-.311 4.926-.56.56-1.364.861-2.335.861-1.425 0-3.168-.637-4.957-1.757L10 16.415l-.053.033c-1.79 1.12-3.532 1.757-4.957 1.757-.972 0-1.776-.3-2.335-.86zm13.631-4.399c-.187-.488-.429-.988-.71-1.492l-.075-.132-.092.12a22.075 22.075 0 0 1-3.968 3.968l-.12.093.132.074c1.308.734 2.559 1.162 3.556 1.162.563 0 1.006-.138 1.298-.43.3-.3.436-.774.428-1.346-.008-.575-.159-1.264-.449-2.017zm-6.345 1.65l.058.042.058-.042a19.881 19.881 0 0 0 4.551-4.537l.043-.058-.043-.058a20.123 20.123 0 0 0-2.093-2.458 19.732 19.732 0 0 0-2.458-2.08L10 5.364l-.058.042A19.883 19.883 0 0 0 5.39 9.942L5.348 10l.042.059c.631.874 1.332 1.695 2.094 2.457a19.74 19.74 0 0 0 2.458 2.08zm6.366-10.902c-.293-.293-.736-.431-1.298-.431-.998 0-2.248.429-3.556 1.163l-.132.074.12.092a21.938 21.938 0 0 1 3.968 3.968l.092.12.074-.132c.282-.504.524-1.004.711-1.492.29-.753.442-1.442.45-2.017.007-.572-.129-1.045-.429-1.345zM3.712 7.055c.202.514.44 1.013.712 1.493l.074.13.092-.119a21.94 21.94 0 0 1 3.968-3.968l.12-.092-.132-.074C7.238 3.69 5.987 3.262 4.99 3.262c-.563 0-1.006.138-1.298.43-.3.301-.436.774-.428 1.346.007.575.159 1.264.448 2.017zm0 5.89c-.29.753-.44 1.442-.448 2.017-.008.572.127 1.045.428 1.345.293.293.736.431 1.298.431.997 0 2.247-.428 3.556-1.162l.131-.074-.12-.093a21.94 21.94 0 0 1-3.967-3.968l-.093-.12-.074.132a11.712 11.712 0 0 0-.71 1.492z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth=".1"
                ></path>
                <path
                  d="M10.706 11.704A1.843 1.843 0 0 1 8.155 10a1.845 1.845 0 1 1 2.551 1.704z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth=".2"
                ></path>
              </svg>
              <span>DeepThink (R1)</span>
            </button>
            <button className="left-buttons">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                ></circle>
                <path
                  d="M10 1c1.657 0 3 4.03 3 9s-1.343 9-3 9M10 19c-1.657 0-3-4.03-3-9s1.343-9 3-9M1 10h18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                ></path>
              </svg>
              <span>Search</span>
            </button>
          </div>
          <div style={{ display: "flex", marginLeft: "auto" }}>
            <div>
              <button
                className="paperclip"
                onClick={() => fileInputRef.current.click()} // simule un clique sur le champ caché <input type=file>
              >
                <svg
                  width="22"
                  height="24"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 14 20"
                  fill="none"
                >
                  <path
                    d="M7 20c-1.856-.002-3.635-.7-4.947-1.94C.74 16.819.003 15.137 0 13.383V4.828a4.536 4.536 0 0 1 .365-1.843 4.75 4.75 0 0 1 1.087-1.567A5.065 5.065 0 0 1 3.096.368a5.293 5.293 0 0 1 3.888 0c.616.244 1.174.6 1.643 1.05.469.45.839.982 1.088 1.567.25.586.373 1.212.364 1.843v8.555a2.837 2.837 0 0 1-.92 2.027A3.174 3.174 0 0 1 7 16.245c-.807 0-1.582-.3-2.158-.835a2.837 2.837 0 0 1-.92-2.027v-6.22a1.119 1.119 0 1 1 2.237 0v6.22a.777.777 0 0 0 .256.547.868.868 0 0 0 .585.224c.219 0 .429-.08.586-.224a.777.777 0 0 0 .256-.546V4.828A2.522 2.522 0 0 0 7.643 3.8a2.64 2.64 0 0 0-.604-.876 2.816 2.816 0 0 0-.915-.587 2.943 2.943 0 0 0-2.168 0 2.816 2.816 0 0 0-.916.587 2.64 2.64 0 0 0-.604.876 2.522 2.522 0 0 0-.198 1.028v8.555c0 1.194.501 2.339 1.394 3.183A4.906 4.906 0 0 0 7 17.885a4.906 4.906 0 0 0 3.367-1.319 4.382 4.382 0 0 0 1.395-3.183v-6.22a1.119 1.119 0 0 1 2.237 0v6.22c-.002 1.754-.74 3.436-2.052 4.677C10.635 19.3 8.856 19.998 7 20z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
              <input
                type="file"
                accept="application/pdf"
                multiple
                style={{ display: "none" }} // champ est caché
                ref={fileInputRef}
                onChange={handleUpload} // quand il devient "visible" -> déclenche la sélection des fichiers
              />
            </div>
            <div style={{ marginRight: "10px", marginLeft: "10px" }}>
              {stop ? (
                <ArrowUp
                  onClick={fetchStream}
                  style={{
                    height: "18px",
                    width: "18px",
                    strokeWidth: "2.5px",
                    color: "white",
                    borderRadius: "50%",
                    cursor: "pointer",
                    padding: "7px",
                    backgroundColor: prompt === "" ? "#9ca3af" : "#6DA46D",
                  }}
                  onMouseEnter={(e) => {
                    if (prompt !== "") {
                      e.target.style.backgroundColor = "#5D935D";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (prompt !== "") {
                      e.target.style.backgroundColor = "#6DA46D";
                    }
                  }}
                />
              ) : (
                // Quand clique sur le bouton, arrête la requête + affiche de nouveau la flèche
                <div
                  onClick={(e) => {
                    handleAbort();
                    setStop(true);
                  }}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginBottom: "5px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-7px",
                      left: "-6.5px",
                      width: "45px",
                      height: "45px",
                      border: "3px solid transparent",
                      borderTop: "3px solid #6DA46D",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite", // spinner tourne pendant la requête (autour du bouton)
                    }}
                  />
                  <button // bouton rond bleu
                    style={{
                      padding: 0,
                      width: "35px",
                      height: "35px",
                      borderRadius: "50%",
                      backgroundColor: "#6DA46D",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#5D935D")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#6DA46D")
                    }
                  >
                    <div // carré blanc au milieu du bouton (pour montrer que c'est un stop)
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: "white",
                        borderRadius: "2px",
                        display: "block",
                      }}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeepseekInput;
