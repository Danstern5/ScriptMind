export default function FileMenu({ onNew, onImport, onExportPDF, onExportFountain, onExportFDX, onTitlePage, isOpen, onToggle }) {
  if (!isOpen) return null;
  return (
    <div
      className="absolute z-50"
      style={{
        top: 42, left: 0,
        background: "#ffffff", border: "1px solid #e0e0e0",
        borderRadius: 6, padding: 4, minWidth: 180,
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
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
          <div key={i} style={{ height: 1, background: "#e8e8e8", margin: "4px 0" }} />
        ) : (
          <button
            key={i}
            onClick={() => { item.action(); onToggle(); }}
            className="w-full text-left flex items-center gap-2"
            style={{
              padding: "6px 10px", borderRadius: 4, border: "none",
              background: "transparent", color: "#555555", fontSize: 12,
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.color = "#1a1a1a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#555555"; }}
          >
            <span style={{ width: 16, textAlign: "center", fontSize: 11 }}>{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
