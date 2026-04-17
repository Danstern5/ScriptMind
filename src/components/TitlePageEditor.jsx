import { useState } from "react";

export default function TitlePageEditor({ titlePage, onChange, onClose }) {
  const [local, setLocal] = useState({ ...titlePage });
  const handleClose = () => { onChange(local); onClose(); };
  const fields = [
    { key: "title", label: "Title" },
    { key: "credit", label: "Credit" },
    { key: "author", label: "Author" },
    { key: "source", label: "Source Material" },
    { key: "draftDate", label: "Draft Date" },
    { key: "contact", label: "Contact Info" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "none" }} onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 8, padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", animation: "fadeUp 0.2s ease" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Title Page</span>
          <button onClick={handleClose} style={{ background: "transparent", border: "none", color: "var(--text-label)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {fields.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-label)", marginBottom: 4 }}>{label}</label>
            {key === "contact" ? (
              <textarea
                value={local[key]}
                onChange={(e) => setLocal((p) => ({ ...p, [key]: e.target.value }))}
                rows={2}
                style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border-default)", borderRadius: 4, padding: "8px 10px", fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-screenplay)", resize: "none", outline: "none" }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent-green)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; }}
                placeholder="Agent / Manager / Email"
              />
            ) : (
              <input
                value={local[key]}
                onChange={(e) => setLocal((p) => ({ ...p, [key]: e.target.value }))}
                style={{ width: "100%", background: "var(--bg-panel)", border: "1px solid var(--border-default)", borderRadius: 4, padding: "8px 10px", fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-screenplay)", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent-green)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; }}
                placeholder={label}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
