import React from "react";
import DOMPurify from "dompurify"; // pour éviter les injections de code malveillant
import macaronIcon from "../assets/macaron.png";

const styles = {
  userMessage: {
    color: "#262626",
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word", // pour que le message ne dépasse pas la largeur du div
    backgroundColor: "#F5F8F5",
    maxWidth: "100%",
    borderRadius: "14px",
    padding: "16px",
    fontSize: "14px",
    lineHeight: "1.6",
    fontWeight: "400",
    width: "fit-content", // bloc adapté à la largeur du texte
    border: "none",
    marginLeft: "auto",
  },
  botMessage: {
    color: "#262626",
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxWidth: "100%",
    borderRadius: "14px",
    padding: "16px",
    fontSize: "14px",
    lineHeight: "1.6",
    fontWeight: "400",
    width: "fit-content",
    border: "none",
    paddingLeft: "0",
    marginRight: "auto",
  },
  topBar: {
    position: "fixed", // barre en haut de la page
    top: "0",
    height: "64px",
    backgroundColor: "white",
    zIndex: "1000", // barre toujours au-dessus des autres éléments
    width: "calc(100% - 300px)", // 201 : largeur de la sidebar - 1px (largeur de la brodure de la sidebar)
    WebkitBoxShadow: "0px 34px 26px -20px rgb(255, 255, 255)",
    MozBoxShadow: "0px 34px 26px -20px rgb(255, 255, 255)",
    boxShadow: "0px 34px 26px -20px rgb(255, 255, 255)",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #e5e7eb",
    borderTop: "2px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear inifinite",
  },
};

function decodeHTML(encodedStr) {
  // Trouver autre moyen de décoder les messages renvoyés par le LLM
  const parser = new DOMParser();
  const doc = parser.parseFromString(encodedStr, "text/html");
  const decoded = doc.documentElement.textContent;

  // Remplace explicitement les séquences Unicode comme \u003c et \u003e
  return decoded
    .replace(/\\n/g, "")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\u0022/g, '"')
    .replace(/\\u0027/g, "'");
}

const Conversation = ({
  conversationTitle,
  convLoading,
  messages,
  loading,
  conversationID,
}) => {
  return (
    <div
      style={{
        height: "auto",
        minHeight: "calc(100vh - 140px",
        overflowY: "hidden",
      }}
    >
      {/* Barre contenant le titre de la conversation */}
      <div style={styles.topBar}>
        <div
          style={{
            fontWeight: "600",
            lineHeight: "24px",
            boxSizing: "border-box",
            position: "relative",
            height: "64px",
            color: "#262626",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            whitespace: "nowrap",
            textOverflow: "ellisis",
          }}
        >
          {conversationTitle} {/* entre accolades car variable dynamique */}
        </div>
      </div>

      {/* Conversation */}
      {convLoading ? ( // Spinner
        <div
          style={{
            width: "100%",
            display: "flex",
            height: "30vh",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={styles.spinner} />
        </div>
      ) : (
        <div
          style={{
            width: "60%",
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: "90px",
          }}
        >
          {messages.map(
            (
              msg,
              index //messages.map : parcourt tous les messages
            ) => (
              <div
                style={{
                  paddingBottom: "32px",
                  marginBottom: "16px",
                  display: "flex",
                }}
              >
                {msg.role === "user" ? ( // affiche logo si bot, sinon div vide
                  <div
                    style={{
                      marginRight: "15px",
                      height: "30px",
                      width: "30px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexShrink: "0",
                      flexGrow: "0",
                    }}
                  ></div>
                ) : (
                  <div style={{ position: "relative", marginTop: "15px" }}>
                    <div
                      style={{
                        marginRight: "15px",
                        height: "30px",
                        width: "30px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: "50%",
                        border: "1px solid #d5e4ff",
                        flexShrink: "0",
                        flexGrow: "0",
                      }}
                    >
                      <img
                        src={macaronIcon}
                        alt="Icône Macaron"
                        style={{
                          width: "25px",
                          height: "25px",
                          marginRight: "none",
                          marginLeft: "1px",
                        }}
                      />
                    </div>
                  </div>
                )}

                <div // ce div a un style en fonction du role associé au message
                  key={index}
                  style={
                    msg.role === "user" ? styles.userMessage : styles.botMessage
                  }
                  // si role bot, structure la réponse avec du HTML, sinon du texte brute
                  dangerouslySetInnerHTML={
                    msg.role === "assistant"
                      ? { __html: DOMPurify.sanitize(decodeHTML(msg.content)) }
                      : undefined
                  }
                >
                  {msg.role === "user" ? msg.content : null}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Conversation;
