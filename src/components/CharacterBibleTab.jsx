import { useState } from 'react';

const MODELS = ['ChatGPT', 'Midjourney', 'Imagen'];

export default function CharacterBibleTab({ scriptBible, onChange }) {
  const characterEntries = Object.entries(scriptBible?.characters ?? {});
  const [selectedName, setSelectedName] = useState(characterEntries[0]?.[0] ?? null);
  const [generating, setGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Midjourney');

  const char = selectedName ? scriptBible.characters[selectedName] : null;

  const handleLookChange = (name, value) => {
    onChange({
      ...scriptBible,
      characters: {
        ...scriptBible.characters,
        [name]: { ...scriptBible.characters[name], lookDescription: value },
      },
    });
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2200);
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ width: 160, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', padding: '10px 0' }}>
        {characterEntries.map(([name, c]) => {
          const isActive = name === selectedName;
          return (
            <button key={name} onClick={() => setSelectedName(name)} style={{
              width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '10px 8px',
              background: isActive ? 'rgba(74,222,128,0.06)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent-green)' : '2px solid transparent',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: isActive ? '2px solid var(--accent-green)' : '2px solid var(--border-subtle)', flexShrink: 0, background: 'var(--bg-elevated)' }}>
                {c.photo && <img src={c.photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />}
              </div>
              <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                {name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right content */}
      {char && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Profile header */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)', flexShrink: 0, background: 'var(--bg-elevated)' }}>
              {char.photo && <img src={char.photo} alt={selectedName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>{selectedName}</div>
              <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{char.role}</div>
            </div>
          </div>

          {/* Physical description */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Character Description</div>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{char.physicalDescription}</p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', marginBottom: 20 }} />

          {/* Visual Workshop */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>✦ Visual Workshop</div>

            {/* Photo / generation area */}
            <div style={{ marginBottom: 16, width: '100%', height: 260, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {generating ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-green)', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)' }}>Generating with {selectedModel}…</span>
                </div>
              ) : (
                char.photo && <img src={char.photo} alt={selectedName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              )}
            </div>

            {/* Look description */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Look Description</div>
              <textarea
                value={char.lookDescription ?? ''}
                onChange={(e) => handleLookChange(selectedName, e.target.value)}
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 5, padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, resize: 'vertical', outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-green)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; }}
              />
            </div>

            {/* Model picker + generate */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {MODELS.map((model) => (
                <button key={model} onClick={() => setSelectedModel(model)} style={{
                  padding: '4px 10px', borderRadius: 20,
                  border: `1px solid ${selectedModel === model ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                  background: selectedModel === model ? 'rgba(74,222,128,0.08)' : 'transparent',
                  color: selectedModel === model ? 'var(--accent-green)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono-ui)', fontSize: 10, letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.15s',
                }}>{model}</button>
              ))}
              <button onClick={handleGenerate} disabled={generating} style={{
                marginLeft: 'auto', padding: '4px 14px', borderRadius: 4, border: 'none',
                background: generating ? 'var(--bg-elevated)' : 'var(--accent-green)',
                color: generating ? 'var(--text-muted)' : '#000',
                fontFamily: 'var(--font-mono-ui)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              }}>{generating ? 'Generating…' : 'Generate'}</button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}
    </div>
  );
}
