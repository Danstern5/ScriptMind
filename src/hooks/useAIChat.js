import { useState, useRef, useEffect } from "react";
import { msgId } from "../utils/ids";
import { stripHtml } from "../utils/html";
import { getCurrentSceneIndex } from "../utils/screenplay";
import { apiStreamPost } from "../utils/api";

export default function useAIChat(elements, currentScene, activeElId, token) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text, quote = null) => {
    if (!text.trim() || isStreaming) return;

    const trimmedQuote = quote?.trim() || null;
    const userMsg = trimmedQuote
      ? { id: msgId(), role: "user", text: text.trim(), quote: trimmedQuote }
      : { id: msgId(), role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsStreaming(true);

    const apiContent = trimmedQuote
      ? `Selected from the screenplay:\n"${trimmedQuote}"\n\n${text.trim()}`
      : text.trim();

    const history = messages
      .filter((m) => m.role)
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.quote
          ? `Selected from the screenplay:\n"${m.quote}"\n\n${m.text}`
          : m.text,
      }));

    const assistantId = msgId();
    let appendedAssistant = false;

    const appendError = (message) => {
      setMessages((prev) => [
        ...prev,
        { id: msgId(), role: "assistant", text: message, isError: true },
      ]);
    };

    const onEvent = (event) => {
      if (event.type === "token") {
        if (!appendedAssistant) {
          appendedAssistant = true;
          setMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: event.text }]);
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + event.text } : m)),
          );
        }
      } else if (event.type === "error") {
        appendError(event.message || "Something went wrong talking to the AI. Please try again.");
      }
    };

    try {
      await apiStreamPost(
        "/api/ai/chat",
        {
          messages: [...history, { role: "user", content: apiContent }],
          script_context: {
            elements: elements.map((el) => ({ type: el.type, text: stripHtml(el.text) })),
            current_scene: currentScene,
          },
        },
        token,
        onEvent,
      );
    } catch {
      appendError("I'm having trouble connecting right now. Please try again.");
    }
    setIsStreaming(false);
  };

  const handleRewriteScene = () => {
    const sceneEls = [];
    let inCurrentScene = false;
    for (const el of elements) {
      if (el.type === "scene-heading") {
        if (inCurrentScene) break;
        if (el.id === activeElId || getCurrentSceneIndex(elements, el.id) === currentScene) {
          inCurrentScene = true;
        }
      }
      if (inCurrentScene) sceneEls.push(el);
    }
    const sceneText = sceneEls.map((e) => stripHtml(e.text)).join("\n");
    sendMessage(`Please rewrite the current scene (Scene ${currentScene}) to be tighter and more impactful. Here's what I have:\n\n${sceneText}`);
  };

  const handleSuggestNext = () => {
    sendMessage("Based on where my cursor is in the script, suggest what should come next. What's the next line or beat that would work well here?");
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
