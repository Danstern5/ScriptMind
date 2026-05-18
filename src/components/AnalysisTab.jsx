import { useState } from 'react';
import { analysisCards } from '../demo/analysis';
import { useDemo } from '../demo/demoState.jsx';
import ScenarioCard from './ScenarioCard';

export default function AnalysisTab({ onDiscuss }) {
  const { branch } = useDemo();
  const baseCards = analysisCards[branch];

  const [cardState, setCardState] = useState(() =>
    baseCards.map(() => ({ impactOpen: false, previewOpen: false }))
  );

  const exploringLabel = branch === 'invest'
    ? 'Exploring: what if Nolan had passed?'
    : 'Exploring: what if Nolan had invested?';

  const toggle = (i, field) =>
    setCardState((prev) =>
      prev.map((s, idx) => idx === i ? { ...s, [field]: !s[field] } : s)
    );

  const handleDiscuss = (i) => {
    onDiscuss(baseCards[i].discussPrompt, baseCards[i].discussResponse);
  };

  const scenarios = baseCards.map((card, i) => ({
    ...card,
    impactOpen: cardState[i]?.impactOpen ?? false,
    previewOpen: cardState[i]?.previewOpen ?? false,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
      <div style={{
        padding: '10px 16px',
        fontFamily: 'var(--font-mono-ui)',
        fontSize: 11,
        color: 'var(--text-muted)',
        letterSpacing: '0.04em',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        {exploringLabel}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12 }}>
        {scenarios.map((scenario, i) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            index={i}
            onToggleImpact={() => toggle(i, 'impactOpen')}
            onTogglePreview={() => toggle(i, 'previewOpen')}
            onDiscuss={() => handleDiscuss(i)}
          />
        ))}
      </div>
    </div>
  );
}
