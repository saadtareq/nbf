import React, { useState } from 'react';
import { EXPORTER_REGISTRY } from '@nexusbim/exporters';
import { useFamilyStore } from './store/useFamilyStore';
import { Viewport3DAnd2D } from './components/Viewport3DAnd2D';
import { QsVePanel } from './components/QsVePanel';

export const App: React.FC = () => {
  const { ast, compiled, setParameterValue, undo, redo } = useFamilyStore();
  const [rightMode, setRightMode] = useState<'qs' | 'gdl'>('qs');

  const triggerDownload = (key: string) => {
    const plugin = EXPORTER_REGISTRY[key];
    if (!plugin) return;
    const blob = new Blob([plugin.exportText(ast)], { type: plugin.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = ast.name + plugin.extension; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 460px', height: '100vh', background: '#090d16', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      <aside style={{ borderRight: '1px solid #1e293b', padding: 16, overflowY: 'auto' }}>
        <h3>NexusBIM 5D Studio</h3>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
        </div>
        {Object.values(ast.parameters).map((param) => (
          <div key={param.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>{param.label}</span><code>{String(param.value)}</code>
            </div>
            {typeof param.value === 'number' && (
              <input type='range' min={param.min} max={param.max} step={param.step} value={param.value} onChange={(e) => setParameterValue(param.id, parseFloat(e.target.value))} style={{ width: '100%' }} />
            )}
          </div>
        ))}
      </aside>
      <main><Viewport3DAnd2D /></main>
      <aside style={{ borderLeft: '1px solid #1e293b', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setRightMode('qs')} style={{ flex: 1, padding: 8 }}>5D QS & VE</button>
          <button onClick={() => setRightMode('gdl')} style={{ flex: 1, padding: 8 }}>GDL & Script_PR</button>
        </div>
        {rightMode === 'qs' ? <QsVePanel /> : <pre style={{ flex: 1, overflow: 'auto', background: '#0f172a', padding: 10, fontSize: 11 }}>{compiled.propertiesScript5D + '\n\n' + compiled.script3d}</pre>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
          <button onClick={() => triggerDownload('qs-boq-csv')}>Export 5D CSV</button>
          <button onClick={() => triggerDownload('ifc4')}>Export 5D IFC4</button>
          <button onClick={() => triggerDownload('lpxml')}>Export LP_XML</button>
          <button onClick={() => triggerDownload('revit-txt')}>Export Catalog TXT</button>
        </div>
      </aside>
    </div>
  );
};