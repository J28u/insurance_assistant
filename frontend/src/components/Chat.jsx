import React from "react";

import "../style.css";
import LLMInput from "./LLMInput.jsx";
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
  context,
  setContext,
}) {
  return (
    <div>
      <div>
        <Conversation
          conversationTitle={conversationTitle}
          convLoading={convLoading}
          messages={messages}
          context={context}
          loading={loading}
          conversationId={conversationId}
        />
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

export default Chat;
