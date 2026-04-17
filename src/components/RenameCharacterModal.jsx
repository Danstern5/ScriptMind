import { useState } from "react";

export default function RenameCharacterModal({ oldName, onRename, onClose }) {
  const [newName, setNewName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "none" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #e0e0e0", borderRadius: 10, padding: 24, width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>Rename Character</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: "#aaaaaa", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Current Name</label>
          <input
            value={oldName}
            readOnly
            style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "1px solid #e0e0e0", background: "#f8f8f8", color: "#999999", fontSize: 13, fontFamily: "'Courier Prime', monospace", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: "#aaaaaa", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>New Name</label>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) onRename(oldName, newName);
              if (e.key === "Escape") onClose();
            }}
            placeholder="Enter new name..."
            style={{ width: "100%", padding: "8px 10px", borderRadius: 4, border: "1px solid #e0e0e0", background: "#f8f8f8", color: "#1a1a1a", fontSize: 13, fontFamily: "'Courier Prime', monospace", boxSizing: "border-box", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "6px 16px", borderRadius: 4, border: "1px solid #e0e0e0", background: "transparent", color: "#666666", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
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
