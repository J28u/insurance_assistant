import React from "react";

import "../style.css";
import DeepseekInput from "./DeepseekInput.jsx";
import Conversation from "./Conversation.jsx";

function Chat({
  firebaseUser,
  setNewConversation,
  newConversation,
  newChat,
  setConversationTitle,
  conversationTitle,
  conversationId,
  setConversationId,
  response,
  setResponse,
  setLoading,
  loading,
  convLoading,
  setPrompt,
  prompt,
  messages,
  setMessages,
  showFirstMessages,
  setShowFirstMessages,
}) {
  return (
    <div>
      <div>
        <Conversation
          conversationTitle={conversationTitle}
          convLoading={convLoading}
          messages={messages}
          loading={loading}
          conversationId={conversationId}
        />
      </div>
      <div>
        <DeepseekInput
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
        />
      </div>
    </div>
  );
}

export default Chat;
