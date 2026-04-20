import { stripHtml } from "../utils/html";
import { getCurrentSceneIndex } from "../utils/screenplay";
import { PlusIcon } from "./Icons";

export default function Sidebar({ scenes, elements, activeElId, currentScene, jumpToScene, insertElementAfter, numPages, wordCount, lastSaved, onOpenScriptBible, isThinkingMode }) {
  return (
    <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: isThinkingMode ? 40 : 220, background: "#ebebeb", borderRight: "1px solid var(--border-default)", transition: "width 0.35s ease" }}>
      {isThinkingMode ? (
        <div className="flex flex-col items-center" style={{ paddingTop: 12, gap: 6, overflowY: "auto", flex: 1 }}>
          {scenes.map((scene, i) => {
            const isActive = getCurrentSceneIndex(elements, activeElId) === i + 1;
            return (
              <div
                key={scene.id}
                onClick={() => jumpToScene(scene.id)}
                title={stripHtml(scene.text) || "UNTITLED SCENE"}
                style={{
                  width: 24, height: 24, borderRadius: "50%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: isActive ? "rgba(74,222,128,0.15)" : "rgba(0,0,0,0.07)",
                  color: isActive ? "var(--accent-green)" : "var(--text-tertiary)",
                  fontSize: 9, fontFamily: "var(--font-mono-ui)", fontWeight: 600,
                  border: isActive ? "1px solid rgba(74,222,128,0.4)" : "1px solid transparent",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      ) : (
      <div className="flex flex-col flex-1" style={{ width: 220 }}>
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-label)", marginBottom: 8, fontFamily: "var(--font-mono-ui)" }}>
          Scenes
        </div>
        <div className="flex flex-col gap-0.5" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {scenes.map((scene, i) => {
            const isActive = scene.id === activeElId || getCurrentSceneIndex(elements, activeElId) === i + 1;
            return (
              <div
                key={scene.id}
                onClick={() => jumpToScene(scene.id)}
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  padding: "7px 10px", borderRadius: 4,
                  background: isActive ? "rgba(74,222,128,0.06)" : "transparent",
                  borderLeft: isActive ? "2px solid var(--accent-green)" : "2px solid transparent",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  fontFamily: "var(--font-mono-ui)", fontSize: 9, minWidth: 18, height: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: isActive ? "rgba(74,222,128,0.1)" : "rgba(0,0,0,0.07)",
                  color: isActive ? "var(--accent-green)" : "var(--text-label)",
                  fontWeight: 600,
                }}>{i + 1}</span>
                <span style={{
                  fontSize: 12,
                  color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  fontFamily: "var(--font-mono-ui)",
                }}>
                  {stripHtml(scene.text) || "UNTITLED SCENE"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Scene button */}
      <div style={{ padding: "4px 14px" }}>
        <button
          onClick={() => {
            const lastId = elements[elements.length - 1].id;
            insertElementAfter(lastId, "scene-heading", "");
          }}
          className="flex items-center gap-1.5 w-full"
          style={{ fontSize: 11, color: "var(--text-label)", background: "transparent", border: "1px dashed var(--text-placeholder)", borderRadius: 4, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "#999999"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-label)"; e.currentTarget.style.borderColor = "var(--text-placeholder)"; }}
        >
          <PlusIcon /> Add Scene
        </button>
      </div>

      <div className="mt-auto" style={{ borderTop: "1px solid var(--border-default)" }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-default)" }}>
          <button
            onClick={onOpenScriptBible}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, color: "var(--text-label)", background: "transparent",
              border: "1px solid var(--border-default)", borderRadius: 4, padding: "5px 8px",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-green)"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-label)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
          >
            <span style={{ fontSize: 13 }}>☰</span> Script Bible
          </button>
        </div>
        <div style={{ padding: 12 }}>
          {[
            ["Pages", `${numPages} / 110`],
            ["Words", wordCount.toLocaleString()],
            ["Scenes", scenes.length],
            ["Last saved", lastSaved],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between" style={{ fontSize: 11, color: "var(--text-label)", marginBottom: 2 }}>
              <span>{label}</span>
              <span style={{ color: "var(--text-secondary)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
