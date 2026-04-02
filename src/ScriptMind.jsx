import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── Constants ───
const ELEMENT_TYPES = ["scene-heading", "action", "character", "dialogue", "parenthetical", "transition", "shot", "centered"];
const TAB_CYCLE = ["action", "character", "dialogue", "action"];

const DEFAULT_SCRIPT = {
  title: "Untitled Screenplay",
  author: "Writer",
  elements: [
    { id: "el-1", type: "scene-heading", text: "INT. DETECTIVE'S OFFICE — DAY" },
    { id: "el-2", type: "action", text: "A cluttered desk drowns under case files. Coffee rings stain every surface. DETECTIVE COLE (50s, rumpled suit, reading glasses he refuses to wear in public) stares at a corkboard covered in photographs." },
    { id: "el-3", type: "character", text: "DETECTIVE COLE" },
    { id: "el-4", type: "parenthetical", text: "(to himself)" },
    { id: "el-5", type: "dialogue", text: "Something's not right." },
    { id: "el-6", type: "action", text: "He pulls a photograph from the board. Studies it." },
    { id: "el-7", type: "scene-heading", text: "EXT. RAINY STREET — NIGHT" },
    { id: "el-8", type: "action", text: "Rain hammers the pavement. A lone figure moves through the downpour — MORGAN (40s, worn leather jacket, eyes that have seen too much). She walks with purpose, checking over her shoulder every few steps." },
    { id: "el-9", type: "character", text: "MORGAN" },
    { id: "el-10", type: "parenthetical", text: "(into phone)" },
    { id: "el-11", type: "dialogue", text: "I'm coming in. But not through the front." },
    { id: "el-12", type: "action", text: "She hangs up. Ducks into an alley." },
    { id: "el-13", type: "transition", text: "CUT TO:" },
    { id: "el-14", type: "scene-heading", text: "INT. MORGAN'S APARTMENT — NIGHT" },
    { id: "el-15", type: "action", text: "The apartment is sparse. A single lamp cuts through the dark. Morgan sits at the kitchen table, phone face-down in front of her." },
    { id: "el-16", type: "action", text: "A knock at the door. She doesn't move." },
    { id: "el-17", type: "character", text: "MORGAN" },
    { id: "el-18", type: "parenthetical", text: "(without turning)" },
    { id: "el-19", type: "dialogue", text: "It's open." },
    { id: "el-20", type: "action", text: "Detective Cole enters. He surveys the room before finding her." },
    { id: "el-21", type: "character", text: "DETECTIVE COLE" },
    { id: "el-22", type: "dialogue", text: "You weren't at the precinct. Martinez is asking questions." },
    { id: "el-23", type: "character", text: "MORGAN" },
    { id: "el-24", type: "dialogue", text: "Let him ask." },
    { id: "el-25", type: "scene-heading", text: "INT. POLICE PRECINCT — DAY" },
    { id: "el-26", type: "action", text: "The bullpen buzzes with activity. Phones ring. Officers move between desks. MARTINEZ (30s, sharp suit, ambitious) stands at a whiteboard, mapping connections." },
    { id: "el-27", type: "character", text: "MARTINEZ" },
    { id: "el-28", type: "dialogue", text: "She knows more than she's telling us. I can feel it." },
    { id: "el-29", type: "scene-heading", text: "EXT. ROOFTOP — DAWN" },
    { id: "el-30", type: "action", text: "The city sprawls below, still waking. Morgan stands at the edge, wind pulling at her jacket. She holds an envelope — unopened." },
    { id: "el-31", type: "character", text: "MORGAN" },
    { id: "el-32", type: "parenthetical", text: "(quiet)" },
    { id: "el-33", type: "dialogue", text: "You don't get to decide when this ends." },
    { id: "el-34", type: "scene-heading", text: "INT. INTERROGATION ROOM — DAY" },
    { id: "el-35", type: "action", text: "Bare walls. A metal table. Two chairs. Morgan sits on one side, Cole on the other. A file folder between them." },
    { id: "el-36", type: "character", text: "DETECTIVE COLE" },
    { id: "el-37", type: "dialogue", text: "Tell me about the night of the fourteenth." },
    { id: "el-38", type: "character", text: "MORGAN" },
    { id: "el-39", type: "parenthetical", text: "(long beat)" },
    { id: "el-40", type: "dialogue", text: "Which part?" },
  ],
};

const DEFAULT_TITLE_PAGE = {
  title: "Untitled Screenplay",
  credit: "written by",
  author: "Writer",
  source: "",
  draftDate: "",
  contact: "",
};

const INITIAL_MESSAGES = [
  {
    id: "m-1",
    role: "assistant",
    text: "I've read your screenplay. The tension between Morgan and Cole is compelling — her silence carries real weight. A few thoughts:\n\n• The phone buzzing in Scene 3 would be a natural beat — want me to write it in?\n• Cole feels reactive. You might give him one line that shows what *he's* afraid of, not just what he wants from Morgan.\n• The transition from Scene 2 to Scene 3 is strong. The rain to the sparse apartment is a nice tonal shift.",
  },
];

// ─── Utility Functions ───
const uid = () => "el-" + Math.random().toString(36).slice(2, 9);
const msgId = () => "m-" + Math.random().toString(36).slice(2, 9);

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "");
}

function htmlToFountain(html) {
  return html
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<u>(.*?)<\/u>/gi, "_$1_")
    .replace(/<[^>]*>/g, "");
}

function getScenes(elements) {
  const scenes = [];
  elements.forEach((el, idx) => {
    if (el.type === "scene-heading") {
      scenes.push({ index: idx, text: el.text, id: el.id });
    }
  });
  return scenes;
}

function getWordCount(elements) {
  return elements.reduce((sum, el) => sum + stripHtml(el.text).split(/\s+/).filter(Boolean).length, 0);
}

function getPageCount(elements) {
  // Rough: ~250 words per page for screenplay
  return Math.max(1, Math.ceil(getWordCount(elements) / 250));
}

// ─── SmartType Autocomplete ───
const COMMON_TRANSITIONS = ["CUT TO:", "FADE OUT.", "FADE IN:", "SMASH CUT TO:", "MATCH CUT TO:", "JUMP CUT TO:", "DISSOLVE TO:", "TIME CUT:", "FREEZE FRAME"];
const SCENE_PREFIXES = ["INT. ", "EXT. ", "INT./EXT. ", "I/E. "];
const TIMES_OF_DAY = [" — DAY", " — NIGHT", " — DAWN", " — DUSK", " — MORNING", " — AFTERNOON", " — EVENING", " — LATER", " — CONTINUOUS", " — MOMENTS LATER"];

function getSmartSuggestions(elements, currentEl) {
  if (!currentEl) return [];
  const query = stripHtml(currentEl.text).toUpperCase();

  if (currentEl.type === "character") {
    const names = [...new Set(
      elements.filter(e => e.type === "character").map(e => stripHtml(e.text).toUpperCase().trim()).filter(Boolean)
    )];
    if (!query) return names.slice(0, 8);
    return names.filter(n => n.startsWith(query) && n !== query).slice(0, 6);
  }

  if (currentEl.type === "scene-heading") {
    // If empty or just started, suggest prefixes
    if (!query || query.length <= 3) {
      const prefixMatches = SCENE_PREFIXES.filter(p => p.startsWith(query));
      if (prefixMatches.length > 0) return prefixMatches;
    }
    // If we have a prefix, suggest known locations
    const locations = [...new Set(
      elements.filter(e => e.type === "scene-heading").map(e => stripHtml(e.text).toUpperCase().trim()).filter(Boolean)
    )];
    // Also suggest times of day if location is partially typed
    const hasTime = TIMES_OF_DAY.some(t => query.includes(t.trim()));
    if (!hasTime && query.length > 5) {
      const timeMatches = TIMES_OF_DAY.map(t => query + t);
      const locMatches = locations.filter(l => l.startsWith(query) && l !== query);
      return [...locMatches, ...timeMatches].slice(0, 6);
    }
    return locations.filter(l => l.startsWith(query) && l !== query).slice(0, 6);
  }

  if (currentEl.type === "transition") {
    if (!query) return COMMON_TRANSITIONS.slice(0, 6);
    return COMMON_TRANSITIONS.filter(t => t.startsWith(query) && t !== query).slice(0, 6);
  }

  return [];
}

// Page dimensions for visual page breaks
const PAGE_HEIGHT = 880;
const PAGE_GAP = 32;
const HEADER_HEIGHT = 44; // Reserved header margin (page number area)
const FOOTER_HEIGHT = 32; // Reserved footer margin

function getCurrentSceneIndex(elements, activeElId) {
  let sceneIdx = 0;
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].type === "scene-heading") sceneIdx++;
    if (elements[i].id === activeElId) return sceneIdx;
  }
  return sceneIdx;
}

function getNextType(currentType) {
  if (currentType === "character") return "dialogue";
  if (currentType === "dialogue") return "action";
  if (currentType === "parenthetical") return "dialogue";
  if (currentType === "scene-heading") return "action";
  if (currentType === "transition") return "action";
  if (currentType === "shot") return "action";
  if (currentType === "centered") return "action";
  return "action";
}

function cycleType(currentType) {
  const idx = TAB_CYCLE.indexOf(currentType);
  if (idx === -1) return "action";
  return TAB_CYCLE[(idx + 1) % TAB_CYCLE.length];
}

function autoFormatText(type, text) {
  if (type === "scene-heading") {
    let t = text.toUpperCase();
    const plain = stripHtml(t);
    if (plain && !plain.startsWith("INT.") && !plain.startsWith("EXT.") && !plain.startsWith("INT/EXT") && !plain.startsWith("I/E")) {
      t = "INT. " + t;
    }
    return t;
  }
  if (type === "character") return text.toUpperCase();
  if (type === "transition") return text.toUpperCase();
  if (type === "shot") return text.toUpperCase();
  return text;
}

function elementsToFountain(elements, title = "Untitled", tp = null) {
  const t = tp || DEFAULT_TITLE_PAGE;
  let fountain = `Title: ${t.title || title}\nCredit: ${t.credit || "written by"}\nAuthor: ${t.author || "Writer"}\n`;
  if (t.source) fountain += `Source: ${t.source}\n`;
  if (t.draftDate) fountain += `Draft date: ${t.draftDate}\n`;
  if (t.contact) fountain += `Contact: ${t.contact}\n`;
  fountain += "\n";
  elements.forEach((el) => {
    const text = htmlToFountain(el.text);
    switch (el.type) {
      case "scene-heading":
        fountain += `\n${text}\n\n`;
        break;
      case "action":
        fountain += `${text}\n\n`;
        break;
      case "character":
        fountain += `${text}\n`;
        break;
      case "dialogue":
        fountain += `${text}\n\n`;
        break;
      case "parenthetical":
        fountain += `(${text.replace(/^\(|\)$/g, "")})\n`;
        break;
      case "transition":
        fountain += `> ${text}\n\n`;
        break;
      case "shot":
        fountain += `${text}\n\n`;
        break;
      case "centered":
        fountain += `> ${text} <\n\n`;
        break;
      default:
        fountain += `${text}\n\n`;
    }
  });
  return fountain;
}

function parseFountain(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  // Skip title page
  while (i < lines.length && lines[i].match(/^(Title|Credit|Author|Source|Draft date|Contact|Copyright):/i)) {
    i++;
    while (i < lines.length && lines[i].startsWith("  ")) i++;
  }
  while (i < lines.length && lines[i].trim() === "") i++;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    // Centered text: > text <
    if (line.match(/^>.*<$/)) {
      elements.push({ id: uid(), type: "centered", text: line.replace(/^>\s*/, "").replace(/\s*<$/, "") });
    } else if (line.match(/^(INT\.|EXT\.|INT\/EXT|I\/E)/i)) {
      elements.push({ id: uid(), type: "scene-heading", text: line.toUpperCase() });
    } else if (line.startsWith(">") && !line.startsWith(">>")) {
      elements.push({ id: uid(), type: "transition", text: line.replace(/^>\s*/, "").toUpperCase() });
    } else if (line.match(/^\(.*\)$/)) {
      elements.push({ id: uid(), type: "parenthetical", text: line });
    } else if (line === line.toUpperCase() && line.length > 1 && !line.match(/^(INT\.|EXT\.)/) && line.match(/^[A-Z]/)) {
      elements.push({ id: uid(), type: "character", text: line });
      // Next non-empty line is likely dialogue
      i++;
      while (i < lines.length) {
        const dl = lines[i].trim();
        if (!dl) break;
        if (dl.match(/^\(.*\)$/)) {
          elements.push({ id: uid(), type: "parenthetical", text: dl });
        } else {
          elements.push({ id: uid(), type: "dialogue", text: dl });
        }
        i++;
      }
      continue;
    } else {
      elements.push({ id: uid(), type: "action", text: line });
    }
    i++;
  }
  return elements.length > 0 ? elements : DEFAULT_SCRIPT.elements;
}

function parseFDX(xmlText) {
  const elements = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const paragraphs = doc.querySelectorAll("Paragraph");
  paragraphs.forEach((p) => {
    const pType = p.getAttribute("Type") || "";
    const textNodes = p.querySelectorAll("Text");
    const text = Array.from(textNodes).map((t) => t.textContent).join("");
    if (!text.trim()) return;
    const typeMap = {
      "Scene Heading": "scene-heading",
      "Action": "action",
      "Character": "character",
      "Dialogue": "dialogue",
      "Parenthetical": "parenthetical",
      "Transition": "transition",
      "Shot": "shot",
      "General": "centered",
    };
    elements.push({ id: uid(), type: typeMap[pType] || "action", text: text.trim() });
  });
  return elements.length > 0 ? elements : DEFAULT_SCRIPT.elements;
}

// ─── Icons ───
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ animation: "rotateSpark 4s linear infinite" }}>
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
  );
}
function ChevronIcon({ direction = "down" }) {
  const rotation = direction === "up" ? 180 : direction === "left" ? 90 : direction === "right" ? -90 : 0;
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rotation}deg)` }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Screenplay Element Component ───
function ScriptElement({ element, isActive, onClick, onChange, onKeyDown, activeType }) {
  const ref = useRef(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      if (ref.current.childNodes.length > 0) {
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [isActive]);

  // Sync innerHTML from state on mount and when text changes externally
  // (e.g. type change, auto-format) — skip during active user editing
  useEffect(() => {
    if (ref.current && !isEditingRef.current) {
      ref.current.innerHTML = element.text;
    }
  }, [element.text, element.type]);

  const handleInput = (e) => {
    isEditingRef.current = true;
    const html = e.currentTarget.innerHTML || "";
    const hasFormatting = /<(b|i|u|strong|em)>/i.test(html);
    onChange(element.id, hasFormatting ? html : (e.currentTarget.textContent || ""));
    // Reset editing flag after React state update
    requestAnimationFrame(() => { isEditingRef.current = false; });
  };

  const handleKeyDownLocal = (e) => {
    // Bold / Italic / Underline
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      document.execCommand("bold");
      ref.current?.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "i") {
      e.preventDefault();
      document.execCommand("italic");
      ref.current?.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "u") {
      e.preventDefault();
      document.execCommand("underline");
      ref.current?.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    onKeyDown(e, element);
  };

  const typeStyles = {
    "scene-heading": "uppercase font-semibold tracking-wide text-left",
    "action": "text-left",
    "character": "uppercase font-semibold text-left",
    "dialogue": "text-left",
    "parenthetical": "italic text-left",
    "transition": "uppercase text-right font-semibold",
    "shot": "uppercase font-semibold text-left",
    "centered": "text-center",
  };

  // Industry-standard screenplay margins (500px content area)
  // Based on standard page: 8.5"x11", 1.5" left margin, 1.0" right margin = 6.0" print width
  // Character at 3.7" from left edge = 2.2" indent = ~183px
  // Dialogue: 2.5" to 6.0" from left edge = 1.0" to 1.5" indent = 83px / 125px
  // Parenthetical: 3.1" to 5.6" = 1.6" to 1.9" indent = 133px / 158px
  const margins = {
    "scene-heading": { marginLeft: 0, marginRight: 0, marginBottom: 4 },
    "action":        { marginLeft: 0, marginRight: 0, marginBottom: 16 },
    "character":     { marginLeft: 185, marginRight: 0, marginBottom: 2 },
    "dialogue":      { marginLeft: 83, marginRight: 125, marginBottom: 16 },
    "parenthetical": { marginLeft: 133, marginRight: 158, marginBottom: 2 },
    "transition":    { marginLeft: 0, marginRight: 0, marginTop: 16, marginBottom: 16 },
    "shot":          { marginLeft: 0, marginRight: 0, marginBottom: 4 },
    "centered":      { marginLeft: 0, marginRight: 0, marginBottom: 16 },
  };

  const placeholders = {
    "scene-heading": "INT./EXT. LOCATION — TIME",
    "action": "Describe what we see...",
    "character": "CHARACTER NAME",
    "dialogue": "Dialogue...",
    "parenthetical": "(beat)",
    "transition": "CUT TO:",
    "shot": "ANGLE ON — SUBJECT",
    "centered": "Centered text",
  };

  const style = margins[element.type] || {};

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`outline-none cursor-text ${typeStyles[element.type] || ""} ${isActive ? "ring-1 ring-red-400/30 rounded px-1 -mx-1 bg-red-50/50" : ""}`}
      style={{
        ...style,
        fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
        fontSize: "12pt",
        lineHeight: "1.85",
        minHeight: "1.85em",
        whiteSpace: "pre-wrap",
        color: element.type === "parenthetical" ? "#666666" : undefined,
      }}
      onClick={() => onClick(element.id)}
      onInput={handleInput}
      onKeyDown={handleKeyDownLocal}
      spellCheck
      data-placeholder={placeholders[element.type] || ""}
      ref={ref}
    />
  );
}

// ─── AI Message Component ───
function AIMessage({ msg }) {
  const isAI = msg.role === "assistant";

  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      let formatted = line.replace(/\*([^*]+)\*/g, '<em style="color:#ffffff;font-style:normal;font-weight:500">$1</em>');
      formatted = formatted.replace(/^• /, '<span style="color:#c43e3e">•</span> ');
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} style={{ marginBottom: line === "" ? 8 : 2 }} />;
    });
  };

  return (
    <div className="flex gap-2.5" style={{ animation: "fadeUp 0.3s ease" }}>
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 28, height: 28,
          background: isAI ? "rgba(196,62,62,0.2)" : "rgba(255,255,255,0.1)",
          color: isAI ? "#c43e3e" : "#e8e8e8",
          fontSize: 11, fontWeight: 600,
          fontFamily: isAI ? "'Playfair Display', serif" : "inherit",
          fontStyle: isAI ? "italic" : "normal",
        }}
      >
        {isAI ? "S" : "Y"}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 10, color: "#555555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {isAI ? "ScriptMind" : "You"}
        </div>
        <div
          style={{
            fontSize: 12.5, lineHeight: 1.6,
            background: isAI ? "#111111" : "rgba(255,255,255,0.06)",
            border: `1px solid ${isAI ? "#222222" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 6, padding: "10px 12px", color: "#e8e8e8",
          }}
        >
          {formatText(msg.text)}
        </div>
        {msg.streaming && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#c43e3e" }}>
            <span className="inline-block" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>●</span> Thinking...
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Title Page Editor Modal ───
function TitlePageEditor({ titlePage, onChange, onClose }) {
  const fields = [
    { key: "title", label: "Title" },
    { key: "credit", label: "Credit" },
    { key: "author", label: "Author" },
    { key: "source", label: "Source Material" },
    { key: "draftDate", label: "Draft Date" },
    { key: "contact", label: "Contact Info" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, background: "#111111", border: "1px solid #222222", borderRadius: 8, padding: 24, boxShadow: "0 16px 48px rgba(0,0,0,0.6)", animation: "fadeUp 0.2s ease" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#e8e8e8" }}>Title Page</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {fields.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", marginBottom: 4 }}>{label}</label>
            {key === "contact" ? (
              <textarea
                value={titlePage[key]}
                onChange={(e) => onChange({ ...titlePage, [key]: e.target.value })}
                rows={2}
                style={{ width: "100%", background: "#0a0a0a", border: "1px solid #222", borderRadius: 4, padding: "8px 10px", fontSize: 13, color: "#e8e8e8", fontFamily: "'Courier Prime', monospace", resize: "none", outline: "none" }}
                onFocus={(e) => { e.target.style.borderColor = "#c43e3e"; }}
                onBlur={(e) => { e.target.style.borderColor = "#222"; }}
                placeholder="Agent / Manager / Email"
              />
            ) : (
              <input
                value={titlePage[key]}
                onChange={(e) => onChange({ ...titlePage, [key]: e.target.value })}
                style={{ width: "100%", background: "#0a0a0a", border: "1px solid #222", borderRadius: 4, padding: "8px 10px", fontSize: 13, color: "#e8e8e8", fontFamily: "'Courier Prime', monospace", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => { e.target.style.borderColor = "#c43e3e"; }}
                onBlur={(e) => { e.target.style.borderColor = "#222"; }}
                placeholder={label}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── File Menu Dropdown ───
function FileMenu({ onNew, onImport, onExportPDF, onExportFountain, onTitlePage, isOpen, onToggle }) {
  if (!isOpen) return null;
  return (
    <div
      className="absolute z-50"
      style={{
        top: 42, left: 0,
        background: "#111111", border: "1px solid #222222",
        borderRadius: 6, padding: 4, minWidth: 180,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {[
        { label: "New Script", icon: "✦", action: onNew },
        { label: "Title Page", icon: "◇", action: onTitlePage },
        { label: "Import screenplay", icon: "↑", action: onImport },
        { label: "─", divider: true },
        { label: "Export as PDF", icon: "↓", action: onExportPDF },
        { label: "Export as .fountain", icon: "↓", action: onExportFountain },
      ].map((item, i) =>
        item.divider ? (
          <div key={i} style={{ height: 1, background: "#222222", margin: "4px 0" }} />
        ) : (
          <button
            key={i}
            onClick={() => { item.action(); onToggle(); }}
            className="w-full text-left flex items-center gap-2"
            style={{
              padding: "6px 10px", borderRadius: 4, border: "none",
              background: "transparent", color: "#888888", fontSize: 12,
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#222222"; e.currentTarget.style.color = "#e8e8e8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; }}
          >
            <span style={{ width: 16, textAlign: "center", fontSize: 11 }}>{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

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

  // Measure content and calculate number of pages
  useEffect(() => {
    if (contentRef.current) {
      const h = contentRef.current.scrollHeight;
      setNumPages(Math.max(1, Math.ceil(h / PAGE_HEIGHT)));
    }
  }, [elements]);

  // Calculate which visual page the active element is on
  useEffect(() => {
    if (!activeElId || !contentRef.current) return;
    const el = document.getElementById(`script-el-${activeElId}`);
    if (!el) return;
    const offsetTop = el.offsetTop;
    const page = Math.floor(offsetTop / (PAGE_HEIGHT + PAGE_GAP)) + 1;
    setCurrentPage(Math.min(page, numPages));
  }, [activeElId, numPages]);

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
        setElements(parseFDX(text));
      } else {
        setElements(parseFountain(text));
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

  const handleExportPDF = () => {
    // Generate printable HTML and trigger print dialog
    const printContent = elements.map((el) => {
      const styles = {
        "scene-heading": "text-transform:uppercase;font-weight:bold;margin-bottom:4px;letter-spacing:0.03em;",
        "action": "margin-bottom:16px;",
        "character": "text-transform:uppercase;font-weight:bold;margin-left:2.2in;margin-bottom:2px;",
        "dialogue": "margin-left:1in;margin-right:1.5in;margin-bottom:16px;",
        "parenthetical": "font-style:italic;margin-left:1.6in;margin-right:1.9in;margin-bottom:2px;color:#444;",
        "transition": "text-transform:uppercase;text-align:right;margin-top:16px;margin-bottom:16px;",
        "shot": "text-transform:uppercase;font-weight:bold;margin-bottom:4px;",
        "centered": "text-align:center;margin-bottom:16px;",
      };
      return `<p style="${styles[el.type] || ""}font-family:'Courier Prime','Courier New',monospace;font-size:12pt;line-height:1.8;">${el.text}</p>`;
    }).join("");

    // Title page HTML
    const tp = titlePage;
    const titlePageHtml = `
      <div style="page-break-after:always;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:'Courier Prime','Courier New',monospace;font-size:12pt;text-align:center;">
        <div style="margin-bottom:2em;">
          <div style="font-size:24pt;font-weight:bold;margin-bottom:0.5em;">${tp.title || scriptTitle}</div>
          ${tp.credit ? `<div style="margin-bottom:0.3em;">${tp.credit}</div>` : ""}
          ${tp.author ? `<div style="font-weight:bold;">${tp.author}</div>` : ""}
          ${tp.source ? `<div style="margin-top:1em;">Based on ${tp.source}</div>` : ""}
        </div>
        <div style="position:absolute;bottom:2in;right:1.5in;text-align:left;font-size:10pt;">
          ${tp.draftDate ? `<div>${tp.draftDate}</div>` : ""}
          ${tp.contact ? `<div style="white-space:pre-line;">${tp.contact}</div>` : ""}
        </div>
      </div>`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>${scriptTitle}</title>
      <link href="https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap" rel="stylesheet">
      <style>
        @page { margin: 1in; size: letter; }
        body { font-family: 'Courier Prime', 'Courier New', monospace; font-size: 12pt; line-height: 1.8; padding: 0; margin: 0; }
      </style></head>
      <body>${titlePageHtml}${printContent}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
    showNotification("PDF export — use Print dialog to save as PDF");
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

            <div style={{ position: "relative", width: 680, flexShrink: 0 }}>
              {/* SVG clipPath — clips content to body area only (excludes header/footer margins) */}
              <svg width="0" height="0" style={{ position: "absolute" }}>
                <defs>
                  <clipPath id="page-clip">
                    {Array.from({ length: numPages }, (_, i) => {
                      // Page 1: top padding in content div handles header; just clip footer
                      // Pages 2+: clip both header and footer areas so content stays in the body
                      const yStart = i * (PAGE_HEIGHT + PAGE_GAP) + (i === 0 ? 0 : HEADER_HEIGHT);
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
                  minHeight: numPages * PAGE_HEIGHT + (numPages - 1) * PAGE_GAP,
                  background: "#ffffff",
                  borderRadius: 2,
                  padding: "72px 72px 72px 108px",
                  color: "#111111",
                  position: "relative",
                  clipPath: "url(#page-clip)",
                }}
              >
                {elements.map((el) => (
                  <div key={el.id} id={`script-el-${el.id}`} style={{ position: "relative" }}>
                    <ScriptElement
                      element={el}
                      isActive={el.id === activeElId}
                      onClick={setActiveElId}
                      onChange={updateElement}
                      onKeyDown={handleKeyDown}
                    />
                    {/* SmartType autocomplete dropdown */}
                    {el.id === activeElId && suggestions.length > 0 && (
                      <div style={{
                        position: "absolute", left: 0, top: "100%", zIndex: 20,
                        background: "#1a1a1a", border: "1px solid #333", borderRadius: 4,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.5)", minWidth: 220, maxWidth: 400,
                        overflow: "hidden", marginTop: 2,
                      }}>
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            onMouseDown={(e) => { e.preventDefault(); acceptSuggestion(s); }}
                            onMouseEnter={() => setAcIndex(i)}
                            style={{
                              padding: "6px 12px", fontSize: 12, cursor: "pointer",
                              fontFamily: "'Courier Prime', 'Courier New', monospace",
                              background: i === acIndex ? "rgba(196,62,62,0.25)" : "transparent",
                              color: i === acIndex ? "#e8e8e8" : "#aaa",
                              borderLeft: i === acIndex ? "2px solid #c43e3e" : "2px solid transparent",
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
                ))}
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
