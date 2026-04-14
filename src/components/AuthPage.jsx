import { useState } from "react";
import useAuth from "../hooks/useAuth";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setError(null);
    setSubmitting(true);
    const result = mode === "login"
      ? await login(email.trim(), password)
      : await signup(email.trim(), password);
    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 4,
    border: "1px solid #475569", background: "#6D8196",
    color: "#e8e8e8", fontSize: 13, fontFamily: "'Courier Prime', monospace",
    boxSizing: "border-box", outline: "none",
  };

  const labelStyle = {
    fontSize: 11, color: "#555555", textTransform: "uppercase",
    letterSpacing: "0.08em", display: "block", marginBottom: 4,
  };

  return (
    <div className="flex items-center justify-center h-screen w-full"
      style={{ background: "#6D8196", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
      <div style={{
        background: "#1e293b", border: "1px solid #334155", borderRadius: 10,
        padding: 32, width: 380, boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#e8e8e8" }}>
            Script<span style={{ fontStyle: "italic" }}>Mind</span>
          </div>
          <div style={{ fontSize: 12, color: "#888888", marginTop: 4 }}>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "#c43e3e", marginBottom: 12, textAlign: "center" }}>{error}</div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email" autoFocus value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !email.trim() || !password}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 4, border: "none",
            background: submitting || !email.trim() || !password ? "#475569" : "#64748b",
            color: "#fff", fontSize: 12, fontWeight: 500, cursor: submitting ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {submitting ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign In" : "Sign Up")}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#888888" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            style={{ color: "#64748b", cursor: "pointer", textDecoration: "underline" }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </div>
      </div>
    </div>
  );
}
