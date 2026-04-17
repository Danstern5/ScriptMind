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
    <div className="flex flex-col flex-shrink-0" style={{ width: 360, background: "var(--bg-panel)", borderLeft: "1px solid var(--border-default)" }}>
      {/* Header */}
      <div className="flex items-center" style={{ height: 48, borderBottom: "1px solid var(--border-default)", padding: "0 16px", gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #86efac, #4ade80)", animation: "ringPulse 2s ease-in-out infinite" }} />
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: "var(--text-primary)",
        }}>AI Collaborator</div>
        <div className="ml-auto" style={{ fontSize: 11, padding: "3px 10px", borderRadius: 3, background: "rgba(0,0,0,0.06)", color: "var(--text-secondary)" }}>
          Chat
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3.5" style={{ padding: 16 }}>
        {/* Context card */}
        <div style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, padding: "10px 12px", fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--accent-green)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
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
            <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: "rgba(74,222,128,0.1)", color: "var(--accent-green)", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-serif)", fontStyle: "italic" }}>S</div>
            <div className="flex-1">
              <div style={{ fontSize: 10, color: "var(--text-label)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>ScriptMind</div>
              <div style={{ fontSize: 12.5, background: "var(--bg-canvas)", border: "1px solid var(--border-default)", borderRadius: 6, padding: "10px 12px", color: "var(--accent-green)" }}>
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
      <div style={{ padding: 12, borderTop: "1px solid var(--border-default)" }}>
        <div className="flex gap-1.5" style={{ marginBottom: 8 }}>
          <button
            onClick={handleRewriteScene}
            disabled={isStreaming}
            className="flex items-center gap-1"
            style={{ fontSize: 11, padding: "4px 9px", borderRadius: 3, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-label)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: isStreaming ? 0.5 : 1, transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.08)"; e.currentTarget.style.color = "var(--accent-green)"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-label)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
          >
            <SparkleIcon /> Rewrite scene
          </button>
          <button
            onClick={handleSuggestNext}
            disabled={isStreaming}
            className="flex items-center gap-1"
            style={{ fontSize: 11, padding: "4px 9px", borderRadius: 3, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-label)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: isStreaming ? 0.5 : 1, transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.08)"; e.currentTarget.style.color = "var(--accent-green)"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-label)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
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
              flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-default)",
              borderRadius: 6, padding: "9px 12px", fontSize: 12.5,
              color: "var(--text-primary)", fontFamily: "inherit", resize: "none",
              outline: "none", lineHeight: 1.5,
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent-green)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; }}
          />
          <button
            onClick={() => sendMessage(chatInput)}
            disabled={isStreaming || !chatInput.trim()}
            style={{
              width: 34, height: 34, borderRadius: 6,
              backgroundImage: chatInput.trim() ? "linear-gradient(135deg, #16a34a, #4ade80, #16a34a)" : "none",
              backgroundColor: chatInput.trim() ? "transparent" : "#e8e8e8",
              backgroundSize: "200% 200%",
              animation: chatInput.trim() ? "gradientShift 3s ease infinite" : "none",
              border: "none", cursor: chatInput.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: chatInput.trim() ? "white" : "var(--text-label)", flexShrink: 0, transition: "all 0.15s",
              boxShadow: chatInput.trim() ? "0 2px 12px rgba(74,222,128,0.3)" : "none",
            }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
