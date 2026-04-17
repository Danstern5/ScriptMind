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
    border: "1px solid var(--border-default)", background: "var(--bg-panel)",
    color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-screenplay)",
    boxSizing: "border-box", outline: "none",
  };

  const labelStyle = {
    fontSize: 11, color: "var(--text-label)", textTransform: "uppercase",
    letterSpacing: "0.08em", display: "block", marginBottom: 4,
  };

  return (
    <div className="flex items-center justify-center h-screen w-full"
      style={{ background: "var(--bg-canvas)", fontFamily: "var(--font-sans)" }}>
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 10,
        padding: 32, width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--text-primary)" }}>
            Script<span style={{ fontStyle: "italic" }}>Mind</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
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
            onFocus={(e) => { e.target.style.borderColor = "var(--accent-green)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; }}
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
            onFocus={(e) => { e.target.style.borderColor = "var(--accent-green)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !email.trim() || !password}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 4, border: "none",
            backgroundImage: submitting || !email.trim() || !password ? "none" : "linear-gradient(135deg, #16a34a, #4ade80, #16a34a)",
            backgroundColor: submitting || !email.trim() || !password ? "#e8e8e8" : "transparent",
            color: submitting || !email.trim() || !password ? "var(--text-label)" : "#fff",
            fontSize: 12, fontWeight: 500, cursor: submitting ? "default" : "pointer",
            fontFamily: "inherit",
            boxShadow: submitting || !email.trim() || !password ? "none" : "0 2px 12px rgba(74,222,128,0.3)",
          }}
        >
          {submitting ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign In" : "Sign Up")}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-tertiary)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            style={{ color: "var(--accent-green)", cursor: "pointer", textDecoration: "underline" }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </div>
      </div>
    </div>
  );
}
