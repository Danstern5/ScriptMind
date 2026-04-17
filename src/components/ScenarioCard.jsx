const CARD_LEFT_BORDERS = ["#1a1a1a", "#888888", "#cccccc"];

export default function ScenarioCard({ scenario, index, onDiscuss, onToggleImpact, onTogglePreview }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e0e0e0",
      borderLeft: `3px solid ${CARD_LEFT_BORDERS[index]}`,
      borderRadius: 6,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>
          {scenario.title}
        </div>
        <div style={{ fontSize: 12, color: "#666666", lineHeight: 1.6 }}>
          {scenario.description}
        </div>
      </div>

      {/* Impact */}
      <div style={{ borderTop: "1px solid #f0f0f0" }}>
        <button
          onClick={onToggleImpact}
          style={{
            width: "100%", textAlign: "left", padding: "7px 16px",
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 10.5, fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888888" }}>Impact</span>
          <span style={{ color: "#bbbbbb", fontSize: 9 }}>{scenario.impactOpen ? "▴" : "▾"}</span>
        </button>
        {scenario.impactOpen && (
          <div style={{ padding: "2px 16px 12px" }}>
            {[
              ["Tone", scenario.impact.tone],
              ["Character", scenario.impact.character],
              ["Plot", scenario.impact.plot],
            ].map(([label, text]) => (
              <div key={label} style={{ marginBottom: 7, fontSize: 11.5, lineHeight: 1.55 }}>
                <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{label}</span>
                <span style={{ color: "#666666" }}> — {text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div style={{ borderTop: "1px solid #f0f0f0" }}>
        <button
          onClick={onTogglePreview}
          style={{
            width: "100%", textAlign: "left", padding: "7px 16px",
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 10.5, color: "#888888", fontFamily: "inherit",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f8f8"; e.currentTarget.style.color = "#555555"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888888"; }}
        >
          {scenario.previewOpen ? "Hide preview" : "Preview scene →"}
        </button>
        {scenario.previewOpen && (
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{
              fontFamily: "'Courier Prime', 'Courier New', monospace",
              fontSize: 11, color: "#666666",
              borderLeft: "3px solid #d0d0d0",
              background: "#f8f8f8",
              padding: "10px 14px",
              whiteSpace: "pre-line",
              lineHeight: 1.8,
            }}>
              {scenario.preview}
            </div>
            <div style={{ fontSize: 10, color: "#bbbbbb", marginTop: 6, fontStyle: "italic" }}>
              For reference only — write your own version
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #f0f0f0", padding: "8px 16px", marginTop: "auto" }}>
        <button
          onClick={onDiscuss}
          style={{
            fontSize: 11, color: "#888888", background: "transparent",
            border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#1a1a1a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#888888"; }}
        >
          Discuss →
        </button>
      </div>
    </div>
  );
}
