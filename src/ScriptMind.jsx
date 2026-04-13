import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { exportPDF } from "./utils/pdfExport";
import { uid, msgId } from "./utils/ids";
import { stripHtml, escapeXml } from "./utils/html";
import { getScenes, getWordCount, getPageCount, getSmartSuggestions, getCurrentSceneIndex } from "./utils/screenplay";
import { getNextType, cycleType, autoFormatText, TAB_CYCLE } from "./utils/elementTypes";
import { elementsToFDX, elementsToFountain } from "./utils/export";
import { parseFountain, parseFDX } from "./utils/import";
import { SendIcon, PlusIcon, FileIcon, DownloadIcon, SparkleIcon, ChevronIcon } from "./components/Icons";
import ContextMenu from "./components/ContextMenu";
import ScriptElement from "./components/ScriptElement";
import AIMessage from "./components/AIMessage";
import TitlePageEditor from "./components/TitlePageEditor";
import RenameCharacterModal from "./components/RenameCharacterModal";
import FileMenu from "./components/FileMenu";

// ─── Constants ───
const ELEMENT_TYPES = ["scene-heading", "action", "character", "dialogue", "parenthetical", "transition", "shot", "centered"];

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

const INITIAL_MESSAGES = [];
// Page dimensions for visual page breaks
const PAGE_HEIGHT = 880;
const PAGE_GAP = 32;
const HEADER_HEIGHT = 44; // Reserved header margin (page number area)
const FOOTER_HEIGHT = 32; // Reserved footer margin
// ─── Main App ───
export default function ScriptMind() {
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
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState("just now");
  const [scriptTitle, setScriptTitle] = useState(() => {
    return localStorage.getItem("scriptmind_title") || "untitled_screenplay";
  });
  const [notification, setNotification] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [renameModal, setRenameModal] = useState(null); // { oldName, newName }
  const [titlePage, setTitlePage] = useState(() => {
    try {
      const saved = localStorage.getItem("scriptmind_titlepage");
      return saved ? JSON.parse(saved) : DEFAULT_TITLE_PAGE;
    } catch { return DEFAULT_TITLE_PAGE; }
  });
  const [showTitlePageEditor, setShowTitlePageEditor] = useState(false);

  const [acIndex, setAcIndex] = useState(-1); // autocomplete selected index

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorScrollRef = useRef(null);

  // Scenes
  const scenes = useMemo(() => getScenes(elements), [elements]);
  const wordCount = useMemo(() => getWordCount(elements), [elements]);
  const pageCount = useMemo(() => getPageCount(elements), [elements]);
  const currentScene = useMemo(() => getCurrentSceneIndex(elements, activeElId), [elements, activeElId]);
  const activeElement = useMemo(() => elements.find(e => e.id === activeElId), [elements, activeElId]);
  const sceneNumberMap = useMemo(() => {
    const map = {};
    let num = 0;
    elements.forEach(el => { if (el.type === "scene-heading") { num++; map[el.id] = num; } });
    return map;
  }, [elements]);
  const suggestions = useMemo(() => getSmartSuggestions(elements, activeElement), [elements, activeElement]);
  const contentRef = useRef(null);
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageBreakMarkers, setPageBreakMarkers] = useState([]); // [{pageIndex, characterName}]

  // Auto-save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem("scriptmind_elements", JSON.stringify(elements));
        localStorage.setItem("scriptmind_title", scriptTitle);
        localStorage.setItem("scriptmind_titlepage", JSON.stringify(titlePage));
        setLastSaved("just now");
      } catch { /* storage full — silent fail */ }
    }, 500); // debounce 500ms
    return () => clearTimeout(timeout);
  }, [elements, scriptTitle, titlePage]);

  // Calculate which visual page the active element is on
  useEffect(() => {
    if (!activeElId || !contentRef.current) return;
    const el = document.getElementById(`script-el-${activeElId}`);
    if (!el) return;
    const offsetTop = el.offsetTop;
    const page = Math.floor(offsetTop / (PAGE_HEIGHT + PAGE_GAP)) + 1;
    setCurrentPage(Math.min(page, numPages));
  }, [activeElId, numPages]);

  // Scroll active element into view when it's off-screen
  useEffect(() => {
    if (!activeElId || !editorScrollRef.current) return;
    const dom = document.getElementById(`script-el-${activeElId}`);
    if (!dom) return;
    const rect = dom.getBoundingClientRect();
    const container = editorScrollRef.current.getBoundingClientRect();
    if (rect.bottom > container.bottom || rect.top < container.top) {
      dom.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeElId]);

  // Push elements out of dead zones and calculate page count
  useEffect(() => {
    if (!contentRef.current) return;
    // Check if content needs more than one page
    const measurePages = () => {
      const totalH = contentRef.current.scrollHeight;
      return Math.max(1, Math.ceil(totalH / (PAGE_HEIGHT + PAGE_GAP)));
    };
    if (numPages <= 1) {
      const needed = measurePages();
      if (needed !== numPages) setNumPages(needed);
      return;
    }
    // Clear previous adjustments
    elements.forEach(el => {
      const dom = document.getElementById(`script-el-${el.id}`);
      if (dom) dom.style.paddingTop = "";
    });
    // Iterate elements in document order; inner loop finds which boundary (if any) is crossed
    for (const el of elements) {
      const dom = document.getElementById(`script-el-${el.id}`);
      if (!dom) continue;
      const top = dom.offsetTop;
      const bottom = top + dom.offsetHeight;
      for (let p = 0; p < numPages - 1; p++) {
        const bodyEnd = (p + 1) * PAGE_HEIGHT + p * PAGE_GAP - FOOTER_HEIGHT;
        const nextBodyStart = (p + 1) * (PAGE_HEIGHT + PAGE_GAP) + HEADER_HEIGHT;
        if ((top >= bodyEnd && top < nextBodyStart) || (top < bodyEnd && bottom > bodyEnd)) {
          dom.style.paddingTop = `${nextBodyStart - top}px`;
          break;
        }
      }
    }
    // After dead-zone padding, recheck if content now needs more (or fewer) pages
    const needed = measurePages();
    if (needed !== numPages) setNumPages(needed);
  }, [elements, numPages]);

  // Compute (MORE)/(CONT'D) markers: detect dialogue crossing page boundaries
  useEffect(() => {
    if (!contentRef.current || numPages <= 1) { setPageBreakMarkers([]); return; }
    const markers = [];
    for (let p = 0; p < numPages - 1; p++) {
      const breakY = (p + 1) * PAGE_HEIGHT + p * PAGE_GAP;
      // Find the last character name before this break point
      let lastCharName = null;
      let dialogueCrossesBreak = false;
      for (const el of elements) {
        const dom = document.getElementById(`script-el-${el.id}`);
        if (!dom) continue;
        const top = dom.offsetTop;
        const bottom = top + dom.offsetHeight;
        if (el.type === "character") lastCharName = stripHtml(el.text);
        if (el.type !== "character" && el.type !== "dialogue" && el.type !== "parenthetical") {
          if (top > breakY) break;
          lastCharName = null;
        }
        // Dialogue block crosses page break
        if ((el.type === "dialogue" || el.type === "parenthetical") && lastCharName && top < breakY && bottom > breakY) {
          dialogueCrossesBreak = true;
          break;
        }
        if (top > breakY) break;
      }
      if (dialogueCrossesBreak && lastCharName) {
        markers.push({ pageIndex: p, characterName: lastCharName });
      }
    }
    setPageBreakMarkers(markers);
  }, [elements, numPages]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Notifications
  const showNotification = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

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

  // File operations
  const handleNew = () => {
    setElements([{ id: uid(), type: "scene-heading", text: "" }]);
    setActiveElId(null);
    setScriptTitle("untitled_screenplay");
    setTitlePage(DEFAULT_TITLE_PAGE);
    setMessages([]);
    showNotification("New script created");
  };

  const handleImport = () => fileInputRef.current?.click();

  const processFile = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    const validExts = [".fountain", ".fdx", ".txt"];
    if (!validExts.some((ext) => name.endsWith(ext))) {
      showNotification("Unsupported format — use .fountain, .fdx, or .txt");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      if (name.endsWith(".fdx")) {
        setElements(parseFDX(text, DEFAULT_SCRIPT.elements));
      } else {
        setElements(parseFountain(text, DEFAULT_SCRIPT.elements));
      }
      setScriptTitle(file.name.replace(/\.(fountain|fdx|txt)$/, ""));
      showNotification(`Imported ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
    e.target.value = "";
  };

  // Drag & drop handlers
  const dragCounter = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length > 0) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleExportFountain = () => {
    const content = elementsToFountain(elements, scriptTitle, titlePage);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scriptTitle}.fountain`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Exported .fountain file");
  };

  const handleExportFDX = () => {
    const content = elementsToFDX(elements, scriptTitle, titlePage);
    const blob = new Blob([content], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scriptTitle}.fdx`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Exported .fdx file (Final Draft)");
  };

  const handleExportPDF = () => {
    exportPDF(elements, titlePage, scriptTitle);
    showNotification("Exported PDF");
  };

  // AI Chat
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

  // Click outside to close file menu
  useEffect(() => {
    const handler = (e) => {
      if (fileMenuOpen) setFileMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [fileMenuOpen]);

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{ background: "#080808", color: "#e8e8e8", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&family=Courier+Prime&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes rotateSpark { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes ringPulse { 0% { box-shadow: 0 0 4px #c43e3e, 0 0 8px rgba(196,62,62,0.4); } 50% { box-shadow: 0 0 8px #c43e3e, 0 0 16px rgba(196,62,62,0.6); } 100% { box-shadow: 0 0 4px #c43e3e, 0 0 8px rgba(196,62,62,0.4); } }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #aaa; pointer-events: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222222; border-radius: 3px; }
        ::selection { background: rgba(196,62,62,0.25); }
      `}</style>

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
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2" style={{ animation: "slideIn 0.2s ease", background: "#111111", border: "1px solid #222222", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#e8e8e8", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
          <span style={{ color: "#c43e3e", marginRight: 6 }}>✓</span> {notification}
        </div>
      )}

      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="flex flex-col items-center gap-4" style={{ animation: "fadeUp 0.2s ease" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, border: "2px dashed #c43e3e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c43e3e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#e8e8e8" }}>
              Drop your screenplay here
            </div>
            <div style={{ fontSize: 13, color: "#888888" }}>
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
      <div className="flex items-center flex-shrink-0" style={{ height: 48, background: "linear-gradient(90deg, #0a0a0a, #101010, #0a0a0a)", borderBottom: "1px solid #222222", padding: "0 16px", gap: 16 }}>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 17, letterSpacing: "0.02em",
          backgroundImage: "linear-gradient(90deg, #ffffff, #c43e3e, #ffffff, #c43e3e)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "shimmer 4s linear infinite",
        }}>
          Script<span style={{ fontStyle: "italic" }}>Mind</span>
        </div>
        <div style={{ width: 1, height: 20, background: "#222222" }} />
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#888888" }}>
          {scriptTitle}.fdx
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFileMenuOpen(!fileMenuOpen)}
              className="flex items-center gap-1"
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid #222222", background: "transparent", color: "#888888", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
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
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid #222222", background: "transparent", color: "#888888", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}
          >
            <DownloadIcon /> Export PDF
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 220, background: "linear-gradient(180deg, #0a0a0a, #0e0e0e, #0a0a0a)", borderRight: "1px solid #222222" }}>
          <div style={{ padding: "12px 14px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555555", marginBottom: 8 }}>
              Scenes
            </div>
            <div className="flex flex-col gap-0.5" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
              {scenes.map((scene, i) => {
                const isActive = scene.id === activeElId || getCurrentSceneIndex(elements, activeElId) === i + 1;
                const color = isActive ? "#c43e3e" : "#555555";
                return (
                  <div
                    key={scene.id}
                    onClick={() => jumpToScene(scene.id)}
                    className="flex items-center gap-2 cursor-pointer"
                    style={{
                      padding: "7px 10px", borderRadius: 4,
                      background: isActive ? "rgba(196,62,62,0.15)" : "transparent",
                      borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
                      boxShadow: isActive ? `inset 3px 0 8px -4px ${color}` : "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#111111"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, minWidth: 18, height: 18,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "50%", backgroundColor: isActive ? "rgba(196,62,62,0.13)" : "rgba(85,85,85,0.13)", color: color, fontWeight: 600,
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
              style={{ fontSize: 11, color: "#555555", background: "transparent", border: "1px dashed #222222", borderRadius: 4, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#888888"; e.currentTarget.style.borderColor = "#888888"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#555555"; e.currentTarget.style.borderColor = "#222222"; }}
            >
              <PlusIcon /> Add Scene
            </button>
          </div>

          <div className="mt-auto" style={{ padding: 12, borderTop: "1px solid #222222" }}>
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

        {/* ── SCREENPLAY EDITOR ── */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ background: "#0d0d0d" }}>
          {/* Toolbar */}
          <div className="flex items-center flex-shrink-0" style={{ height: 38, background: "#0a0a0a", borderBottom: "1px solid #222222", padding: "0 16px", gap: 4 }}>
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
            <div style={{ width: 1, height: 18, background: "#222222", margin: "0 4px" }} />
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
          <div ref={editorScrollRef} className="flex-1 overflow-y-auto flex flex-col items-center" style={{ padding: "32px 24px", background: "radial-gradient(ellipse at center, #120a0a 0%, #0d0d0d 60%)" }}>
            {/* Visual Title Page */}
            <div
              onClick={() => setShowTitlePageEditor(true)}
              style={{
                width: 680, height: PAGE_HEIGHT, marginBottom: PAGE_GAP, borderRadius: 2, cursor: "pointer",
                background: "#ffffff", position: "relative", flexShrink: 0,
                boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(196,62,62,0.15)",
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                fontFamily: "'Courier Prime', 'Courier New', monospace", color: "#111",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(196,62,62,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(196,62,62,0.15)"; }}
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
                      // Content flows continuously; clip rects must account for the gap
                      // accumulated from page backgrounds being spaced with PAGE_GAP
                      const pageTop = i * (PAGE_HEIGHT + PAGE_GAP);
                      const yStart = pageTop + (i === 0 ? 0 : HEADER_HEIGHT);
                      const height = i === 0 ? PAGE_HEIGHT - FOOTER_HEIGHT : PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;
                      return <rect key={i} x="0" y={yStart} width="680" height={height} rx="2" />;
                    })}
                  </clipPath>
                </defs>
              </svg>
              {/* White page backgrounds with shadow (behind content — full page area) */}
              {Array.from({ length: numPages }, (_, i) => (
                <div key={`page-${i}`} style={{
                  position: "absolute",
                  top: i * (PAGE_HEIGHT + PAGE_GAP),
                  left: 0, width: 680, height: PAGE_HEIGHT,
                  borderRadius: 2,
                  background: "#ffffff",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(196,62,62,0.15), 0 0 120px rgba(196,62,62,0.05)",
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
                  color: "#111111",
                  position: "relative",
                  clipPath: "url(#page-clip)",
                }}
              >
                {(() => {
                  const rendered = [];
                  const isDialogueGroupEl = (t) => t === "character" || t === "dialogue" || t === "parenthetical";

                  // Collect a dialogue group starting at index i (character + its dialogue/parenthetical children)
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
                          background: "#1a1a1a", border: "1px solid #333", borderRadius: 4,
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
                                background: si === acIndex ? "rgba(196,62,62,0.25)" : "transparent",
                                color: si === acIndex ? "#e8e8e8" : "#aaa",
                                borderLeft: si === acIndex ? "2px solid #c43e3e" : "2px solid transparent",
                              }}
                            >
                              {s}
                            </div>
                          ))}
                          <div style={{ padding: "4px 12px", fontSize: 10, color: "#555", borderTop: "1px solid #222" }}>
                            ↑↓ navigate · Tab/Enter accept · Esc dismiss
                          </div>
                        </div>
                      )}
                    </div>
                  );

                  let i = 0;
                  while (i < elements.length) {
                    const el = elements[i];
                    // Check if this character starts a dual dialogue pair:
                    // This character is NOT dual, but the next character block IS dual
                    if (el.type === "character" && !el.dual) {
                      const leftGroup = collectGroup(i);
                      const nextIdx = leftGroup[leftGroup.length - 1] + 1;
                      if (nextIdx < elements.length && elements[nextIdx].type === "character" && elements[nextIdx].dual) {
                        const rightGroup = collectGroup(nextIdx);
                        // Render side-by-side
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
              {/* Page headers & footers — overlaid on top of content */}
              {Array.from({ length: numPages }, (_, i) => (
                <div key={`page-hf-${i}`} style={{ position: "absolute", top: i * (PAGE_HEIGHT + PAGE_GAP), left: 0, width: 680, height: PAGE_HEIGHT, pointerEvents: "none", zIndex: 2 }}>
                  {/* Header area — page number (pages 2+) */}
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
                  {/* Footer area — (MORE) marker when dialogue continues to next page */}
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

        {/* ── AI PANEL ── */}
        <div className="flex flex-col flex-shrink-0" style={{ width: 360, background: "linear-gradient(180deg, #0a0a0a, #0e0e0e, #0a0a0a)", borderLeft: "1px solid #222222" }}>
          {/* Header */}
          <div className="flex items-center" style={{ height: 48, borderBottom: "1px solid #222222", padding: "0 16px", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #d45555, #c43e3e)", animation: "ringPulse 2s ease-in-out infinite" }} />
            <div style={{
              fontSize: 13, fontWeight: 500,
              backgroundImage: "linear-gradient(90deg, #e8e8e8, #c43e3e, #e8e8e8, #c43e3e)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 6s linear infinite",
            }}>AI Collaborator</div>
            <div className="ml-auto" style={{ fontSize: 11, padding: "3px 10px", borderRadius: 3, background: "rgba(255,255,255,0.1)", color: "#e8e8e8" }}>
              Chat
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-3.5" style={{ padding: 16 }}>
            {/* Context card */}
            <div style={{ background: "rgba(196,62,62,0.08)", border: "1px solid rgba(196,62,62,0.2)", borderRadius: 6, padding: "10px 12px", fontSize: 11.5, color: "#888888", lineHeight: 1.5 }}>
              <strong style={{ color: "#c43e3e", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
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
                <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: "rgba(196,62,62,0.2)", color: "#c43e3e", fontSize: 11, fontWeight: 600, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>S</div>
                <div className="flex-1">
                  <div style={{ fontSize: 10, color: "#555555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>ScriptMind</div>
                  <div style={{ fontSize: 12.5, background: "#111111", border: "1px solid #222222", borderRadius: 6, padding: "10px 12px", color: "#c43e3e" }}>
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
          <div style={{ padding: 12, borderTop: "1px solid #222222" }}>
            <div className="flex gap-1.5" style={{ marginBottom: 8 }}>
              <button
                onClick={handleRewriteScene}
                disabled={isStreaming}
                className="flex items-center gap-1"
                style={{ fontSize: 11, padding: "4px 9px", borderRadius: 3, border: "1px solid #222222", background: "transparent", color: "#888888", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: isStreaming ? 0.5 : 1, transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(196,62,62,0.2), rgba(255,255,255,0.15))"; e.currentTarget.style.color = "#e8e8e8"; e.currentTarget.style.borderColor = "rgba(196,62,62,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; e.currentTarget.style.borderColor = "#222222"; }}
              >
                <SparkleIcon /> Rewrite scene
              </button>
              <button
                onClick={handleSuggestNext}
                disabled={isStreaming}
                className="flex items-center gap-1"
                style={{ fontSize: 11, padding: "4px 9px", borderRadius: 3, border: "1px solid #222222", background: "transparent", color: "#888888", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: isStreaming ? 0.5 : 1, transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(196,62,62,0.2), rgba(255,255,255,0.15))"; e.currentTarget.style.color = "#e8e8e8"; e.currentTarget.style.borderColor = "rgba(196,62,62,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; e.currentTarget.style.borderColor = "#222222"; }}
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
                  flex: 1, background: "#111111", border: "1px solid #222222",
                  borderRadius: 6, padding: "9px 12px", fontSize: 12.5,
                  color: "#e8e8e8", fontFamily: "inherit", resize: "none",
                  outline: "none", lineHeight: 1.5,
                }}
                onFocus={(e) => { e.target.style.borderColor = "#c43e3e"; }}
                onBlur={(e) => { e.target.style.borderColor = "#222222"; }}
              />
              <button
                onClick={() => sendMessage(chatInput)}
                disabled={isStreaming || !chatInput.trim()}
                style={{
                  width: 34, height: 34, borderRadius: 6,
                  backgroundImage: chatInput.trim() ? "linear-gradient(135deg, #c43e3e, #d45555, #c43e3e)" : "none",
                  backgroundColor: chatInput.trim() ? "transparent" : "#222222",
                  backgroundSize: "200% 200%",
                  animation: chatInput.trim() ? "gradientShift 3s ease infinite" : "none",
                  border: "none", cursor: chatInput.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", flexShrink: 0, transition: "all 0.15s",
                  boxShadow: chatInput.trim() ? "0 2px 12px rgba(196,62,62,0.4)" : "none",
                }}
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className="flex items-center flex-shrink-0" style={{ height: 24, background: "linear-gradient(90deg, #0a0a0a, #101010, #0a0a0a)", borderTop: "1px solid #222222", padding: "0 16px", gap: 16, fontSize: 10.5, color: "#555555", fontFamily: "'IBM Plex Mono', monospace" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#c43e3e" }} />
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
