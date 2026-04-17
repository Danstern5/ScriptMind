export default function SelectionToolbar({ selection, onAction }) {
  if (!selection) return null;

  const { rect } = selection;
  const toolbarWidth = 248;
  const toolbarHeight = 30;
  const gap = 8;

  let left = rect.left + rect.width / 2 - toolbarWidth / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));

  let top = rect.top - toolbarHeight - gap;
  if (top < 8) top = rect.bottom + gap;

  const buttons = [
    { key: "alternatives", label: "Alternatives" },
    { key: "consistency", label: "Consistency Check" },
    { key: "discuss", label: "Discuss" },
  ];

  return (
    <div
      data-selection-toolbar
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        background: "#1a1a1a",
        border: "1px solid #333333",
        borderRadius: 6,
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        padding: "4px 6px",
        gap: 0,
        animation: "fadeIn 0.12s ease",
        userSelect: "none",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      {buttons.map((btn, i) => (
        <div key={btn.key} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 && <div style={{ width: 1, height: 14, background: "#2a2a2a", margin: "0 2px" }} />}
          <button
            onClick={() => onAction(btn.key, selection.text)}
            style={{
              fontSize: 11,
              padding: "3px 8px",
              background: "transparent",
              border: "none",
              color: "#888888",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              borderRadius: 4,
              transition: "color 0.1s, background 0.1s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f0f0f0";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#888888";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {btn.label}
          </button>
        </div>
      ))}
    </div>
  );
}
