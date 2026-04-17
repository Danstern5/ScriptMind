const CARD_LEFT_BORDERS = ["var(--text-primary)", "var(--text-tertiary)", "var(--text-placeholder)"];

export default function ScenarioCard({ scenario, index, onDiscuss, onToggleImpact, onTogglePreview }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderLeft: `3px solid ${CARD_LEFT_BORDERS[index]}`,
      borderRadius: 6,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 6, fontFamily: "var(--font-serif)" }}>
          {scenario.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {scenario.description}
        </div>
      </div>

      {/* Impact */}
      <div style={{ borderTop: "1px solid var(--bg-canvas)" }}>
        <button
          onClick={onToggleImpact}
          style={{
            width: "100%", textAlign: "left", padding: "7px 16px",
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 10.5, fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-panel)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)" }}>Impact</span>
          <span style={{ color: "var(--text-muted)", fontSize: 9 }}>{scenario.impactOpen ? "▴" : "▾"}</span>
        </button>
        {scenario.impactOpen && (
          <div style={{ padding: "2px 16px 12px" }}>
            {[
              ["Tone", scenario.impact.tone],
              ["Character", scenario.impact.character],
              ["Plot", scenario.impact.plot],
            ].map(([label, text]) => (
              <div key={label} style={{ marginBottom: 7, fontSize: 11.5, lineHeight: 1.55 }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{label}</span>
                <span style={{ color: "var(--text-secondary)" }}> — {text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div style={{ borderTop: "1px solid var(--bg-canvas)" }}>
        <button
          onClick={onTogglePreview}
          style={{
            width: "100%", textAlign: "left", padding: "7px 16px",
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 10.5, color: "var(--text-tertiary)", fontFamily: "inherit",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-panel)"; e.currentTarget.style.color = "#555555"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          {scenario.previewOpen ? "Hide preview" : "Preview scene →"}
        </button>
        {scenario.previewOpen && (
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{
              fontFamily: "var(--font-screenplay)",
              fontSize: 11, color: "var(--text-secondary)",
              borderLeft: "3px solid #d0d0d0",
              background: "var(--bg-panel)",
              padding: "10px 14px",
              whiteSpace: "pre-line",
              lineHeight: 1.8,
            }}>
              {scenario.preview}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>
              For reference only — write your own version
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--bg-canvas)", padding: "8px 16px", marginTop: "auto" }}>
        <button
          onClick={onDiscuss}
          style={{
            fontSize: 11, color: "var(--text-tertiary)", background: "transparent",
            border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          Discuss →
        </button>
      </div>
    </div>
  );
}
