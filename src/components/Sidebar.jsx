import { stripHtml } from "../utils/html";
import { getCurrentSceneIndex } from "../utils/screenplay";
import { PlusIcon } from "./Icons";

export default function Sidebar({ scenes, elements, activeElId, currentScene, jumpToScene, insertElementAfter, numPages, wordCount, lastSaved }) {
  return (
    <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 220, background: "linear-gradient(180deg, #6D8196, #6D8196, #6D8196)", borderRight: "1px solid #334155" }}>
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555555", marginBottom: 8 }}>
          Scenes
        </div>
        <div className="flex flex-col gap-0.5" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {scenes.map((scene, i) => {
            const isActive = scene.id === activeElId || getCurrentSceneIndex(elements, activeElId) === i + 1;
            const color = isActive ? "#64748b" : "#555555";
            return (
              <div
                key={scene.id}
                onClick={() => jumpToScene(scene.id)}
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  padding: "7px 10px", borderRadius: 4,
                  background: isActive ? "rgba(100,116,139,0.15)" : "transparent",
                  borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
                  boxShadow: isActive ? `inset 3px 0 8px -4px ${color}` : "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#1e293b"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, minWidth: 18, height: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%", backgroundColor: isActive ? "rgba(100,116,139,0.13)" : "rgba(85,85,85,0.13)", color: color, fontWeight: 600,
                }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: isActive ? "#e8e8e8" : "#888888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
          style={{ fontSize: 11, color: "#555555", background: "transparent", border: "1px dashed #334155", borderRadius: 4, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#888888"; e.currentTarget.style.borderColor = "#888888"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#555555"; e.currentTarget.style.borderColor = "#334155"; }}
        >
          <PlusIcon /> Add Scene
        </button>
      </div>

      <div className="mt-auto" style={{ padding: 12, borderTop: "1px solid #334155" }}>
        {[
          ["Pages", `${numPages} / 110`],
          ["Words", wordCount.toLocaleString()],
          ["Scenes", scenes.length],
          ["Last saved", lastSaved],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between" style={{ fontSize: 11, color: "#555555", marginBottom: 2 }}>
            <span>{label}</span>
            <span style={{ color: "#888888" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
