import { stripHtml } from "../utils/html";
import { getCurrentSceneIndex } from "../utils/screenplay";
import AIMessage from "./AIMessage";
import { SendIcon, SparkleIcon } from "./Icons";

export default function AIPanel({
  messages, chatInput, setChatInput, isStreaming, chatEndRef,
  sendMessage, handleRewriteScene, handleSuggestNext,
  currentScene, scenes, elements,
}) {
  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 360, background: "linear-gradient(180deg, #6D8196, #6D8196, #6D8196)", borderLeft: "1px solid #334155" }}>
      {/* Header */}
      <div className="flex items-center" style={{ height: 48, borderBottom: "1px solid #334155", padding: "0 16px", gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #94a3b8, #64748b)", animation: "ringPulse 2s ease-in-out infinite" }} />
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: "#e8e8e8",
        }}>AI Collaborator</div>
        <div className="ml-auto" style={{ fontSize: 11, padding: "3px 10px", borderRadius: 3, background: "rgba(255,255,255,0.1)", color: "#e8e8e8" }}>
          Chat
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5" style={{ padding: 16 }}>
        {/* Context card */}
        <div style={{ background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 6, padding: "10px 12px", fontSize: 11.5, color: "#888888", lineHeight: 1.5 }}>
          <strong style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
            📍 Current Scene Context
          </strong>
          Scene {currentScene} · {stripHtml(scenes[currentScene - 1]?.text || "Start writing")} · {
            (() => {
              const chars = [];
              let inScene = false;
              for (const el of elements) {
                if (el.type === "scene-heading") {
                  if (inScene) break;
                  if (getCurrentSceneIndex(elements, el.id) === currentScene) inScene = true;
                }
                if (inScene && el.type === "character" && !chars.includes(stripHtml(el.text))) chars.push(stripHtml(el.text));
              }
              return chars.length > 0 ? chars.join(" + ") : "No characters yet";
            })()
          }
        </div>

        {messages.map((msg) => (
          <AIMessage key={msg.id} msg={msg} />
        ))}

        {isStreaming && (
          <div className="flex gap-2.5" style={{ animation: "fadeUp 0.3s ease" }}>
            <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: "rgba(100,116,139,0.2)", color: "#64748b", fontSize: 11, fontWeight: 600, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>S</div>
            <div className="flex-1">
              <div style={{ fontSize: 10, color: "#555555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>ScriptMind</div>
              <div style={{ fontSize: 12.5, background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "10px 12px", color: "#64748b" }}>
                <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>
                <span style={{ animation: "pulse 1s ease-in-out infinite 0.2s" }}> ●</span>
                <span style={{ animation: "pulse 1s ease-in-out infinite 0.4s" }}> ●</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 12, borderTop: "1px solid #334155" }}>
        <div className="flex gap-1.5" style={{ marginBottom: 8 }}>
          <button
            onClick={handleRewriteScene}
            disabled={isStreaming}
            className="flex items-center gap-1"
            style={{ fontSize: 11, padding: "4px 9px", borderRadius: 3, border: "1px solid #334155", background: "transparent", color: "#888888", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: isStreaming ? 0.5 : 1, transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(100,116,139,0.2), rgba(255,255,255,0.15))"; e.currentTarget.style.color = "#e8e8e8"; e.currentTarget.style.borderColor = "rgba(100,116,139,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; e.currentTarget.style.borderColor = "#334155"; }}
          >
            <SparkleIcon /> Rewrite scene
          </button>
          <button
            onClick={handleSuggestNext}
            disabled={isStreaming}
            className="flex items-center gap-1"
            style={{ fontSize: 11, padding: "4px 9px", borderRadius: 3, border: "1px solid #334155", background: "transparent", color: "#888888", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: isStreaming ? 0.5 : 1, transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(100,116,139,0.2), rgba(255,255,255,0.15))"; e.currentTarget.style.color = "#e8e8e8"; e.currentTarget.style.borderColor = "rgba(100,116,139,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; e.currentTarget.style.borderColor = "#334155"; }}
          >
            <SparkleIcon /> Suggest next line
          </button>
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
            placeholder="Ask anything about your script…"
            rows={2}
            style={{
              flex: 1, background: "#1e293b", border: "1px solid #334155",
              borderRadius: 6, padding: "9px 12px", fontSize: 12.5,
              color: "#e8e8e8", fontFamily: "inherit", resize: "none",
              outline: "none", lineHeight: 1.5,
            }}
            onFocus={(e) => { e.target.style.borderColor = "#64748b"; }}
            onBlur={(e) => { e.target.style.borderColor = "#334155"; }}
          />
          <button
            onClick={() => sendMessage(chatInput)}
            disabled={isStreaming || !chatInput.trim()}
            style={{
              width: 34, height: 34, borderRadius: 6,
              backgroundImage: chatInput.trim() ? "linear-gradient(135deg, #64748b, #94a3b8, #64748b)" : "none",
              backgroundColor: chatInput.trim() ? "transparent" : "#334155",
              backgroundSize: "200% 200%",
              animation: chatInput.trim() ? "gradientShift 3s ease infinite" : "none",
              border: "none", cursor: chatInput.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", flexShrink: 0, transition: "all 0.15s",
              boxShadow: chatInput.trim() ? "0 2px 12px rgba(100,116,139,0.4)" : "none",
            }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
