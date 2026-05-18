import { useState, useRef, useEffect } from "react";
import { msgId } from "../utils/ids";
import { getResponseText } from "../demo/aiResponses";

export default function useAIChat(elements, currentScene, activeElId) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text, quote = null, cannedReply = null) => {
    if (!text.trim() || isStreaming) return;

    const trimmedQuote = quote?.trim() || null;
    const userMsg = trimmedQuote
      ? { id: msgId(), role: "user", text: text.trim(), quote: trimmedQuote }
      : { id: msgId(), role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsStreaming(true);

    await new Promise((r) => setTimeout(r, 600));

    const aiText = cannedReply ?? getResponseText(text);
    setMessages((prev) => [...prev, { id: msgId(), role: "assistant", text: aiText }]);
    setIsStreaming(false);
  };

  const handleRewriteScene = () => {
    sendMessage(`Please rewrite the current scene (Scene ${currentScene}) to be tighter and more impactful.`);
  };

  const handleSuggestNext = () => {
    sendMessage("Based on where my cursor is in the script, suggest what should come next.");
  };

  return {
    messages, setMessages,
    chatInput, setChatInput,
    isStreaming,
    chatEndRef,
    sendMessage,
    handleRewriteScene,
    handleSuggestNext,
  };
}
