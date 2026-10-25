import React from 'react';
import { useFamilyStore } from '../store/useFamilyStore';

export const QsVePanel: React.FC = () => {
  const { qsVeReport, applyVeAlternative } = useFamilyStore();
  const { baseline, alternatives } = qsVeReport;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: '#0f172a', padding: 10, borderRadius: 8, border: '1px solid #1e293b' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>5D Installed CapEx</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>${baseline.totalCapExUsd.toFixed(2)}</div>
        </div>
        <div style={{ background: '#0f172a', padding: 10, borderRadius: 8, border: '1px solid #1e293b' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>30-Yr Whole-Life Cost</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#a855f7' }}>${baseline.wholeLifeCost30YrUsd.toFixed(2)}</div>
        </div>
      </div>
      {alternatives.map((alt) => (
        <div key={alt.id} style={{ border: '1px solid #334155', borderRadius: 6, padding: 10, background: '#111827' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 12 }}>{alt.title}</strong>
            <span style={{ fontSize: 11, color: '#6ee7b7' }}>VI: {alt.valueIndex}x</span>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0' }}>{alt.rationale}</p>
          <button onClick={() => applyVeAlternative(alt)} style={{ padding: '5px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
            Apply VE (Save ${alt.capExSavingsUsd.toFixed(2)})
          </button>
        </div>
      ))}
    </div>
  );
};