import { useState } from "react";

export default function RenameCharacterModal({ oldName, onRename, onClose }) {
  const [newName, setNewName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "none" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#111111", border: "1px solid #222222", borderRadius: 10, padding: 24, width: 360, boxShadow: "0 16px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e8", marginBottom: 16 }}>Rename Character</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#555555", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Current Name</label>
          <input
            value={oldName}
            readOnly
            style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "1px solid #222222", background: "#0a0a0a", color: "#888888", fontSize: 13, fontFamily: "'Courier Prime', monospace", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: "#555555", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>New Name</label>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) onRename(oldName, newName);
              if (e.key === "Escape") onClose();
            }}
            placeholder="Enter new name..."
            style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "1px solid #333", background: "#0a0a0a", color: "#e8e8e8", fontSize: 13, fontFamily: "'Courier Prime', monospace", boxSizing: "border-box", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "6px 16px", borderRadius: 4, border: "1px solid #222222", background: "transparent", color: "#888888", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >Cancel</button>
          <button
            onClick={() => newName.trim() && onRename(oldName, newName)}
            disabled={!newName.trim()}
            style={{ padding: "6px 16px", borderRadius: 4, border: "none", background: newName.trim() ? "#c43e3e" : "#333", color: "#fff", fontSize: 12, cursor: newName.trim() ? "pointer" : "default", fontFamily: "inherit", fontWeight: 500 }}
          >Rename</button>
        </div>
      </div>
    </div>
  );
}
