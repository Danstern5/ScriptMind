export default function FileMenu({ onNew, onImport, onExportPDF, onExportFountain, onExportFDX, onTitlePage, isOpen, onToggle }) {
  if (!isOpen) return null;
  return (
    <div
      className="absolute z-50"
      style={{
        top: 42, left: 0,
        background: "#1e293b", border: "1px solid #334155",
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
        { label: "Export as .fdx", icon: "↓", action: onExportFDX },
      ].map((item, i) =>
        item.divider ? (
          <div key={i} style={{ height: 1, background: "#334155", margin: "4px 0" }} />
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "#334155"; e.currentTarget.style.color = "#e8e8e8"; }}
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
