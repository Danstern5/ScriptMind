export default function AIMessage({ msg }) {
  const isAI = msg.role === "assistant";

  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      let formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*([^*]+)\*/g, '<em style="color:#1a1a1a;font-style:normal;font-weight:500">$1</em>');
      formatted = formatted.replace(/^• /, '<span style="color:#4ade80">•</span> ');
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} style={{ marginBottom: line === "" ? 8 : 2 }} />;
    });
  };

  return (
    <div className="flex gap-2.5" style={{ animation: "fadeUp 0.3s ease" }}>
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 28, height: 28,
          background: isAI ? "rgba(74,222,128,0.1)" : "rgba(0,0,0,0.06)",
          color: isAI ? "#4ade80" : "#333333",
          fontSize: 11, fontWeight: 600,
          fontFamily: isAI ? "'Playfair Display', serif" : "inherit",
          fontStyle: isAI ? "italic" : "normal",
        }}
      >
        {isAI ? "S" : "Y"}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 10, color: "#aaaaaa", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {isAI ? "ScriptMind" : "You"}
        </div>
        <div
          style={{
            fontSize: 12.5, lineHeight: 1.6,
            background: isAI ? "#f0f0f0" : "rgba(0,0,0,0.04)",
            border: `1px solid ${isAI ? "#e0e0e0" : "rgba(0,0,0,0.1)"}`,
            borderRadius: 6, padding: "10px 12px", color: "#1a1a1a",
          }}
        >
          {/* Quoted screenplay selection */}
          {msg.quote && (
            <div style={{
              borderLeft: "3px solid #cccccc",
              background: "rgba(0,0,0,0.04)",
              color: "#666666",
              fontFamily: "'Courier Prime', 'Courier New', monospace",
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 4,
              marginBottom: msg.text ? 10 : 0,
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
            }}>
              {msg.quote}
            </div>
          )}
          {msg.text && formatText(msg.text)}
        </div>
        {msg.streaming && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#4ade80" }}>
            <span className="inline-block" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>●</span> Thinking...
          </div>
        )}
      </div>
    </div>
  );
}
