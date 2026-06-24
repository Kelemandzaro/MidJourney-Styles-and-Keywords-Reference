import { useState } from 'react';
import EditorCanvas from './editor/EditorCanvas';
import DomCanvas from './renderer/DomCanvas';
import PropertiesPanel from './editor/PropertiesPanel';
import AddElementPanel from './editor/AddElementPanel';
import { useDocStore } from './store/useDocStore';
import { generatePDF } from './renderer/pdfEngine';
import './index.css';

type Mode = 'edit' | 'preview';

export default function App() {
  const [mode, setMode] = useState<Mode>('edit');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { schema, undo, redo, past, future, deleteSelected, selectedId } = useDocStore();

  const handleDownload = async () => {
    setGenerating(true);
    setError(null);
    try {
      const bytes = await generatePDF(schema);
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'navion-fact-sheet.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="app">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <header className="toolbar">
        <div className="toolbar-brand">
          <span className="toolbar-logo">&#9632;</span>
          <span className="toolbar-name">FormCraft</span>
          <span className="toolbar-badge">Phase 1</span>
        </div>

        <div className="toolbar-center">
          {/* Mode toggle */}
          <div className="mode-toggle">
            <button className={`mode-btn${mode === 'edit' ? ' active' : ''}`} onClick={() => setMode('edit')}>
              Edit
            </button>
            <button className={`mode-btn${mode === 'preview' ? ' active' : ''}`} onClick={() => setMode('preview')}>
              Preview
            </button>
          </div>

          {/* Undo / redo */}
          {mode === 'edit' && (
            <div className="history-btns">
              <button className="hist-btn" onClick={undo} disabled={!past.length} title="Undo (Ctrl+Z)">
                <UndoIcon />
              </button>
              <button className="hist-btn" onClick={redo} disabled={!future.length} title="Redo (Ctrl+Y)">
                <RedoIcon />
              </button>
            </div>
          )}

          {/* Delete selected */}
          {mode === 'edit' && selectedId && (
            <button className="del-btn" onClick={deleteSelected} title="Delete selected (Delete)">
              <TrashIcon /> Delete
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          {error && <span className="toolbar-error">{error}</span>}
          <button className="btn-download" onClick={handleDownload} disabled={generating}>
            {generating ? 'Generating…' : <><DownloadIcon /> Download PDF</>}
          </button>
        </div>
      </header>

      {/* ── Workspace ────────────────────────────────────────────────────── */}
      <div className="workspace">
        {/* Left panel: element picker (edit mode only) */}
        {mode === 'edit' && <AddElementPanel />}

        {/* Canvas area */}
        <main className="canvas-scroll">
          <div className="canvas-wrapper">
            {mode === 'edit' ? (
              <EditorCanvas />
            ) : (
              <DomCanvas schema={schema} editable={true} />
            )}
          </div>
        </main>

        {/* Right panel: properties (edit mode only) */}
        {mode === 'edit' && <PropertiesPanel />}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ marginRight: 6, verticalAlign: 'middle' }}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-.49-3.51" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ marginRight: 4, verticalAlign: 'middle' }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
