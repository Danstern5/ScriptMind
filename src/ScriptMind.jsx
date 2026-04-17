import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { exportPDF } from "./utils/pdfExport";
import { uid } from "./utils/ids";
import { stripHtml } from "./utils/html";
import { getScenes, getWordCount, getPageCount, getSmartSuggestions, getCurrentSceneIndex } from "./utils/screenplay";
import { getNextType, cycleType, autoFormatText, TAB_CYCLE } from "./utils/elementTypes";
import { elementsToFDX, elementsToFountain } from "./utils/export";
import { parseFountain, parseFDX } from "./utils/import";
import { SendIcon, PlusIcon, FileIcon, DownloadIcon, SparkleIcon, ChevronIcon } from "./components/Icons";
import useAIChat from "./hooks/useAIChat";
import ContextMenu from "./components/ContextMenu";
import ScriptElement from "./components/ScriptElement";
import AIMessage from "./components/AIMessage";
import TitlePageEditor from "./components/TitlePageEditor";
import RenameCharacterModal from "./components/RenameCharacterModal";
import FileMenu from "./components/FileMenu";
import ScenarioCard from "./components/ScenarioCard";
import SelectionToolbar from "./components/SelectionToolbar";
import ScriptBible from "./components/ScriptBible";

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

// Placeholder scenario content for Alternative Scene Analysis
const PLACEHOLDER_SCENARIOS = [
  {
    title: "The Confession",
    description: "Marcus finally says what he's been holding back the entire act. The confrontation becomes an admission, and the power dynamic in the room shifts completely.",
    impact: {
      tone: "The scene moves from hostile to devastatingly quiet — the silence after the confession lands harder than any argument.",
      character: "Marcus loses his armor here; whatever happens next, the audience now knows who he really is.",
      plot: "This choice accelerates the second act — there's no going back to the status quo after this moment.",
    },
    preview: `INT. INTERROGATION ROOM - NIGHT\n\nMarcus sets the folder down. A long silence.\n\nMARCUS\nI was there.\n\nDETECTIVE CHEN\nExcuse me?\n\nMARCUS\n(quietly)\nThe night it happened. I was\nthere the whole time.\n\nDetective Chen leans forward.\n\nDETECTIVE CHEN\nThen why didn't you—\n\nMARCUS\nBecause I was afraid.`,
    previewOpen: false,
    impactOpen: false,
  },
  {
    title: "The Deflection",
    description: "Marcus almost says it — but doesn't. He redirects, lies convincingly, and leaves the scene with the secret intact. The tension doesn't resolve; it calcifies.",
    impact: {
      tone: "Unease replaces confrontation — the audience knows more than the other characters, which creates a slow dread.",
      character: "Marcus becomes more isolated by his choice; the gap between him and everyone else quietly widens.",
      plot: "The secret survives into Act 3, raising the stakes of the eventual reveal.",
    },
    preview: `INT. INTERROGATION ROOM - NIGHT\n\nMarcus meets her eyes without flinching.\n\nMARCUS\nI don't know what you're\nlooking for, but it isn't me.\n\nDETECTIVE CHEN\nWe have a witness.\n\nMARCUS\nThen talk to your witness.\n\nHe stands. Adjusts his jacket.\n\nMARCUS (CONT'D)\nAre we done here?\n\nDetective Chen watches him go.\nShe knows he's lying.`,
    previewOpen: false,
    impactOpen: false,
  },
  {
    title: "The Rupture",
    description: "The scene escalates beyond what either character intended. Something gets said or done that can't be taken back — not a confession, but a fracture.",
    impact: {
      tone: "Volatile and destabilizing — the kind of scene the audience will be talking about afterward.",
      character: "Both characters are changed, not just Marcus; the relationship itself becomes a casualty.",
      plot: "The rupture creates a new problem that has to be dealt with before the story's central conflict can resolve.",
    },
    preview: `INT. INTERROGATION ROOM - NIGHT\n\nMARCUS\nYou want the truth? Fine.\n\nHe grabs the folder. Throws it.\n\nMARCUS (CONT'D)\nYou built this case on nothing.\nYou dragged my family into this—\n\nDETECTIVE CHEN\nSit down, Marcus.\n\nMARCUS\nI'm done sitting down.\n\nThe door. He reaches for it.\n\nDETECTIVE CHEN\nIf you walk out that door,\nI can't help you anymore.\n\nHe stops. Doesn't turn around.`,
    previewOpen: false,
    impactOpen: false,
  },
];

const DEFAULT_SCRIPT_BIBLE = {
  logline: { writer: "", aiReading: "" },
  genre: { writer: "", aiReading: "" },
  themes: { writer: "", aiReading: "" },
  synopsis: { writer: "", aiReading: "" },
  characters: {
    "MARCUS": { role: "Protagonist", want: "", need: "", wound: "", voice: "", aiReading: "" },
    "DETECTIVE CHEN": { role: "Antagonist / Foil", want: "", need: "", wound: "", voice: "", aiReading: "" },
  },
  worldFacts: [
    "Set in present-day Detroit, winter",
    "Marcus has been sober for 4 years",
    "The Hargrove case was officially closed in 2009",
    "Elena does not know Marcus was involved",
  ],
  actBreakdown: {
    act1: { writer: "", aiReading: "" },
    act2: { writer: "", aiReading: "" },
    act3: { writer: "", aiReading: "" },
  },
};

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
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [aiPanelTab, setAiPanelTab] = useState("chat"); // "bible" | "explore" | "chat"
  const [showScriptBible, setShowScriptBible] = useState(false);
  const [scriptBible, setScriptBible] = useState(() => {
    try {
      const saved = localStorage.getItem("scriptmind_bible");
      return saved ? JSON.parse(saved) : DEFAULT_SCRIPT_BIBLE;
    } catch { return DEFAULT_SCRIPT_BIBLE; }
  });
  const [scenarios, setScenarios] = useState([]);
  const [anchoredScenario, setAnchoredScenario] = useState(null);
  const [isExploring, setIsExploring] = useState(false);
  const [toolbarSelection, setToolbarSelection] = useState(null); // { text, rect }

  const [acIndex, setAcIndex] = useState(-1); // autocomplete selected index

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

  const {
    messages, setMessages,
    chatInput, setChatInput,
    isStreaming,
    chatEndRef,
    sendMessage,
    handleRewriteScene,
    handleSuggestNext,
  } = useAIChat(elements, currentScene, activeElId);

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
        localStorage.setItem("scriptmind_bible", JSON.stringify(scriptBible));
        setLastSaved("just now");
      } catch { /* storage full — silent fail */ }
    }, 500); // debounce 500ms
    return () => clearTimeout(timeout);
  }, [elements, scriptTitle, titlePage, scriptBible]);

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

  // Notifications
  const showNotification = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  // Selection toolbar action handler
  const handleSelectionAction = useCallback((actionType, selectedText) => {
    setToolbarSelection(null);
    setAiPanelTab("chat");

    const trimmed = selectedText.trim();

    const promptMap = {
      alternatives: "Give me 2–3 alternative phrasings for this line or section.",
      consistency: "Check this against the rest of the script for logical consistency and character voice.",
      discuss: null,
    };

    const placeholderMap = {
      alternatives: `Here are some alternatives for that line:\n\n**1.** "You never actually believed that, did you."\n**2.** "Say it again. I want to hear you say it like you mean it."\n**3.** "That's the first honest thing you've said all night."\n\nEach lands differently — the first is resigned, the second confrontational, the third gives Marcus the upper hand. Write whichever fits where you're taking him.`,
      consistency: `A couple of things worth flagging:\n\n**Character voice:** This line feels slightly off for Marcus. Earlier in the script he tends to speak in short, clipped sentences when he's defensive — but this reads more expansive and explanatory. Could be intentional character development, but worth asking whether he'd really say it this way here.\n\n**Logic:** No continuity issues found with established facts in the script. The reference to the apartment checks out against Scene 3.`,
      discuss: `Good pull. A few things this moment is doing:\n\nIt's carrying a lot of weight for a single exchange — the subtext here is doing more work than the dialogue. That's intentional and it's working, but it means if anything feels slightly off, the whole beat will feel unstable.\n\nWhat specifically do you want to talk through — the pacing, the character logic, or something about how it fits into the larger scene? I'll follow your lead.`,
    };

    const userMsg = {
      id: uid(),
      role: "user",
      quote: trimmed,
      text: promptMap[actionType],
    };

    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const aiMsg = {
        id: uid(),
        role: "assistant",
        text: placeholderMap[actionType],
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 400 + Math.random() * 200);
  }, [setMessages]);

  // Mouseup listener — detect selection within editor
  useEffect(() => {
    const handler = () => {
      // Small delay to let selection finalize
      setTimeout(() => {
        if (!editorScrollRef.current) return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          setToolbarSelection(null);
          return;
        }
        try {
          const range = sel.getRangeAt(0);
          if (!editorScrollRef.current.contains(range.commonAncestorContainer)) {
            setToolbarSelection(null);
            return;
          }
          const rect = range.getBoundingClientRect();
          setToolbarSelection({ text: sel.toString(), rect });
        } catch {
          setToolbarSelection(null);
        }
      }, 10);
    };

    const clearHandler = (e) => {
      // Don't clear if clicking the toolbar itself
      if (e.target.closest("[data-selection-toolbar]")) return;
      // Clear if clicking outside the editor
      if (editorScrollRef.current && !editorScrollRef.current.contains(e.target)) {
        setToolbarSelection(null);
      }
    };

    const escHandler = (e) => {
      if (e.key === "Escape") {
        setToolbarSelection(null);
        setShowScriptBible(false);
      }
    };

    document.addEventListener("mouseup", handler);
    document.addEventListener("mousedown", clearHandler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("mousedown", clearHandler);
      document.removeEventListener("keydown", escHandler);
    };
  }, []);

  // Alternative Scene Analysis
  const handleExplore = () => {
    setIsExploring(true);
    setTimeout(() => {
      setScenarios(PLACEHOLDER_SCENARIOS.map(s => ({ ...s, impactOpen: false, previewOpen: false })));
      if (isThinkingMode) setAiPanelTab("explore");
      setIsExploring(false);
    }, 600);
  };

  const handleDiscuss = (idx) => {
    setAnchoredScenario(idx);
    if (!isThinkingMode) setAiPanelTab("chat");
  };

  const toggleScenarioImpact = (idx) => {
    setScenarios(prev => prev.map((s, i) => i === idx ? { ...s, impactOpen: !s.impactOpen } : s));
  };

  const toggleScenarioPreview = (idx) => {
    setScenarios(prev => prev.map((s, i) => i === idx ? { ...s, previewOpen: !s.previewOpen } : s));
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
      style={{ background: "#f5f5f5", color: "#1a1a1a", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}
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
        @keyframes ringPulse { 0% { box-shadow: 0 0 4px #4ade80, 0 0 8px rgba(74,222,128,0.3); } 50% { box-shadow: 0 0 8px #4ade80, 0 0 16px rgba(74,222,128,0.5); } 100% { box-shadow: 0 0 4px #4ade80, 0 0 8px rgba(74,222,128,0.3); } }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #aaa; pointer-events: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cccccc; border-radius: 3px; }
        ::selection { background: rgba(0,0,0,0.1); }
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
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2" style={{ animation: "slideIn 0.2s ease", background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#1a1a1a", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
          <span style={{ color: "#4ade80", marginRight: 6 }}>✓</span> {notification}
        </div>
      )}

      {/* Selection Toolbar */}
      <SelectionToolbar selection={toolbarSelection} onAction={handleSelectionAction} />

      {/* Script Bible slide-over (Writing Mode) */}
      {showScriptBible && !isThinkingMode && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowScriptBible(false)}
            style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.15)" }}
          />
          {/* Panel */}
          <div style={{
            position: "fixed", top: 48, left: 220, bottom: 24,
            width: 560, zIndex: 91,
            background: "#ffffff", borderRight: "1px solid #e0e0e0",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
            display: "flex", flexDirection: "column",
            animation: "slideInLeft 0.2s ease",
          }}>
            <style>{`@keyframes slideInLeft { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }`}</style>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e0e0e0", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>Script Bible</div>
              <button
                onClick={() => setShowScriptBible(false)}
                style={{ background: "none", border: "none", color: "#aaaaaa", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#666666"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#aaaaaa"; }}
              >×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <ScriptBible bible={scriptBible} onChange={setScriptBible} mode="writing" />
            </div>
          </div>
        </>
      )}

      {/* Drag & drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="flex flex-col items-center gap-4" style={{ animation: "fadeUp 0.2s ease" }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, border: "2px dashed #444444", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="flex items-center flex-shrink-0" style={{ height: 48, background: "#f0f0f0", borderBottom: "1px solid #e0e0e0", padding: "0 16px", gap: 16 }}>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 17, letterSpacing: "0.02em",
          color: "#1a1a1a",
        }}>
          Script<span style={{ fontStyle: "italic" }}>Mind</span>
        </div>
        <div style={{ width: 1, height: 20, background: "#e0e0e0" }} />
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#888888" }}>
          {scriptTitle}.fdx
        </div>

        {/* Mode toggle — centered */}
        <div className="flex items-center" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", gap: 2 }}>
          {["Writing Mode", "Thinking Mode"].map((label) => {
            const active = label === "Writing Mode" ? !isThinkingMode : isThinkingMode;
            return (
              <button
                key={label}
                onClick={() => setIsThinkingMode(label === "Thinking Mode")}
                style={{
                  fontSize: 11.5, padding: "4px 14px", borderRadius: 4,
                  fontFamily: "inherit", cursor: "pointer",
                  background: active ? "rgba(0,0,0,0.07)" : "transparent",
                  border: active ? "1px solid #cccccc" : "1px solid transparent",
                  color: active ? "#1a1a1a" : "#aaaaaa",
                  fontWeight: active ? 500 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFileMenuOpen(!fileMenuOpen)}
              className="flex items-center gap-1"
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid #d8d8d8", background: "transparent", color: "#666666", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
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
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 4, border: "1px solid #d8d8d8", background: "transparent", color: "#666666", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}
          >
            <DownloadIcon /> Export PDF
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{
          width: isThinkingMode ? 40 : 220,
          background: "#ebebeb",
          borderRight: "1px solid #e0e0e0",
          transition: "width 0.35s ease",
        }}>
          {isThinkingMode ? (
            /* Slim strip — scene number circles only */
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
                      color: isActive ? "#4ade80" : "#aaaaaa",
                      fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
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
            <>
              <div style={{ padding: "12px 14px 8px" }}>
                <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaaaaa", marginBottom: 8 }}>
                  Scenes
                </div>
                <div className="flex flex-col gap-0.5" style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                  {scenes.map((scene, i) => {
                    const isActive = scene.id === activeElId || getCurrentSceneIndex(elements, activeElId) === i + 1;
                    const color = isActive ? "#4ade80" : "#555555";
                    return (
                      <div
                        key={scene.id}
                        onClick={() => jumpToScene(scene.id)}
                        className="flex items-center gap-2 cursor-pointer"
                        style={{
                          padding: "7px 10px", borderRadius: 4,
                          background: isActive ? "rgba(74,222,128,0.06)" : "transparent",
                          borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
                          boxShadow: isActive ? `inset 3px 0 8px -4px rgba(74,222,128,0.3)` : "none",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#eeeeee"; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, minWidth: 18, height: 18,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "50%", backgroundColor: isActive ? "rgba(74,222,128,0.1)" : "rgba(0,0,0,0.07)", color: color, fontWeight: 600,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 12, color: isActive ? "#1a1a1a" : "#888888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                  style={{ fontSize: 11, color: "#aaaaaa", background: "transparent", border: "1px dashed #cccccc", borderRadius: 4, padding: "5px 8px", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#666666"; e.currentTarget.style.borderColor = "#999999"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#aaaaaa"; e.currentTarget.style.borderColor = "#cccccc"; }}
                >
                  <PlusIcon /> Add Scene
                </button>
              </div>

              <div className="mt-auto" style={{ borderTop: "1px solid #e0e0e0" }}>
                {/* Script Bible button */}
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #e0e0e0" }}>
                  <button
                    onClick={() => setShowScriptBible(true)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 6,
                      fontSize: 11, color: "#aaaaaa", background: "transparent",
                      border: "1px solid #e0e0e0", borderRadius: 4, padding: "5px 8px",
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#4ade80"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#aaaaaa"; e.currentTarget.style.borderColor = "#e0e0e0"; }}
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
                    <div key={label} className="flex justify-between" style={{ fontSize: 11, color: "#aaaaaa", marginBottom: 2 }}>
                      <span>{label}</span>
                      <span style={{ color: "#666666" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── SCREENPLAY EDITOR ── */}
        <div className="flex flex-col overflow-hidden" style={{
          background: "#f0f0f0",
          flex: isThinkingMode ? "0 0 0px" : "1 1 0",
          opacity: isThinkingMode ? 0 : 1,
          pointerEvents: isThinkingMode ? "none" : "auto",
          transition: "flex 0.35s ease, opacity 0.25s ease",
          minWidth: 0,
        }}>
          {/* Toolbar */}
          <div className="flex items-center flex-shrink-0" style={{ height: 38, background: "#ffffff", borderBottom: "1px solid #e0e0e0", padding: "0 16px", gap: 4 }}>
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
                    background: isActive ? "rgba(74,222,128,0.06)" : "transparent",
                    border: isActive ? "1px solid #4ade80" : "1px solid transparent",
                    color: isActive ? "#1a1a1a" : "#888888",
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
            <div style={{ width: 1, height: 18, background: "#e0e0e0", margin: "0 4px" }} />
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
                  color: "#666666", cursor: "pointer",
                  fontFamily: "'Courier Prime', 'Courier New', monospace",
                  transition: "all 0.1s", ...fmt.style,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#1a1a1a"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#666666"; }}
                title={`${fmt.cmd.charAt(0).toUpperCase() + fmt.cmd.slice(1)} (⌘${fmt.label})`}
              >
                {fmt.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#aaaaaa" }}>
              Page {currentPage} of {numPages} · Scene {currentScene}
            </div>
          </div>

          {/* Editor — continuous flow with page gaps */}
          <div ref={editorScrollRef} className="flex-1 overflow-y-auto flex flex-col items-center" style={{ padding: "32px 24px", background: "radial-gradient(ellipse at center, #d0d0d0 0%, #dadada 60%)" }}>
            {/* Visual Title Page */}
            <div
              onClick={() => setShowTitlePageEditor(true)}
              style={{
                width: 680, height: PAGE_HEIGHT, marginBottom: PAGE_GAP, borderRadius: 2, cursor: "pointer",
                background: "#ffffff", position: "relative", flexShrink: 0,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                fontFamily: "'Courier Prime', 'Courier New', monospace", color: "#111",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 32px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)"; }}
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
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
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
                  color: "#1a1a1a",
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
                          background: "#ffffff", border: "1px solid #d8d8d8", borderRadius: 4,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 220, maxWidth: 400,
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
                                background: si === acIndex ? "rgba(0,0,0,0.05)" : "transparent",
                                color: si === acIndex ? "#1a1a1a" : "#888888",
                                borderLeft: si === acIndex ? "2px solid #4ade80" : "2px solid transparent",
                              }}
                            >
                              {s}
                            </div>
                          ))}
                          <div style={{ padding: "4px 12px", fontSize: 10, color: "#aaaaaa", borderTop: "1px solid #e8e8e8" }}>
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
        <div className="flex flex-col flex-shrink-0" style={{
          width: isThinkingMode ? "100%" : 360,
          background: "#f8f8f8",
          borderLeft: "1px solid #e0e0e0",
          transition: "width 0.35s ease",
          minWidth: 0,
          overflow: "hidden",
        }}>
          {/* Header — title + tabs */}
          <div className="flex items-center" style={{ height: 48, borderBottom: "1px solid #e0e0e0", padding: "0 16px", gap: 10, flexShrink: 0 }}>
            {!isThinkingMode && <>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #86efac, #4ade80)", animation: "ringPulse 2s ease-in-out infinite", flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>AI Collaborator</div>
            </>}
            <div className="flex items-center gap-1" style={{ marginLeft: isThinkingMode ? 0 : "auto" }}>
              {(isThinkingMode ? ["bible", "explore", "chat"] : ["chat"]).map((tab) => {
                const isActive = aiPanelTab === tab;
                const tabLabels = { bible: "Script Bible", explore: "Explore", chat: "Chat" };
                const activeColor = tab === "explore" ? "#4ade80" : tab === "bible" ? "#4ade80" : "#444444";
                return (
                  <button
                    key={tab}
                    onClick={() => setAiPanelTab(tab)}
                    style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 3,
                      background: isActive ? "rgba(0,0,0,0.07)" : "transparent",
                      border: "1px solid transparent",
                      color: isActive ? activeColor : "#aaaaaa",
                      fontWeight: isActive ? 500 : 400,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    {tabLabels[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── THINKING MODE: cards on top, chat always below ── */}
          {isThinkingMode ? (
            <div className="flex flex-col flex-1 overflow-hidden">

              {/* Script Bible tab — full panel */}
              {aiPanelTab === "bible" && (
                <div className="flex-1 overflow-y-auto">
                  <ScriptBible bible={scriptBible} onChange={setScriptBible} mode="thinking" />
                </div>
              )}

              {/* Cards — only when Explore tab active */}
              {aiPanelTab === "explore" && (
                <div style={{ padding: 16, borderBottom: "1px solid #e0e0e0", flexShrink: 0, overflowX: "auto" }}>
                  {scenarios.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#aaaaaa", fontSize: 12, padding: "20px 0" }}>
                      Click "✦ Alternative Scene Analysis" to explore directions for this scene.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(280px, 1fr))", gap: 12 }}>
                      {scenarios.map((s, i) => (
                        <ScenarioCard
                          key={i} scenario={s} index={i}
                          onDiscuss={() => handleDiscuss(i)}
                          onToggleImpact={() => toggleScenarioImpact(i)}
                          onTogglePreview={() => toggleScenarioPreview(i)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chat messages — visible when not in bible tab */}
              {aiPanelTab !== "bible" && <div className="flex-1 overflow-y-auto flex flex-col gap-3.5" style={{ padding: 16 }}>
                <div style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, padding: "10px 12px", fontSize: 11.5, color: "#666666", lineHeight: 1.5 }}>
                  <strong style={{ color: "#4ade80", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>📍 Current Scene Context</strong>
                  Scene {currentScene} · {stripHtml(scenes[currentScene - 1]?.text || "Start writing")}
                </div>
                {messages.map((msg) => <AIMessage key={msg.id} msg={msg} />)}
                {isStreaming && (
                  <div className="flex gap-2.5" style={{ animation: "fadeUp 0.3s ease" }}>
                    <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: "rgba(0,0,0,0.06)", color: "#666666", fontSize: 11, fontWeight: 600, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>S</div>
                    <div className="flex-1">
                      <div style={{ fontSize: 10, color: "#aaaaaa", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>ScriptMind</div>
                      <div style={{ fontSize: 12.5, background: "#f0f0f0", border: "1px solid #e0e0e0", borderRadius: 6, padding: "10px 12px", color: "#666666" }}>
                        <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>
                        <span style={{ animation: "pulse 1s ease-in-out infinite 0.2s" }}> ●</span>
                        <span style={{ animation: "pulse 1s ease-in-out infinite 0.4s" }}> ●</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>}

              {/* Input — hidden in bible tab */}
              {aiPanelTab !== "bible" && (() => {
                const inputArea = (
                  <div style={{ padding: 12, borderTop: "1px solid #e0e0e0", flexShrink: 0 }}>
                    {anchoredScenario !== null && (
                      <div style={{ marginBottom: 8, padding: "4px 10px", borderRadius: 20, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "#4ade80" }}>↳ Exploring: "{scenarios[anchoredScenario]?.title}"</span>
                        <button onClick={() => setAnchoredScenario(null)} style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 0 0 8px" }}>✕</button>
                      </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                      <button
                        onClick={handleExplore} disabled={isExploring}
                        style={{ fontSize: 11.5, padding: "7px 12px", borderRadius: 4, border: "1px solid rgba(74,222,128,0.3)", background: isExploring ? "rgba(74,222,128,0.05)" : "transparent", color: "#4ade80", cursor: isExploring ? "default" : "pointer", fontFamily: "inherit", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s", opacity: isExploring ? 0.7 : 1 }}
                        onMouseEnter={(e) => { if (!isExploring) e.currentTarget.style.background = "rgba(74,222,128,0.08)"; }}
                        onMouseLeave={(e) => { if (!isExploring) e.currentTarget.style.background = "transparent"; }}
                      >
                        <SparkleIcon /> {isExploring ? "Analyzing…" : "✦ Alternative Scene Analysis"}
                      </button>
                    </div>
                    <div className="flex gap-2 items-end">
                      <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }} placeholder="Ask anything about your script…" rows={2}
                        style={{ flex: 1, background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: 6, padding: "9px 12px", fontSize: 12.5, color: "#1a1a1a", fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.5 }}
                        onFocus={(e) => { e.target.style.borderColor = "#4ade80"; }} onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
                      />
                      <button onClick={() => sendMessage(chatInput)} disabled={isStreaming || !chatInput.trim()}
                        style={{ width: 34, height: 34, borderRadius: 6, backgroundImage: chatInput.trim() ? "linear-gradient(135deg, #16a34a, #4ade80, #16a34a)" : "none", backgroundColor: chatInput.trim() ? "transparent" : "#e8e8e8", backgroundSize: "200% 200%", animation: chatInput.trim() ? "gradientShift 3s ease infinite" : "none", border: "none", cursor: chatInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", color: chatInput.trim() ? "#000" : "#aaaaaa", flexShrink: 0, transition: "all 0.15s", boxShadow: chatInput.trim() ? "0 2px 12px rgba(74,222,128,0.3)" : "none" }}
                      >
                        <SendIcon />
                      </button>
                    </div>
                  </div>
                );
                return inputArea;
              })()}
            </div>
          ) : (
            /* ── WRITING MODE ── */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Chat tab */}
              {aiPanelTab === "chat" && (
                <>
                  <div className="flex-1 overflow-y-auto flex flex-col gap-3.5" style={{ padding: 16 }}>
                    <div style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, padding: "10px 12px", fontSize: 11.5, color: "#666666", lineHeight: 1.5 }}>
                      <strong style={{ color: "#4ade80", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>📍 Current Scene Context</strong>
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
                    {messages.map((msg) => <AIMessage key={msg.id} msg={msg} />)}
                    {isStreaming && (
                      <div className="flex gap-2.5" style={{ animation: "fadeUp 0.3s ease" }}>
                        <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: "rgba(0,0,0,0.06)", color: "#666666", fontSize: 11, fontWeight: 600, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>S</div>
                        <div className="flex-1">
                          <div style={{ fontSize: 10, color: "#aaaaaa", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>ScriptMind</div>
                          <div style={{ fontSize: 12.5, background: "#f0f0f0", border: "1px solid #e0e0e0", borderRadius: 6, padding: "10px 12px", color: "#666666" }}>
                            <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>
                            <span style={{ animation: "pulse 1s ease-in-out infinite 0.2s" }}> ●</span>
                            <span style={{ animation: "pulse 1s ease-in-out infinite 0.4s" }}> ●</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: 12, borderTop: "1px solid #e0e0e0", flexShrink: 0 }}>
                    {anchoredScenario !== null && (
                      <div style={{ marginBottom: 8, padding: "4px 10px", borderRadius: 20, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "#4ade80" }}>↳ Exploring: "{scenarios[anchoredScenario]?.title}"</span>
                        <button onClick={() => setAnchoredScenario(null)} style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 0 0 8px" }}>✕</button>
                      </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                      <button
                        onClick={handleExplore} disabled={isExploring}
                        style={{ fontSize: 11.5, padding: "7px 12px", borderRadius: 4, border: "1px solid rgba(74,222,128,0.3)", background: isExploring ? "rgba(74,222,128,0.05)" : "transparent", color: "#4ade80", cursor: isExploring ? "default" : "pointer", fontFamily: "inherit", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s", opacity: isExploring ? 0.7 : 1 }}
                        onMouseEnter={(e) => { if (!isExploring) e.currentTarget.style.background = "rgba(74,222,128,0.08)"; }}
                        onMouseLeave={(e) => { if (!isExploring) e.currentTarget.style.background = "transparent"; }}
                      >
                        <SparkleIcon /> {isExploring ? "Analyzing…" : "✦ Alternative Scene Analysis"}
                      </button>
                    </div>
                    <div className="flex gap-2 items-end">
                      <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }} placeholder="Ask anything about your script…" rows={2}
                        style={{ flex: 1, background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: 6, padding: "9px 12px", fontSize: 12.5, color: "#1a1a1a", fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.5 }}
                        onFocus={(e) => { e.target.style.borderColor = "#4ade80"; }} onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
                      />
                      <button onClick={() => sendMessage(chatInput)} disabled={isStreaming || !chatInput.trim()}
                        style={{ width: 34, height: 34, borderRadius: 6, backgroundImage: chatInput.trim() ? "linear-gradient(135deg, #16a34a, #4ade80, #16a34a)" : "none", backgroundColor: chatInput.trim() ? "transparent" : "#e8e8e8", backgroundSize: "200% 200%", animation: chatInput.trim() ? "gradientShift 3s ease infinite" : "none", border: "none", cursor: chatInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", color: chatInput.trim() ? "#000" : "#aaaaaa", flexShrink: 0, transition: "all 0.15s", boxShadow: chatInput.trim() ? "0 2px 12px rgba(74,222,128,0.3)" : "none" }}
                      >
                        <SendIcon />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Explore tab — vertical stacked cards */}
              {aiPanelTab === "explore" && (
                <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: 12, gap: 10 }}>
                  {scenarios.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#aaaaaa", fontSize: 12, padding: "40px 16px", lineHeight: 1.6 }}>
                      Click "✦ Alternative Scene Analysis" to explore directions for this scene.
                    </div>
                  ) : (
                    scenarios.map((s, i) => (
                      <ScenarioCard
                        key={i} scenario={s} index={i}
                        onDiscuss={() => handleDiscuss(i)}
                        onToggleImpact={() => toggleScenarioImpact(i)}
                        onTogglePreview={() => toggleScenarioPreview(i)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className="flex items-center flex-shrink-0" style={{ height: 24, background: "#f0f0f0", borderTop: "1px solid #e0e0e0", padding: "0 16px", gap: 16, fontSize: 10.5, color: "#aaaaaa", fontFamily: "'IBM Plex Mono', monospace" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
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
