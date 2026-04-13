import { useState, useRef, useEffect } from "react";
import { msgId } from "../utils/ids";
import { stripHtml } from "../utils/html";
import { getCurrentSceneIndex } from "../utils/screenplay";

export default function useAIChat(elements, currentScene, activeElId) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isStreaming) return;

    const userMsg = { id: msgId(), role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsStreaming(true);

    // Build script context
    const scriptText = elements.map((el) => {
      const prefix = el.type === "scene-heading" ? "\n" : el.type === "character" ? "\n" : "";
      return prefix + stripHtml(el.text);
    }).join("\n");

    const currentSceneText = `Scene ${currentScene}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are ScriptMind, an expert AI screenwriting collaborator. You have access to the writer's full screenplay and are helping them craft their story. Be specific to THEIR script — reference their characters, scenes, and dialogue by name. Be concise, insightful, and practical. Use a warm but professional tone. Format with bullet points (•) sparingly. Use *asterisks* for emphasis on key terms.

CURRENT SCREENPLAY:
${scriptText}

CURRENT POSITION: ${currentSceneText}

Respond concisely (2-4 short paragraphs max). Be specific to this screenplay — mention character names, scene details, etc.`,
          messages: [
            ...messages.filter(m => m.role).map(m => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.text
            })),
            { role: "user", content: text.trim() }
          ],
        }),
      });

      const data = await response.json();
      const aiText = data.content?.map(b => b.text || "").join("") || "I'd be happy to help with your screenplay. Could you tell me more about what you're working on?";

      setMessages((prev) => [...prev, { id: msgId(), role: "assistant", text: aiText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: msgId(),
          role: "assistant",
          text: "I'm having trouble connecting right now. In the meantime, I can see you're working on a compelling scene between Morgan and Cole. The tension in their dialogue is strong — Morgan's short responses are doing a lot of heavy lifting. What specifically would you like help with?",
        },
      ]);
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
