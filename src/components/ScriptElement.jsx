import { useRef, useEffect } from "react";

export default function ScriptElement({ element, isActive, onClick, onChange, onKeyDown, sceneNumber, isDualColumn }) {
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
  const fullMargins = {
    "scene-heading": { marginLeft: 0, marginRight: 0, marginBottom: 4 },
    "action":        { marginLeft: 0, marginRight: 0, marginBottom: 16 },
    "character":     { marginLeft: 185, marginRight: 0, marginBottom: 2 },
    "dialogue":      { marginLeft: 83, marginRight: 125, marginBottom: 16 },
    "parenthetical": { marginLeft: 133, marginRight: 158, marginBottom: 2 },
    "transition":    { marginLeft: 0, marginRight: 0, marginTop: 16, marginBottom: 16 },
    "shot":          { marginLeft: 0, marginRight: 0, marginBottom: 4 },
    "centered":      { marginLeft: 0, marginRight: 0, marginBottom: 16 },
  };
  const dualMargins = {
    "character":     { marginLeft: 0, marginRight: 0, marginBottom: 2, textAlign: "center" },
    "dialogue":      { marginLeft: 8, marginRight: 8, marginBottom: 8 },
    "parenthetical": { marginLeft: 16, marginRight: 16, marginBottom: 2 },
  };
  const margins = isDualColumn ? { ...fullMargins, ...dualMargins } : fullMargins;

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

  const editable = (
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
    />
  );

  if (element.type === "scene-heading" && sceneNumber != null) {
    return (
      <div style={{ position: "relative", ...margins[element.type] }}>
        <span style={{
          position: "absolute", left: -48, top: 0,
          fontFamily: "'Courier Prime', 'Courier New', monospace",
          fontSize: "12pt", lineHeight: "1.85", fontWeight: 600, color: "#111",
        }}>{sceneNumber}</span>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className={`outline-none cursor-text ${typeStyles[element.type] || ""} ${isActive ? "ring-1 ring-red-400/30 rounded px-1 -mx-1 bg-red-50/50" : ""}`}
          style={{
            fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
            fontSize: "12pt", lineHeight: "1.85", minHeight: "1.85em", whiteSpace: "pre-wrap",
          }}
          onClick={() => onClick(element.id)}
          onInput={handleInput}
          onKeyDown={handleKeyDownLocal}
          spellCheck
          data-placeholder={placeholders[element.type] || ""}
        />
        <span style={{
          position: "absolute", right: -48, top: 0,
          fontFamily: "'Courier Prime', 'Courier New', monospace",
          fontSize: "12pt", lineHeight: "1.85", fontWeight: 600, color: "#111",
        }}>{sceneNumber}</span>
      </div>
    );
  }

  return editable;
}
