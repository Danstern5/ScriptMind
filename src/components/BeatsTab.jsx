import { useState, useRef, useCallback, useEffect } from 'react';
import { getBeats } from '../demo/beats';
import { useDemo } from '../demo/demoState.jsx';
import { PlusIcon } from './Icons';

const CARD_WIDTH = 220;
const CANVAS_W = 1800;
const CANVAS_H = 560;

const DOT_GRID_BG = `radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)`;
const DOT_GRID_SIZE = '24px 24px';

export default function BeatsTab() {
  const { branch } = useDemo();
  const [beats, setBeats] = useState(() => getBeats(branch));
  const dragging = useRef(null); // { id, startMouseX, startMouseY, origX, origY }
  const containerRef = useRef(null);

  const onCardMouseDown = useCallback((e, id) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const beat = beats.find(b => b.id === id);
    dragging.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origX: beat.position.x,
      origY: beat.position.y,
    };
  }, [beats]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const { id, startMouseX, startMouseY, origX, origY } = dragging.current;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      setBeats(prev => prev.map(b =>
        b.id === id
          ? { ...b, position: { x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) } }
          : b
      ));
    };
    const onMouseUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []); // dragging.current is a ref — no stale closure

  const addBeat = () => {
    const lastBeat = beats[beats.length - 1];
    const newX = lastBeat ? lastBeat.position.x + 300 : 60;
    const newY = lastBeat ? lastBeat.position.y : 140;
    setBeats(prev => [...prev, {
      id: `beat-new-${Date.now()}`,
      number: prev.length + 1,
      title: 'New Beat',
      sceneHeading: 'INT. LOCATION — DAY',
      characters: [],
      summary: 'Describe what happens in this beat.',
      isBranchPoint: false,
      position: { x: newX, y: newY },
    }]);
  };

  const sorted = [...beats].sort((a, b) => a.position.x - b.position.x);
  const CARD_H = 148;
  const arrows = sorted.slice(0, -1).map((beat, i) => {
    const next = sorted[i + 1];
    const x1 = beat.position.x + CARD_WIDTH;
    const y1 = beat.position.y + CARD_H / 2;
    const x2 = next.position.x;
    const y2 = next.position.y + CARD_H / 2;
    const midX = (x1 + x2) / 2;
    return { id: `arrow-${beat.id}-${next.id}`, x1, y1, x2, y2, midX };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono-ui)',
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Story Beats — drag to rearrange
        </span>
        <button
          onClick={addBeat}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: 'var(--text-label)',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4, padding: '3px 8px',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = '#999'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-label)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <PlusIcon /> Add Beat
        </button>
      </div>

      {/* Scrollable canvas container */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'auto', position: 'relative' }}
      >
        {/* Canvas */}
        <div
          style={{
            position: 'relative',
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundImage: DOT_GRID_BG,
            backgroundSize: DOT_GRID_SIZE,
            backgroundPosition: '12px 12px',
            userSelect: 'none',
          }}
        >
          {/* SVG connector arrows — behind cards */}
          <svg
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: CANVAS_W, height: CANVAS_H,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6" markerHeight="6"
                refX="5" refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill="var(--border-subtle)" />
              </marker>
            </defs>
            {arrows.map(({ id, x1, y1, x2, y2, midX }) => (
              <path
                key={id}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
              />
            ))}
          </svg>

          {/* Beat cards */}
          {beats.map((beat) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              onMouseDown={(e) => onCardMouseDown(e, beat.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BeatCard({ beat, onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: beat.position.x,
        top: beat.position.y,
        width: CARD_WIDTH,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid var(--bg-canvas)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: beat.isBranchPoint ? 5 : 0,
        }}>
          {beat.isBranchPoint
            ? (
              <span style={{
                fontFamily: 'var(--font-mono-ui)',
                fontSize: 9,
                letterSpacing: '0.1em',
                color: 'var(--accent-green)',
                textTransform: 'uppercase',
              }}>
                ◆ Branch
              </span>
            )
            : <span />
          }
          <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: 2 }}>⠿</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono-ui)',
            fontSize: 10,
            color: 'var(--text-muted)',
            minWidth: 16,
          }}>
            {String(beat.number).padStart(2, '0')}
          </span>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}>
            {beat.title}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 12px 10px' }}>
        <div style={{
          fontFamily: 'var(--font-mono-ui)',
          fontSize: 9,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {beat.sceneHeading}
        </div>

        {beat.characters.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 7 }}>
            {beat.characters.map((char) => (
              <span
                key={char}
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono-ui)',
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 3,
                }}
              >
                {char.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        <p style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {beat.summary}
        </p>
      </div>
    </div>
  );
}
