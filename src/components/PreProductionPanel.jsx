import { useState } from 'react';
import { shotList, lineDeliveryNotes } from '../demo/preProduction';

function ShotListView() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      {shotList.map((scene) => (
        <div key={scene.sceneId} style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
            {scene.sceneHeading}
          </div>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 100px 100px 1fr 110px 1fr', gap: 12, padding: '4px 12px 8px' }}>
            {['Shot #', 'Movement', 'Framing', 'Description', 'Characters', 'Director Notes'].map(label => (
              <div key={label} style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {scene.shots.map((shot) => (
              <div key={shot.number} style={{ display: 'grid', gridTemplateColumns: '32px 100px 100px 1fr 110px 1fr', gap: 12, alignItems: 'start', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
                {/* Shot # */}
                <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 11, color: 'var(--text-muted)', paddingTop: 1 }}>{String(shot.number).padStart(2, '0')}</div>

                {/* Movement — blue badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, background: 'rgba(100,150,255,0.08)', color: '#6496ff', fontFamily: 'var(--font-mono-ui)', fontSize: 9, letterSpacing: '0.06em', fontWeight: 600, whiteSpace: 'nowrap', height: 'fit-content' }}>{shot.type}</div>

                {/* Framing — green badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.08)', color: 'var(--accent-green)', fontFamily: 'var(--font-mono-ui)', fontSize: 9, letterSpacing: '0.06em', fontWeight: 600, whiteSpace: 'nowrap', height: 'fit-content' }}>{shot.framing}</div>

                {/* Description */}
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{shot.description}</div>

                {/* Characters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {shot.characters.length === 0
                    ? <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: 'var(--text-muted)' }}>—</span>
                    : shot.characters.map(c => <span key={c} style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>{c.toUpperCase()}</span>)
                  }
                </div>

                {/* Director Notes */}
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>{shot.notes}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CharacterSheetsView({ scriptBible }) {
  const characterEntries = Object.entries(scriptBible?.characters ?? {});
  const [selectedName, setSelectedName] = useState(characterEntries[0]?.[0] ?? null);
  const char = selectedName ? scriptBible.characters[selectedName] : null;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* Left sidebar */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', padding: '16px 0' }}>
        {characterEntries.map(([name, c]) => (
          <button key={name} onClick={() => setSelectedName(name)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: selectedName === name ? 'rgba(74,222,128,0.06)' : 'transparent', borderLeft: selectedName === name ? '2px solid var(--accent-green)' : '2px solid transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              {c.photo && <img src={c.photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }} />}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: selectedName === name ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600 }}>{name.split(' ')[0].toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: 'var(--text-muted)' }}>{name.split(' ').slice(1).join(' ').toUpperCase()}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Right panel */}
      {char && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: 720 }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 28, alignItems: 'flex-start' }}>
            <div style={{ width: 110, height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)', flexShrink: 0, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {char.photo && <img src={char.photo} alt={selectedName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
            </div>
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>{selectedName}</div>
              <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{char.role}</div>
              {char.age && <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>Age {char.age}</div>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(char.scenes ?? []).map(s => (
                  <span key={s} style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: 'var(--accent-green)', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4, padding: '2px 8px' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Core fields */}
          {[
            { label: 'Physical Description', value: char.physicalDescription },
            { label: 'Personality',          value: char.personality },
            { label: 'Want',                 value: char.want },
            { label: 'Need',                 value: char.need },
            { label: 'Wound',                value: char.wound },
            { label: 'Voice Notes',          value: char.voice },
            { label: 'Character Arc',        value: char.arc },
          ].filter(f => f.value).map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, paddingBottom: 5, borderBottom: '1px solid var(--border-subtle)' }}>{label}</div>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{value}</p>
            </div>
          ))}

          {/* All lines */}
          {char.lines?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid var(--border-subtle)' }}>All Lines</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {char.lines.map((entry, i) => (
                  <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: 'var(--accent-green)', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 3, padding: '1px 6px' }}>{entry.scene}</span>
                      <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>{entry.context}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-screenplay)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{entry.line}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LineDeliveryView() {
  const [filter, setFilter] = useState(null);

  const CHAR_COLORS = {
    'MAYA':  { color: 'var(--accent-green)', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.3)' },
    'JAMIE': { color: '#6496ff',             bg: 'rgba(100,150,255,0.08)', border: 'rgba(100,150,255,0.3)' },
    'NOLAN': { color: '#ffa050',             bg: 'rgba(255,160,80,0.08)',  border: 'rgba(255,160,80,0.3)' },
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)', marginBottom: 4 }}>Line Delivery Notes</div>
      <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Voice direction for UNDERSTUDY — all variants</div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>Filter:</span>
        <button onClick={() => setFilter(null)} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${!filter ? 'var(--text-secondary)' : 'var(--border-subtle)'}`, background: !filter ? 'var(--bg-elevated)' : 'transparent', color: !filter ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'var(--font-mono-ui)', fontSize: 10, cursor: 'pointer', transition: 'all 0.15s' }}>All</button>
        {Object.entries(CHAR_COLORS).map(([char, style]) => {
          const isActive = filter === char;
          return (
            <button key={char} onClick={() => setFilter(isActive ? null : char)} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${isActive ? style.border : 'var(--border-subtle)'}`, background: isActive ? style.bg : 'transparent', color: isActive ? style.color : 'var(--text-muted)', fontFamily: 'var(--font-mono-ui)', fontSize: 10, cursor: 'pointer', transition: 'all 0.15s' }}>
              {char}
            </button>
          );
        })}
      </div>

      {lineDeliveryNotes.map((section) => {
        const filteredLines = filter ? section.lines.filter(l => l.character === filter) : section.lines;
        if (filteredLines.length === 0) return null;
        return (
          <div key={section.section} style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 0', marginBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              {section.section}
            </div>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', marginBottom: 6 }}>
              {['Character', 'Line', 'Delivery Note'].map(label => (
                <div key={label} style={{ padding: '4px 14px', fontFamily: 'var(--font-mono-ui)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredLines.map((entry, i) => {
                const charStyle = CHAR_COLORS[entry.character] || { color: 'var(--text-muted)' };
                return (
                  <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden', display: 'grid', gridTemplateColumns: '90px 1fr 1fr' }}>
                    <div style={{ padding: '12px 14px', borderRight: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, fontWeight: 700, color: charStyle.color, letterSpacing: '0.06em' }}>{entry.character}</span>
                    </div>
                    <div style={{ padding: '12px 14px', borderRight: '1px solid var(--border-subtle)', fontFamily: 'var(--font-screenplay)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {entry.line}
                    </div>
                    <div style={{ padding: '12px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.55, fontStyle: 'italic' }}>
                      {entry.note}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SUB_TABS = [
  { id: 'shotlist', label: 'Shot List' },
  { id: 'charactersheets', label: 'Character Sheets' },
  { id: 'linedelivery', label: 'Line Delivery' },
];

export default function PreProductionPanel({ scriptBible }) {
  const [tab, setTab] = useState('shotlist');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: 'var(--bg-canvas)' }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-default)', flexShrink: 0, padding: '0 16px', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 10, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingRight: 16, borderRight: '1px solid var(--border-subtle)' }}>
          Pre-production
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {SUB_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === id ? '2px solid var(--accent-green)' : '2px solid transparent',
                color: tab === id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono-ui)',
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {tab === 'shotlist' && <ShotListView />}
        {tab === 'charactersheets' && <CharacterSheetsView scriptBible={scriptBible} />}
        {tab === 'linedelivery' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <LineDeliveryView />
          </div>
        )}
      </div>
    </div>
  );
}
