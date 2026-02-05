import React from "react";
import "../style.css";
import LLMInput from "./LLMInput.jsx";
import macaronIcon from "../assets/macaron.png";

function Home({
  firebaseUser,
  handleLogout,
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
  context,
  setContext,
}) {
  return (
    <div style={{ position: "relative", minHeight: "100vh", padding: "20px" }}>
      {/* Bouton déconnexion en haut à droite */}
      <button className="logout-button" onClick={handleLogout}>
        Déconnexion
      </button>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "60px",
                paddingLeft: "10px",
              }}
            >
              <img
                src={macaronIcon}
                alt="Icône Macaron"
                style={{
                  width: "32px",
                  height: "32px",
                  marginRight: "16px",
                }}
              />
              <div
                style={{
                  fontWeight: "500",
                  fontSize: "20px",
                  color: "#333",
                }}
              >
                Bonjour, je suis Macaron, l'assistant qui rend vos assurances
                plus digestes.
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

      <div>
        <LLMInput
          firebaseUser={firebaseUser}
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
      </div>
    </div>
  );
}

export default Home;
