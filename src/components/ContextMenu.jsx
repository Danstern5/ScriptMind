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
        background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: 6,
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
            background: "transparent", color: item.checked ? "#1a1a1a" : "#666666",
            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#1a1a1a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = item.checked ? "#1a1a1a" : "#666666"; }}
        >
          <span style={{ width: 14, fontSize: 11 }}>{item.checked ? "✓" : ""}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
