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
        background: "#6D8196", border: "1px solid #475569", borderRadius: 6,
        padding: 4, minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); item.action(); onClose(); }}
          className="w-full text-left"
          style={{
            padding: "6px 12px", borderRadius: 4, border: "none",
            background: "transparent", color: item.checked ? "#e8e8e8" : "#888888",
            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#475569"; e.currentTarget.style.color = "#e8e8e8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = item.checked ? "#e8e8e8" : "#888888"; }}
        >
          <span style={{ width: 14, fontSize: 11 }}>{item.checked ? "✓" : ""}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
