import { useState } from "react";

// ── Placeholder AI readings ──────────────────────────────────────────────────
const AI_PLACEHOLDERS = {
  logline: "A man investigates a cold case while dealing with unresolved guilt — the personal stakes aren't fully visible yet in the first act.",
  genre: "Currently reading as a grounded crime drama with noir tendencies — the visual language and dialogue rhythm lean dark, but the pacing is slower than classic noir.",
  themes: "• Guilt as a form of self-punishment\n• The cost of institutional loyalty\n• How cities absorb and erase their crimes",
  synopsis: "The script follows Marcus as he re-enters the city and begins pulling on threads of the Hargrove case. Act 1 establishes the weight of his return. Act 2 is still developing — the investigation gains momentum but the personal cost isn't yet landing on the page. Act 3 is unwritten.",
  act1: "Act 1 runs approximately 24 pages. Establishes Marcus and the city. The inciting incident (the phone call) lands on page 11 — slightly late. The end of act turn is clear and effective.",
  act2: "Act 2 is in progress. The investigation is moving but the midpoint reversal hasn't landed yet. Pacing slows in the middle stretch — consider compressing the interrogation sequence.",
  act3: "Act 3 not yet written. Based on current trajectory, the thematic resolution around guilt will need to be earned earlier than the plot resolution.",
  characters: {
    "MARCUS": "Marcus reads as guarded and reactive — he's most alive in scenes where he's pushed, least convincing in the expository dialogue in Scene 2. His voice is consistent (clipped, indirect) but his motivation isn't fully legible to the reader yet.",
    "DETECTIVE CHEN": "Detective Chen is currently the sharpest presence on the page — her skepticism reads as earned, not procedural. The dynamic with Marcus is working. Her own backstory is implied but never stated, which is the right call for now.",
  }
};

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.1em", color: "var(--text-label)", marginBottom: 14,
      paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)",
    }}>
      {label}
    </div>
  );
}

function FieldLabel({ variant }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 500, textTransform: "uppercase",
      letterSpacing: "0.08em", marginBottom: 5,
      color: variant === "writer" ? "var(--accent-green)" : "var(--text-label)",
    }}>
      {variant === "writer" ? "Your intention" : "What your script reflects"}
    </div>
  );
}

function DivergencePill({ show }) {
  if (!show) return null;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20, margin: "6px 0",
      background: "rgba(200,150,0,0.1)", border: "1px solid rgba(200,150,0,0.25)",
      fontSize: 10, color: "rgba(180,130,0,0.9)",
    }}>
      ↕ May not yet align
    </div>
  );
}

function WriterField({ value, onChange, placeholder, multiline, rows = 3 }) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "var(--bg-surface)", border: "1px solid var(--border-default)",
          borderRadius: 5, padding: "8px 10px",
          fontSize: 12.5, color: "var(--text-primary)",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.6, resize: "vertical", outline: "none",
        }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent-green)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; }}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", boxSizing: "border-box",
        background: "var(--bg-surface)", border: "1px solid var(--border-default)",
        borderRadius: 5, padding: "8px 10px",
        fontSize: 12.5, color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        outline: "none",
      }}
      onFocus={(e) => { e.target.style.borderColor = "var(--accent-green)"; }}
      onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; }}
    />
  );
}

function AIReadingField({ value, onRefresh, refreshing, multiline }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        background: "var(--bg-muted)", border: "1px solid var(--border-subtle)",
        borderRadius: 5, padding: "8px 10px",
        fontSize: 12, color: "var(--text-tertiary)",
        fontStyle: "italic", lineHeight: 1.6,
        minHeight: multiline ? 72 : 38,
        whiteSpace: "pre-wrap",
      }}>
        {refreshing ? (
          <span style={{ color: "var(--text-muted)" }}>Reading script…</span>
        ) : value ? value : (
          <span style={{ color: "var(--text-placeholder)" }}>Click ↻ to generate</span>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        style={{
          position: "absolute", top: 6, right: 8,
          background: "none", border: "none",
          fontSize: 12, color: "var(--text-muted)", cursor: "pointer",
          padding: "0 2px", lineHeight: 1,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        title="Refresh AI reading"
      >
        ↻
      </button>
    </div>
  );
}

function TwoCol({ isThinking, left, right }) {
  if (isThinking) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {left}{right}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {left}{right}
    </div>
  );
}

// ── Main ScriptBible component ───────────────────────────────────────────────
export default function ScriptBible({ bible, onChange, mode = "thinking" }) {
  const [refreshing, setRefreshing] = useState({});
  const [expandedChars, setExpandedChars] = useState({});

  const handleWriterChange = (field, value) => {
    onChange({ ...bible, [field]: { ...bible[field], writer: value } });
  };

  const handleActChange = (act, value) => {
    onChange({
      ...bible,
      actBreakdown: {
        ...bible.actBreakdown,
        [act]: { ...bible.actBreakdown[act], writer: value },
      },
    });
  };

  const handleRefresh = (field, placeholderKey) => {
    setRefreshing(r => ({ ...r, [field]: true }));
    setTimeout(() => {
      const reading = AI_PLACEHOLDERS[placeholderKey] || AI_PLACEHOLDERS[field] || "";
      if (field.startsWith("act")) {
        onChange({
          ...bible,
          actBreakdown: {
            ...bible.actBreakdown,
            [field]: { ...bible.actBreakdown[field], aiReading: reading },
          },
        });
      } else {
        onChange({ ...bible, [field]: { ...bible[field], aiReading: reading } });
      }
      setRefreshing(r => ({ ...r, [field]: false }));
    }, 600 + Math.random() * 200);
  };

  const handleCharWriterChange = (name, subfield, value) => {
    onChange({
      ...bible,
      characters: {
        ...bible.characters,
        [name]: { ...bible.characters[name], [subfield]: value },
      },
    });
  };

  const handleCharRefresh = (name) => {
    const key = `char_${name}`;
    setRefreshing(r => ({ ...r, [key]: true }));
    setTimeout(() => {
      onChange({
        ...bible,
        characters: {
          ...bible.characters,
          [name]: { ...bible.characters[name], aiReading: AI_PLACEHOLDERS.characters[name] || "This character is developing — more scenes needed before a full read is possible." },
        },
      });
      setRefreshing(r => ({ ...r, [key]: false }));
    }, 600 + Math.random() * 200);
  };

  const addWorldFact = () => {
    onChange({ ...bible, worldFacts: [...bible.worldFacts, ""] });
  };

  const updateWorldFact = (i, val) => {
    const updated = [...bible.worldFacts];
    updated[i] = val;
    onChange({ ...bible, worldFacts: updated });
  };

  const deleteWorldFact = (i) => {
    onChange({ ...bible, worldFacts: bible.worldFacts.filter((_, idx) => idx !== i) });
  };

  const sectionGap = 28;
  const isThinking = mode === "thinking";

  return (
    <div style={{ padding: isThinking ? "24px 32px" : "16px 20px", overflowY: "auto", height: "100%" }}>

      {/* ── Logline ── */}
      <div style={{ marginBottom: sectionGap }}>
        <SectionHeader label="Logline" />
        <TwoCol
          isThinking={isThinking}
          left={
            <div>
              <FieldLabel variant="writer" />
              <WriterField
                value={bible.logline.writer}
                onChange={(v) => handleWriterChange("logline", v)}
                placeholder="What is your script about in one sentence?"
              />
            </div>
          }
          right={
            <div>
              <FieldLabel variant="ai" />
              <AIReadingField
                value={bible.logline.aiReading}
                onRefresh={() => handleRefresh("logline", "logline")}
                refreshing={!!refreshing["logline"]}
              />
              {bible.logline.writer && bible.logline.aiReading && <DivergencePill show />}
            </div>
          }
        />
      </div>

      {/* ── Genre & Style ── */}
      <div style={{ marginBottom: sectionGap }}>
        <SectionHeader label="Genre & Style" />
        <TwoCol
          isThinking={isThinking}
          left={
            <div>
              <FieldLabel variant="writer" />
              <WriterField
                value={bible.genre.writer}
                onChange={(v) => handleWriterChange("genre", v)}
                placeholder="e.g. Slow-burn neo-noir. Tone references: Chinatown, Minari, early Fincher."
              />
            </div>
          }
          right={
            <div>
              <FieldLabel variant="ai" />
              <AIReadingField
                value={bible.genre.aiReading}
                onRefresh={() => handleRefresh("genre", "genre")}
                refreshing={!!refreshing["genre"]}
              />
              {bible.genre.writer && bible.genre.aiReading && <DivergencePill show />}
            </div>
          }
        />
      </div>

      {/* ── Themes ── */}
      <div style={{ marginBottom: sectionGap }}>
        <SectionHeader label="Intended Themes" />
        <TwoCol
          isThinking={isThinking}
          left={
            <div>
              <FieldLabel variant="writer" />
              <WriterField
                value={bible.themes.writer}
                onChange={(v) => handleWriterChange("themes", v)}
                placeholder="What is this story really about beneath the surface?"
                multiline rows={3}
              />
            </div>
          }
          right={
            <div>
              <FieldLabel variant="ai" />
              <AIReadingField
                value={bible.themes.aiReading}
                onRefresh={() => handleRefresh("themes", "themes")}
                refreshing={!!refreshing["themes"]}
                multiline
              />
              {bible.themes.writer && bible.themes.aiReading && <DivergencePill show />}
            </div>
          }
        />
      </div>

      {/* ── Synopsis ── */}
      <div style={{ marginBottom: sectionGap }}>
        <SectionHeader label="Synopsis" />
        <TwoCol
          isThinking={isThinking}
          left={
            <div>
              <FieldLabel variant="writer" />
              <WriterField
                value={bible.synopsis.writer}
                onChange={(v) => handleWriterChange("synopsis", v)}
                placeholder="Summarize the full story as you intend it — beginning, middle, end."
                multiline rows={4}
              />
            </div>
          }
          right={
            <div>
              <FieldLabel variant="ai" />
              <AIReadingField
                value={bible.synopsis.aiReading}
                onRefresh={() => handleRefresh("synopsis", "synopsis")}
                refreshing={!!refreshing["synopsis"]}
                multiline
              />
              {bible.synopsis.writer && bible.synopsis.aiReading && <DivergencePill show />}
            </div>
          }
        />
      </div>

      {/* ── Act Breakdown ── */}
      <div style={{ marginBottom: sectionGap }}>
        <SectionHeader label="Act Breakdown" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "act1", label: "Act 1" },
            { key: "act2", label: "Act 2" },
            { key: "act3", label: "Act 3" },
          ].map(({ key, label }) => (
            <div key={key}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>{label}</div>
              <TwoCol
                isThinking={isThinking}
                left={
                  <div>
                    <FieldLabel variant="writer" />
                    <WriterField
                      value={bible.actBreakdown[key].writer}
                      onChange={(v) => handleActChange(key, v)}
                      placeholder="What happens in this act? What's the turning point?"
                      multiline rows={3}
                    />
                  </div>
                }
                right={
                  <div>
                    <FieldLabel variant="ai" />
                    <AIReadingField
                      value={bible.actBreakdown[key].aiReading}
                      onRefresh={() => handleRefresh(key, key)}
                      refreshing={!!refreshing[key]}
                      multiline
                    />
                    {bible.actBreakdown[key].writer && bible.actBreakdown[key].aiReading && <DivergencePill show />}
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Characters ── */}
      <div style={{ marginBottom: sectionGap }}>
        <SectionHeader label="Characters" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(bible.characters).map(([name, char]) => {
            const isExpanded = expandedChars[name];
            const charRefreshKey = `char_${name}`;
            return (
              <div key={name} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                borderRadius: 6, overflow: "hidden",
              }}>
                <button
                  onClick={() => setExpandedChars(p => ({ ...p, [name]: !p[name] }))}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "10px 14px",
                    background: "transparent", border: "none", cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-panel)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono-ui)" }}>{name}</span>
                    {char.role && <span style={{ fontSize: 10, color: "var(--text-label)", padding: "1px 7px", background: "var(--bg-canvas)", borderRadius: 10 }}>{char.role}</span>}
                  </div>
                  <span style={{ fontSize: 10, color: "var(--text-placeholder)" }}>{isExpanded ? "▴" : "▾"}</span>
                </button>

                {isExpanded && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--bg-canvas)" }}>
                    <div style={{ marginTop: 12 }}>
                      <FieldLabel variant="writer" />
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                          { key: "role", label: "Role", placeholder: "e.g. Protagonist, Antagonist, Foil" },
                          { key: "want", label: "Want", placeholder: "What does this character consciously want?" },
                          { key: "need", label: "Need", placeholder: "What do they actually need, beneath the want?" },
                          { key: "wound", label: "Wound", placeholder: "What happened to them that shapes how they move through the world?" },
                          { key: "voice", label: "Voice notes", placeholder: "How do they speak? Any specific patterns, tics, vocabulary?" },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key}>
                            <div style={{ fontSize: 10, color: "var(--text-label)", marginBottom: 3 }}>{label}</div>
                            <WriterField
                              value={char[key] || ""}
                              onChange={(v) => handleCharWriterChange(name, key, v)}
                              placeholder={placeholder}
                              multiline={key === "voice" || key === "wound"}
                              rows={2}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <FieldLabel variant="ai" />
                      <AIReadingField
                        value={char.aiReading || ""}
                        onRefresh={() => handleCharRefresh(name)}
                        refreshing={!!refreshing[charRefreshKey]}
                        multiline
                      />
                      {(char.want || char.need) && char.aiReading && <DivergencePill show />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── World-Building Facts ── */}
      <div style={{ marginBottom: sectionGap }}>
        <SectionHeader label="World-Building Facts" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {bible.worldFacts.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-placeholder)", fontStyle: "italic", padding: "8px 0" }}>
              No facts added yet. Add anything that must stay consistent — time period, rules, history.
            </div>
          )}
          {bible.worldFacts.map((fact, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-placeholder)", flexShrink: 0 }} />
              <input
                value={fact}
                onChange={(e) => updateWorldFact(i, e.target.value)}
                placeholder="e.g. Set in present-day Detroit, winter"
                style={{
                  flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                  borderRadius: 4, padding: "6px 10px", fontSize: 12,
                  color: "var(--text-primary)", fontFamily: "var(--font-sans)", outline: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent-green)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; }}
              />
              <button
                onClick={() => deleteWorldFact(i)}
                style={{ background: "none", border: "none", color: "var(--text-placeholder)", cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1, transition: "color 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-placeholder)"; }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addWorldFact}
          style={{
            fontSize: 11, color: "var(--text-label)", background: "transparent",
            border: "1px dashed var(--text-placeholder)", borderRadius: 4, padding: "5px 12px",
            cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "#999999"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-label)"; e.currentTarget.style.borderColor = "var(--text-placeholder)"; }}
        >
          + Add fact
        </button>
      </div>

    </div>
  );
}
