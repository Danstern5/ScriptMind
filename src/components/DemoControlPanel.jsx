import { useState, useEffect } from "react";

const DEMO_STEPS = [
  "Open app — screenplay loaded",
  "30-sec voiceover: introduce Maya",
  "Tour Script Bible (sidebar icon)",
  "Chat: 'What's working in this scene?'",
  "Highlight Maya's dialogue → Alternatives",
  "Highlight a line → Consistency Check",
  "Highlight a line → Discuss → 'is this too on the nose?'",
  "Ask investor: INVEST or PASS? Click button below",
  "Switch to Thinking Mode → Explore tab",
  "Run Alternative Scene Analysis",
  "Show Script Bible themes / characters again",
];

export default function DemoControlPanel({ demoBranch, onBranchSelect, onReset }) {
  const [visible, setVisible] = useState(false);
  const [steps, setSteps] = useState(DEMO_STEPS.map(() => false));

  // Cmd/Ctrl+Shift+D toggles panel; Escape dismisses
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "d" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setVisible((v) => !v);
      }
      if (e.key === "Escape" && visible) {
        setVisible(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible]);

  const toggleStep = (i) =>
    setSteps((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 36,
        right: 16,
        zIndex: 9999,
        width: 260,
        background: "rgba(18, 18, 20, 0.93)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "14px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        fontFamily: "var(--font-sans)",
        color: "rgba(255,255,255,0.85)",
        fontSize: 11.5,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono-ui)" }}>
          Demo Control
        </span>
        <button
          onClick={() => setVisible(false)}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>

      {/* Branch toggle */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono-ui)" }}>
          Investor said
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["invest", "pass"].map((branch) => {
            const active = demoBranch === branch;
            const isInvest = branch === "invest";
            return (
              <button
                key={branch}
                onClick={() => onBranchSelect(branch)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  borderRadius: 6,
                  border: active
                    ? `1px solid ${isInvest ? "rgba(74,222,128,0.7)" : "rgba(248,113,113,0.7)"}`
                    : "1px solid rgba(255,255,255,0.12)",
                  background: active
                    ? isInvest ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)"
                    : "rgba(255,255,255,0.05)",
                  color: active
                    ? isInvest ? "#4ade80" : "#f87171"
                    : "rgba(255,255,255,0.5)",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "var(--font-mono-ui)",
                  fontSize: 11,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  transition: "all 0.15s ease",
                }}
              >
                {isInvest ? "INVEST" : "PASS"}
              </button>
            );
          })}
        </div>
        {demoBranch !== "none" && (
          <div style={{ marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
            {demoBranch === "invest"
              ? "Screenplay swapped → Maya succeeds"
              : "Screenplay swapped → Maya gets rejected"}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />

      {/* Step checklist */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 7, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono-ui)" }}>
          Demo beats
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {DEMO_STEPS.map((label, i) => (
            <button
              key={i}
              onClick={() => toggleStep(i)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 7,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 0",
                textAlign: "left",
                color: steps[i] ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)",
                textDecoration: steps[i] ? "line-through" : "none",
                transition: "color 0.1s",
              }}
            >
              <span style={{
                flexShrink: 0,
                width: 14,
                height: 14,
                borderRadius: 3,
                border: steps[i] ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(255,255,255,0.2)",
                background: steps[i] ? "rgba(74,222,128,0.25)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "#4ade80",
                marginTop: 1,
              }}>
                {steps[i] ? "✓" : ""}
              </span>
              <span style={{ fontSize: 11, lineHeight: 1.35 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 0" }} />

      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          width: "100%",
          padding: "7px 0",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)"; e.currentTarget.style.color = "#f87171"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
      >
        Reset demo
      </button>

      {/* Shortcut hint */}
      <div style={{ marginTop: 10, fontSize: 9.5, color: "rgba(255,255,255,0.2)", textAlign: "center", fontFamily: "var(--font-mono-ui)" }}>
        ⌘⇧D or Esc to dismiss
      </div>
    </div>
  );
}
