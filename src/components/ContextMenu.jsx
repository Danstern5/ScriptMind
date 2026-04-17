import { useEffect } from "react";

export default function ContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    window.addEventListener("contextmenu", handler);
    return () => { window.removeEventListener("click", handler); window.removeEventListener("contextmenu", handler); };
  }, [onClose]);
  return (
    <div
      style={{
        position: "fixed", left: x, top: y, zIndex: 100,
        background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 6,
        padding: 4, minWidth: 180, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); item.action(); onClose(); }}
          className="w-full text-left"
          style={{
            padding: "6px 12px", borderRadius: 4, border: "none",
            background: "transparent",
            color: item.checked ? "var(--text-primary)" : "var(--text-secondary)",
            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-canvas)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = item.checked ? "var(--text-primary)" : "var(--text-secondary)"; }}
        >
          <span style={{ width: 14, fontSize: 11, color: "var(--accent-green)" }}>{item.checked ? "✓" : ""}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
