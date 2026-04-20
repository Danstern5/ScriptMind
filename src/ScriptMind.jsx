import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { uid } from "./utils/ids";
import { stripHtml } from "./utils/html";
import { getScenes, getWordCount, getSmartSuggestions, getCurrentSceneIndex } from "./utils/screenplay";
import { getNextType, cycleType, autoFormatText } from "./utils/elementTypes";
import { FileIcon, DownloadIcon, ChevronIcon } from "./components/Icons";
import useAIChat from "./hooks/useAIChat";
import usePageLayout from "./hooks/usePageLayout";
import useFileOperations from "./hooks/useFileOperations";
import useAuth from "./hooks/useAuth";
import ContextMenu from "./components/ContextMenu";
import TitlePageEditor from "./components/TitlePageEditor";
import RenameCharacterModal from "./components/RenameCharacterModal";
import FileMenu from "./components/FileMenu";
import Sidebar from "./components/Sidebar";
import EditorArea from "./components/EditorArea";
import AIPanel from "./components/AIPanel";
import SelectionToolbar from "./components/SelectionToolbar";
import ScriptBible from "./components/ScriptBible";
import { DEFAULT_SCRIPT_BIBLE } from "./utils/scriptBible";

// ─── Constants ───
const DEFAULT_SCRIPT = {
  title: "Untitled Screenplay",
  author: "",
  elements: [
    { id: "el-1", type: "action", text: "" },
  ],
};

const DEFAULT_TITLE_PAGE = {
  title: "Untitled Screenplay",
  credit: "written by",
  author: "",
  source: "",
  draftDate: "",
  contact: "",
};

// ─── Main App ───
export default function ScriptMind() {
  const { logout } = useAuth();
  const [elements, setElements] = useState(() => {
    try {
      const saved = localStorage.getItem("scriptmind_elements");
      return saved ? JSON.parse(saved) : DEFAULT_SCRIPT.elements;
    } catch { return DEFAULT_SCRIPT.elements; }
  });
  const [activeElId, setActiveElId] = useState(() => {
    try {
      const saved = localStorage.getItem("scriptmind_elements");
      const els = saved ? JSON.parse(saved) : DEFAULT_SCRIPT.elements;
      return els[0]?.id || "el-1";
    } catch { return "el-1"; }
  });
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState("just now");
  const [scriptTitle, setScriptTitle] = useState(() => {
    return localStorage.getItem("scriptmind_title") || "untitled_screenplay";
  });
  const [notification, setNotification] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [renameModal, setRenameModal] = useState(null); // { oldName, newName }
  const [titlePage, setTitlePage] = useState(() => {
    try {
      const saved = localStorage.getItem("scriptmind_titlepage");
      return saved ? JSON.parse(saved) : DEFAULT_TITLE_PAGE;
    } catch { return DEFAULT_TITLE_PAGE; }
  });
  const [showTitlePageEditor, setShowTitlePageEditor] = useState(false);
  const [toolbarSelection, setToolbarSelection] = useState(null); // { text, rect } | null
  const [showScriptBible, setShowScriptBible] = useState(false);
  const [scriptBible, setScriptBible] = useState(() => {
    try {
      const saved = localStorage.getItem("scriptmind_bible");
      return saved ? JSON.parse(saved) : DEFAULT_SCRIPT_BIBLE;
    } catch { return DEFAULT_SCRIPT_BIBLE; }
  });

  const [acIndex, setAcIndex] = useState(-1); // autocomplete selected index

  const editorScrollRef = useRef(null);

  // Scenes
  const scenes = useMemo(() => getScenes(elements), [elements]);
  const wordCount = useMemo(() => getWordCount(elements), [elements]);
  const currentScene = useMemo(() => getCurrentSceneIndex(elements, activeElId), [elements, activeElId]);
  const activeElement = useMemo(() => elements.find(e => e.id === activeElId), [elements, activeElId]);
  const sceneNumberMap = useMemo(() => {
    const map = {};
    let num = 0;
    elements.forEach(el => { if (el.type === "scene-heading") { num++; map[el.id] = num; } });
    return map;
  }, [elements]);
  const suggestions = useMemo(() => getSmartSuggestions(elements, activeElement), [elements, activeElement]);

  const {
    messages, setMessages,
    chatInput, setChatInput,
    isStreaming,
    chatEndRef,
    sendMessage,
    handleRewriteScene,
    handleSuggestNext,
  } = useAIChat(elements, currentScene, activeElId);

  const { contentRef, numPages, currentPage, pageBreakMarkers } = usePageLayout(elements, activeElId, editorScrollRef);

  // Auto-save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem("scriptmind_elements", JSON.stringify(elements));
        localStorage.setItem("scriptmind_title", scriptTitle);
        localStorage.setItem("scriptmind_titlepage", JSON.stringify(titlePage));
        localStorage.setItem("scriptmind_bible", JSON.stringify(scriptBible));
        setLastSaved("just now");
      } catch { /* storage full — silent fail */ }
    }, 500); // debounce 500ms
    return () => clearTimeout(timeout);
  }, [elements, scriptTitle, titlePage, scriptBible]);

  // Notifications
  const showNotification = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  const {
    isDragging, fileInputRef,
    handleNew, handleImport, handleFileChange,
    handleDragEnter, handleDragLeave, handleDragOver, handleDrop,
    handleExportFountain, handleExportFDX, handleExportPDF,
  } = useFileOperations({ elements, scriptTitle, titlePage, setElements, setActiveElId, setScriptTitle, setTitlePage, setMessages, showNotification });

  // Element operations
  const updateElement = useCallback((id, text) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, text } : el))
    );
  }, []);

  const insertElementAfter = useCallback((afterId, type, text = "") => {
    const newEl = { id: uid(), type, text };
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === afterId);
      const copy = [...prev];
      copy.splice(idx + 1, 0, newEl);
      return copy;
    });
    setActiveElId(newEl.id);
    return newEl.id;
  }, []);

  const removeElement = useCallback((id) => {
    setElements((prev) => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex((e) => e.id === id);
      const newEls = prev.filter((e) => e.id !== id);
      const newActive = idx > 0 ? newEls[idx - 1].id : newEls[0].id;
      setActiveElId(newActive);
      return newEls;
    });
  }, []);

  const changeElementType = useCallback((id, newType) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        return { ...el, type: newType, text: autoFormatText(newType, el.text) };
      })
    );
  }, []);

  const toggleDual = useCallback((id) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id || el.type !== "character") return el;
        const next = { ...el };
        if (next.dual) delete next.dual; else next.dual = true;
        return next;
      })
    );
  }, []);

  const renameCharacter = useCallback((oldName, newName) => {
    if (!oldName.trim() || !newName.trim()) return;
    const oldUpper = oldName.trim().toUpperCase();
    const newTrimmed = newName.trim();
    const escaped = oldName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
    let count = 0;
    setElements((prev) =>
      prev.map((el) => {
        if (el.type === "character") {
          const plain = stripHtml(el.text).trim().toUpperCase();
          if (plain === oldUpper) {
            count++;
            return { ...el, text: newTrimmed.toUpperCase() };
          }
          return el;
        }
        // Other elements: only replace if there's a match
        const replaced = el.text.replace(pattern, newTrimmed);
        if (replaced !== el.text) {
          count++;
          return { ...el, text: replaced };
        }
        return el;
      })
    );
    showNotification(`Renamed "${oldName.trim()}" → "${newTrimmed}" (${count} elements updated)`);
  }, []);

  // Accept autocomplete suggestion
  const acceptSuggestion = useCallback((text) => {
    if (!activeElId) return;
    updateElement(activeElId, text);
    setAcIndex(-1);
    // Focus and move cursor to end after React re-render
    requestAnimationFrame(() => {
      const dom = document.getElementById(`script-el-${activeElId}`);
      const editable = dom?.querySelector("[contenteditable]");
      if (editable) {
        editable.innerHTML = text;
        editable.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editable);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }, [activeElId, updateElement]);

  // Reset autocomplete index when active element or suggestions change
  useEffect(() => { setAcIndex(-1); }, [activeElId, suggestions.length]);

  // Right-click context menu for character elements
  useEffect(() => {
    const handler = (e) => {
      let node = e.target;
      while (node && node !== document) {
        const match = node.id?.match?.(/^script-el-(.+)$/);
        if (match) {
          const elId = match[1];
          const el = elements.find((x) => x.id === elId);
          if (el?.type === "character") {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, elId: el.id, isDual: !!el.dual });
            return;
          }
        }
        node = node.parentElement;
      }
    };
    document.addEventListener("contextmenu", handler, true);
    return () => document.removeEventListener("contextmenu", handler, true);
  }, [elements]);

  // Key handling
  const handleKeyDown = useCallback((e, element) => {
    // Autocomplete navigation
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAcIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAcIndex(prev => Math.max(prev - 1, -1));
        return;
      }
      if ((e.key === "Tab" || e.key === "Enter") && acIndex >= 0 && !e.shiftKey) {
        e.preventDefault();
        acceptSuggestion(suggestions[acIndex]);
        return;
      }
      if (e.key === "Escape") {
        setAcIndex(-1);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Auto-format current element
      const formatted = autoFormatText(element.type, element.text);
      if (formatted !== element.text) updateElement(element.id, formatted);
      const nextType = getNextType(element.type);
      insertElementAfter(element.id, nextType);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const newType = cycleType(element.type);
      changeElementType(element.id, newType);
    } else if (e.key === "Backspace" && element.text === "") {
      e.preventDefault();
      removeElement(element.id);
    }
  }, [updateElement, insertElementAfter, changeElementType, removeElement, suggestions, acIndex, acceptSuggestion]);

  // Scene navigation
  const jumpToScene = (sceneId) => {
    setActiveElId(sceneId);
    const el = document.getElementById(`script-el-${sceneId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Click outside to close file menu
  useEffect(() => {
    const handler = (e) => {
      if (fileMenuOpen) setFileMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [fileMenuOpen]);

  // Selection toolbar action handler
  const handleSelectionAction = useCallback((actionType, selectedText) => {
    const trimmed = selectedText?.trim();
    setToolbarSelection(null);
    if (!trimmed) return;
    const promptMap = {
      alternatives: "Give me 2–3 alternative phrasings for this line or section. Keep them in the same voice and tone.",
      consistency: "Check this against the rest of the script for logical consistency and character voice. Flag anything that feels off.",
      discuss: "Let's discuss this moment. What's working, what could be stronger, and what choices am I making here?",
    };
    sendMessage(promptMap[actionType] || promptMap.discuss, trimmed);
  }, [sendMessage]);

  // Selection detection — scoped to the editor scroll container
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const editorEl = editorScrollRef.current;
        if (!editorEl) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) { setToolbarSelection(null); return; }
        const text = sel.toString();
        if (!text.trim()) { setToolbarSelection(null); return; }
        try {
          const range = sel.getRangeAt(0);
          if (!editorEl.contains(range.commonAncestorContainer)) {
            setToolbarSelection(null);
            return;
          }
          const rect = range.getBoundingClientRect();
          setToolbarSelection({ text, rect });
        } catch {
          setToolbarSelection(null);
        }
      }, 10);
    };

    const handleMouseDown = (e) => {
      if (e.target.closest?.("[data-selection-toolbar]")) return;
      const editorEl = editorScrollRef.current;
      if (editorEl && !editorEl.contains(e.target)) setToolbarSelection(null);
    };

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setToolbarSelection(null);
        setShowScriptBible(false);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{ background: "var(--bg-canvas)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes rotateSpark { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes ringPulse { 0% { box-shadow: 0 0 4px #4ade80, 0 0 8px rgba(74,222,128,0.4); } 50% { box-shadow: 0 0 8px #4ade80, 0 0 16px rgba(74,222,128,0.6); } 100% { box-shadow: 0 0 4px #4ade80, 0 0 8px rgba(74,222,128,0.4); } }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--text-placeholder); pointer-events: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cccccc; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #aaaaaa; }
        ::selection { background: rgba(74,222,128,0.25); }
      `}</style>

      {/* Floating selection toolbar (editor text selection) */}
      <SelectionToolbar selection={toolbarSelection} onAction={handleSelectionAction} />

      {/* Script Bible slide-over (Writing Mode) */}
      {showScriptBible && (
        <>
          <div
            onClick={() => setShowScriptBible(false)}
            style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.15)" }}
          />
          <div style={{
            position: "fixed", top: 48, left: 220, bottom: 24, width: 560, zIndex: 91,
            background: "var(--bg-surface)", borderRight: "1px solid var(--border-default)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
            display: "flex", flexDirection: "column",
            animation: "slideInLeft 0.2s ease",
          }}>
            <style>{`@keyframes slideInLeft { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }`}</style>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border-default)", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Script Bible</div>
              <button
                onClick={() => setShowScriptBible(false)}
                style={{ background: "none", border: "none", color: "var(--text-label)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-label)"; }}
              >×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <ScriptBible bible={scriptBible} onChange={setScriptBible} mode="writing" />
            </div>
          </div>
        </>
      )}

      {/* Title Page Editor Modal */}
      {showTitlePageEditor && (
        <TitlePageEditor titlePage={titlePage} onChange={setTitlePage} onClose={() => setShowTitlePageEditor(false)} />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: "Rename Character",
              action: () => {
                const el = elements.find((e) => e.id === contextMenu.elId);
                if (el) setRenameModal({ oldName: stripHtml(el.text).trim(), newName: "" });
              },
            },
            {
              label: "Dual Dialogue",
              checked: contextMenu.isDual,
              action: () => toggleDual(contextMenu.elId),
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Rename Character Modal */}
      {renameModal && (
        <RenameCharacterModal
          oldName={renameModal.oldName}
          onRename={(oldName, newName) => { renameCharacter(oldName, newName); setRenameModal(null); }}
          onClose={() => setRenameModal(null)}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2" style={{ animation: "slideIn 0.2s ease", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "var(--text-primary)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
          <span style={{ color: "var(--accent-green)", marginRight: 6 }}>✓</span> {notification}
        </div>
      )}

      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="flex flex-col items-center gap-4" style={{ animation: "fadeUp 0.2s ease" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, border: "2px dashed var(--accent-green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)" }}>
              Drop your screenplay here
            </div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              .fountain, .fdx, or .txt files supported
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".fountain,.fdx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── TOP BAR ── */}
      <div className="flex items-center flex-shrink-0" style={{ height: 48, background: "var(--bg-canvas)", borderBottom: "1px solid var(--border-default)", padding: "0 16px", gap: 16 }}>
        <div style={{
          fontFamily: "var(--font-serif)", fontSize: 17, letterSpacing: "0.02em",
          color: "var(--text-primary)",
        }}>
          Script<span style={{ fontStyle: "italic" }}>Mind</span>
        </div>
        <div style={{ width: 1, height: 20, background: "var(--border-default)" }} />
        <div style={{ fontFamily: "var(--font-mono-ui)", fontSize: 12, color: "var(--text-tertiary)" }}>
          {scriptTitle}.fdx
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFileMenuOpen(!fileMenuOpen)}
              className="flex items-center gap-1"
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
            >
              <FileIcon /> File <ChevronIcon />
            </button>
            <FileMenu
              isOpen={fileMenuOpen}
              onToggle={() => setFileMenuOpen(false)}
              onNew={handleNew}
              onTitlePage={() => setShowTitlePageEditor(true)}
              onImport={handleImport}
              onExportPDF={handleExportPDF}
              onExportFountain={handleExportFountain}
              onExportFDX={handleExportFDX}
            />
          </div>
          <button
            onClick={handleExportPDF}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}
          >
            <DownloadIcon /> Export PDF
          </button>
          <button
            onClick={logout}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          scenes={scenes} elements={elements} activeElId={activeElId}
          currentScene={currentScene} jumpToScene={jumpToScene}
          insertElementAfter={insertElementAfter}
          numPages={numPages} wordCount={wordCount} lastSaved={lastSaved}
          onOpenScriptBible={() => setShowScriptBible(true)}
        />
        <EditorArea
          elements={elements} activeElId={activeElId} setActiveElId={setActiveElId}
          changeElementType={changeElementType} updateElement={updateElement}
          handleKeyDown={handleKeyDown} sceneNumberMap={sceneNumberMap}
          suggestions={suggestions} acIndex={acIndex} setAcIndex={setAcIndex}
          acceptSuggestion={acceptSuggestion}
          contentRef={contentRef} editorScrollRef={editorScrollRef}
          numPages={numPages} currentPage={currentPage} currentScene={currentScene}
          pageBreakMarkers={pageBreakMarkers}
          titlePage={titlePage} setShowTitlePageEditor={setShowTitlePageEditor}
        />
        <AIPanel
          messages={messages} chatInput={chatInput} setChatInput={setChatInput}
          isStreaming={isStreaming} chatEndRef={chatEndRef}
          sendMessage={sendMessage} handleRewriteScene={handleRewriteScene}
          handleSuggestNext={handleSuggestNext}
          currentScene={currentScene} scenes={scenes} elements={elements}
        />
      </div>

      {/* ── STATUS BAR ── */}
      <div className="flex items-center flex-shrink-0" style={{ height: 24, background: "var(--bg-canvas)", borderTop: "1px solid var(--border-default)", padding: "0 16px", gap: 16, fontSize: 10.5, color: "var(--text-label)", fontFamily: "var(--font-mono-ui)" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-green)" }} />
        <span>Auto-saved</span>
        <span>·</span>
        <span>Screenplay format</span>
        <span>·</span>
        <span>Industry standard ✓</span>
        <div className="flex gap-3.5 ml-auto">
          <span>UTF-8</span>
          <span>Scenes: {scenes.length}</span>
          <span>{numPages} pages</span>
        </div>
      </div>
    </div>
  );
}
