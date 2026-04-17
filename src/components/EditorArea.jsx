import { PAGE_HEIGHT, PAGE_GAP, HEADER_HEIGHT, FOOTER_HEIGHT } from "../hooks/usePageLayout";
import ScriptElement from "./ScriptElement";

const ELEMENT_TYPES = ["scene-heading", "action", "character", "dialogue", "parenthetical", "transition", "shot", "centered"];

export default function EditorArea({
  elements, activeElId, setActiveElId, changeElementType,
  updateElement, handleKeyDown, sceneNumberMap,
  suggestions, acIndex, setAcIndex, acceptSuggestion,
  contentRef, editorScrollRef, numPages, currentPage, currentScene, pageBreakMarkers,
  titlePage, setShowTitlePageEditor,
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#6D8196" }}>
      {/* Toolbar */}
      <div className="flex items-center flex-shrink-0" style={{ height: 38, background: "#6D8196", borderBottom: "1px solid #334155", padding: "0 16px", gap: 4 }}>
        {ELEMENT_TYPES.map((type) => {
          const activeEl = elements.find((e) => e.id === activeElId);
          const isActive = activeEl?.type === type;
          const label = type.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
          return (
            <button
              key={type}
              onClick={() => { if (activeElId) changeElementType(activeElId, type); }}
              style={{
                fontSize: 11, padding: "3px 9px", borderRadius: 3,
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                border: isActive ? "1px solid rgba(255,255,255,0.25)" : "1px solid transparent",
                color: isActive ? "#e8e8e8" : "#888888",
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
                transition: "all 0.1s",
              }}
            >
              {label}
            </button>
          );
        })}
        {/* Formatting separator + B/I/U buttons */}
        <div style={{ width: 1, height: 18, background: "#334155", margin: "0 4px" }} />
        {[
          { label: "B", cmd: "bold", style: { fontWeight: 700 } },
          { label: "I", cmd: "italic", style: { fontStyle: "italic" } },
          { label: "U", cmd: "underline", style: { textDecoration: "underline" } },
        ].map((fmt) => (
          <button
            key={fmt.cmd}
            onClick={() => { document.execCommand(fmt.cmd); }}
            style={{
              fontSize: 12, padding: "3px 7px", borderRadius: 3,
              background: "transparent", border: "1px solid transparent",
              color: "#888888", cursor: "pointer",
              fontFamily: "'Courier Prime', 'Courier New', monospace",
              transition: "all 0.1s", ...fmt.style,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#e8e8e8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; }}
            title={`${fmt.cmd.charAt(0).toUpperCase() + fmt.cmd.slice(1)} (⌘${fmt.label})`}
          >
            {fmt.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#555555" }}>
          Page {currentPage} of {numPages} · Scene {currentScene}
        </div>
      </div>

      {/* Editor — continuous flow with page gaps */}
      <div ref={editorScrollRef} className="flex-1 overflow-y-auto flex flex-col items-center" style={{ padding: "32px 24px", background: "#6D8196" }}>
        {/* Visual Title Page */}
        <div
          onClick={() => setShowTitlePageEditor(true)}
          style={{
            width: 680, height: PAGE_HEIGHT, marginBottom: PAGE_GAP, borderRadius: 2, cursor: "pointer",
            background: "#ffffff", position: "relative", flexShrink: 0,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(100,116,139,0.15)",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            fontFamily: "'Courier Prime', 'Courier New', monospace", color: "#111",
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(100,116,139,0.3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(100,116,139,0.15)"; }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24pt", fontWeight: "bold", marginBottom: 8 }}>{titlePage.title || "Untitled"}</div>
            {titlePage.credit && <div style={{ fontSize: "12pt", marginBottom: 4 }}>{titlePage.credit}</div>}
            {titlePage.author && <div style={{ fontSize: "12pt", fontWeight: "bold" }}>{titlePage.author}</div>}
            {titlePage.source && <div style={{ fontSize: "12pt", marginTop: 16 }}>Based on {titlePage.source}</div>}
          </div>
          {(titlePage.draftDate || titlePage.contact) && (
            <div style={{ position: "absolute", bottom: 72, right: 72, textAlign: "left", fontSize: "10pt" }}>
              {titlePage.draftDate && <div>{titlePage.draftDate}</div>}
              {titlePage.contact && <div style={{ whiteSpace: "pre-line" }}>{titlePage.contact}</div>}
            </div>
          )}
          <div style={{ position: "absolute", top: 8, right: 12, fontSize: 10, color: "#aaa", opacity: 0.6 }}>Click to edit</div>
        </div>

        <div style={{ position: "relative", width: 680, flexShrink: 0, minHeight: numPages * PAGE_HEIGHT + (numPages - 1) * PAGE_GAP }}>
          {/* SVG clipPath — clips content to body area only (excludes header/footer margins) */}
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <clipPath id="page-clip">
                {Array.from({ length: numPages }, (_, i) => {
                  const pageTop = i * (PAGE_HEIGHT + PAGE_GAP);
                  const yStart = pageTop + (i === 0 ? 0 : HEADER_HEIGHT);
                  const height = i === 0 ? PAGE_HEIGHT - FOOTER_HEIGHT : PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;
                  return <rect key={i} x="0" y={yStart} width="680" height={height} rx="2" />;
                })}
              </clipPath>
            </defs>
          </svg>
          {/* White page backgrounds with shadow */}
          {Array.from({ length: numPages }, (_, i) => (
            <div key={`page-${i}`} style={{
              position: "absolute",
              top: i * (PAGE_HEIGHT + PAGE_GAP),
              left: 0, width: 680, height: PAGE_HEIGHT,
              borderRadius: 2,
              background: "#ffffff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(100,116,139,0.15), 0 0 120px rgba(100,116,139,0.05)",
              pointerEvents: "none",
            }} />
          ))}
          {/* Content — continuous flow, clipped to body areas of each page */}
          <div
            ref={contentRef}
            style={{
              width: 680,
              background: "#ffffff",
              borderRadius: 2,
              padding: "72px 72px 72px 108px",
              color: "#6D8196",
              position: "relative",
              clipPath: "url(#page-clip)",
            }}
          >
            {(() => {
              const rendered = [];

              const collectGroup = (startIdx) => {
                const group = [startIdx];
                for (let j = startIdx + 1; j < elements.length; j++) {
                  if (elements[j].type === "dialogue" || elements[j].type === "parenthetical") group.push(j);
                  else break;
                }
                return group;
              };

              const renderEl = (el, isDualColumn = false) => (
                <div
                  key={el.id}
                  id={`script-el-${el.id}`}
                  style={{ position: "relative" }}
                >
                  <ScriptElement
                    element={el}
                    isActive={el.id === activeElId}
                    onClick={setActiveElId}
                    onChange={updateElement}
                    onKeyDown={handleKeyDown}
                    sceneNumber={sceneNumberMap[el.id]}
                    isDualColumn={isDualColumn}
                  />
                  {el.id === activeElId && suggestions.length > 0 && (
                    <div style={{
                      position: "absolute", left: 0, top: "100%", zIndex: 20,
                      background: "#6D8196", border: "1px solid #475569", borderRadius: 4,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.5)", minWidth: 220, maxWidth: 400,
                      overflow: "hidden", marginTop: 2,
                    }}>
                      {suggestions.map((s, si) => (
                        <div
                          key={si}
                          onMouseDown={(ev) => { ev.preventDefault(); acceptSuggestion(s); }}
                          onMouseEnter={() => setAcIndex(si)}
                          style={{
                            padding: "6px 12px", fontSize: 12, cursor: "pointer",
                            fontFamily: "'Courier Prime', 'Courier New', monospace",
                            background: si === acIndex ? "rgba(100,116,139,0.25)" : "transparent",
                            color: si === acIndex ? "#e8e8e8" : "#aaa",
                            borderLeft: si === acIndex ? "2px solid #64748b" : "2px solid transparent",
                          }}
                        >
                          {s}
                        </div>
                      ))}
                      <div style={{ padding: "4px 12px", fontSize: 10, color: "#555", borderTop: "1px solid #334155" }}>
                        ↑↓ navigate · Tab/Enter accept · Esc dismiss
                      </div>
                    </div>
                  )}
                </div>
              );

              let i = 0;
              while (i < elements.length) {
                const el = elements[i];
                if (el.type === "character" && !el.dual) {
                  const leftGroup = collectGroup(i);
                  const nextIdx = leftGroup[leftGroup.length - 1] + 1;
                  if (nextIdx < elements.length && elements[nextIdx].type === "character" && elements[nextIdx].dual) {
                    const rightGroup = collectGroup(nextIdx);
                    rendered.push(
                      <div key={`dual-${el.id}`} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {leftGroup.map((idx) => renderEl(elements[idx], true))}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {rightGroup.map((idx) => renderEl(elements[idx], true))}
                        </div>
                      </div>
                    );
                    i = rightGroup[rightGroup.length - 1] + 1;
                    continue;
                  }
                }
                rendered.push(renderEl(el));
                i++;
              }
              return rendered;
            })()}
          </div>
          {/* Page headers & footers */}
          {Array.from({ length: numPages }, (_, i) => (
            <div key={`page-hf-${i}`} style={{ position: "absolute", top: i * (PAGE_HEIGHT + PAGE_GAP), left: 0, width: 680, height: PAGE_HEIGHT, pointerEvents: "none", zIndex: 2 }}>
              {i > 0 && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: HEADER_HEIGHT,
                  padding: "0 72px 0 108px",
                  display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                }}>
                  {(() => {
                    const marker = pageBreakMarkers.find(m => m.pageIndex === i - 1);
                    return marker ? (
                      <span style={{
                        fontFamily: "'Courier Prime', 'Courier New', monospace",
                        fontSize: "12pt", color: "#333333", paddingBottom: 4,
                      }}>{marker.characterName} (CONT'D)</span>
                    ) : <span />;
                  })()}
                  <span style={{
                    fontFamily: "'Courier Prime', 'Courier New', monospace",
                    fontSize: "12pt",
                    color: "#333333",
                    paddingBottom: 4,
                  }}>
                    {i + 1}.
                  </span>
                </div>
              )}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: FOOTER_HEIGHT,
                padding: "0 72px 0 108px",
                display: "flex", alignItems: "flex-start", justifyContent: "center",
              }}>
                {pageBreakMarkers.some(m => m.pageIndex === i) && (
                  <span style={{
                    fontFamily: "'Courier Prime', 'Courier New', monospace",
                    fontSize: "12pt", color: "#333333",
                  }}>(MORE)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
