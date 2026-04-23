import { stripHtml } from "../utils/html";
import { getCurrentSceneIndex } from "../utils/screenplay";
import AIMessage from "./AIMessage";
import ScriptBible from "./ScriptBible";
import ScenarioCard from "./ScenarioCard";
import { SendIcon, SparkleIcon } from "./Icons";

const TAB_LABELS = { bible: "Script Bible", explore: "Explore", chat: "Chat" };

export default function AIPanel({
  messages, chatInput, setChatInput, isStreaming, chatEndRef,
  sendMessage, handleRewriteScene, handleSuggestNext,
  currentScene, scenes, elements,
  isThinkingMode, aiPanelTab, setAiPanelTab,
  scriptBible, setScriptBible,
  scenarios, isExploring, exploreError, anchoredScenario, clearAnchor,
  handleExplore, handleDiscuss, toggleScenarioImpact, toggleScenarioPreview,
}) {
  const tabs = isThinkingMode ? ["bible", "explore", "chat"] : ["chat"];
  return (
    <div className="flex flex-col" style={{ flex: isThinkingMode ? "1 1 0" : "0 0 360px", minWidth: 0, background: "var(--bg-panel)", borderLeft: "1px solid var(--border-default)", transition: "flex 0.35s ease" }}>
      {/* Header */}
      <div className="flex items-center" style={{ height: 48, borderBottom: "1px solid var(--border-default)", padding: "0 16px", gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #86efac, #4ade80)", animation: "ringPulse 2s ease-in-out infinite" }} />
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: "var(--text-primary)",
        }}>AI Collaborator</div>
        <div className="flex items-center gap-1 ml-auto">
          {tabs.map((tab) => {
            const active = aiPanelTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setAiPanelTab(tab)}
                style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 3,
                  background: active ? "rgba(0,0,0,0.07)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                  fontWeight: active ? 500 : 400,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {aiPanelTab === "bible" && (
        <div className="flex-1 overflow-y-auto">
          <ScriptBible bible={scriptBible} onChange={setScriptBible} mode="thinking" />
        </div>
      )}

      {aiPanelTab === "explore" && (
        <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: 16, gap: 12 }}>
          <button
            onClick={handleExplore}
            disabled={isExploring}
            className="flex items-center justify-center gap-1.5"
            style={{
              fontSize: 12, padding: "8px 12px", borderRadius: 4,
              border: "1px solid rgba(74,222,128,0.4)",
              background: "rgba(74,222,128,0.08)",
              color: "var(--accent-green)",
              cursor: isExploring ? "default" : "pointer",
              fontFamily: "inherit", fontWeight: 500,
              opacity: isExploring ? 0.6 : 1,
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            <SparkleIcon /> {isExploring ? "Analyzing…" : "Alternative Scene Analysis"}
          </button>

          {scenarios.length === 0 && !isExploring && !exploreError && (
            <div style={{ padding: "24px 8px", fontSize: 12, color: "var(--text-tertiary)", textAlign: "center", lineHeight: 1.6 }}>
              Click <strong>Alternative Scene Analysis</strong> to explore directions for this scene.
            </div>
          )}

          {exploreError && !isExploring && (
            <div style={{
              padding: "12px 14px", fontSize: 12, lineHeight: 1.5,
              color: "#8a3a3a", background: "rgba(185,74,74,0.05)",
              border: "1px solid rgba(185,74,74,0.25)", borderRadius: 6,
            }}>
              {exploreError}
            </div>
          )}

          {scenarios.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(280px, 1fr))", gap: 12, alignItems: "start" }}>
              {scenarios.map((scenario, i) => (
                <ScenarioCard
                  key={i}
                  scenario={scenario}
                  index={i}
                  onDiscuss={() => handleDiscuss(i)}
                  onToggleImpact={() => toggleScenarioImpact(i)}
                  onTogglePreview={() => toggleScenarioPreview(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {aiPanelTab === "chat" && (
        <>
      {anchoredScenario !== null && scenarios[anchoredScenario] && (
        <div className="flex items-center" style={{ margin: "12px 16px 0", padding: "6px 10px", borderRadius: 4, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", fontSize: 11.5, color: "var(--accent-green)", gap: 8 }}>
          <span style={{ flex: 1 }}>↳ Exploring: <strong style={{ fontWeight: 500 }}>"{scenarios[anchoredScenario].title}"</strong></span>
          <button
            onClick={clearAnchor}
            style={{ background: "transparent", border: "none", color: "var(--accent-green)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
            aria-label="Clear anchored scenario"
          >
            ×
          </button>
        </div>
      )}
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
        </>
      )}
    </div>
  );
}
