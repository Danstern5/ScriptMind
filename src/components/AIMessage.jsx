export default function AIMessage({ msg }) {
  const isAI = msg.role === "assistant";

  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      let formatted = line.replace(/\*([^*]+)\*/g, '<em style="color:#ffffff;font-style:normal;font-weight:500">$1</em>');
      formatted = formatted.replace(/^• /, '<span style="color:#64748b">•</span> ');
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} style={{ marginBottom: line === "" ? 8 : 2 }} />;
    });
  };

  return (
    <div className="flex gap-2.5" style={{ animation: "fadeUp 0.3s ease" }}>
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 28, height: 28,
          background: isAI ? "rgba(100,116,139,0.2)" : "rgba(255,255,255,0.1)",
          color: isAI ? "#64748b" : "#e8e8e8",
          fontSize: 11, fontWeight: 600,
          fontFamily: isAI ? "'Playfair Display', serif" : "inherit",
          fontStyle: isAI ? "italic" : "normal",
        }}
      >
        {isAI ? "S" : "Y"}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 10, color: "#555555", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {isAI ? "ScriptMind" : "You"}
        </div>
        <div
          style={{
            fontSize: 12.5, lineHeight: 1.6,
            background: isAI ? "#1e293b" : "rgba(255,255,255,0.06)",
            border: `1px solid ${isAI ? "#334155" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 6, padding: "10px 12px", color: "#e8e8e8",
          }}
        >
          {formatText(msg.text)}
        </div>
        {msg.streaming && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>
            <span className="inline-block" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>●</span> Thinking...
          </div>
        )}
      </div>
    </div>
  );
}
