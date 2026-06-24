import { useState } from 'react';
import DomCanvas from './renderer/DomCanvas';
import { generatePDF } from './renderer/pdfEngine';
import { navionSample } from './schema/navionSample';
import './index.css';

type Mode = 'edit' | 'preview';

export default function App() {
  const [mode, setMode] = useState<Mode>('edit');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setGenerating(true);
    setError(null);
    try {
      const bytes = await generatePDF(navionSample);
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
      {/* Toolbar */}
      <header className="toolbar">
        <div className="toolbar-brand">
          <span className="toolbar-logo">&#9632;</span>
          <span className="toolbar-name">FormCraft</span>
          <span className="toolbar-badge">Phase 0</span>
        </div>

        <div className="toolbar-center">
          <div className="mode-toggle">
            <button
              className={`mode-btn${mode === 'edit' ? ' active' : ''}`}
              onClick={() => setMode('edit')}
            >
              Edit
            </button>
            <button
              className={`mode-btn${mode === 'preview' ? ' active' : ''}`}
              onClick={() => setMode('preview')}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="toolbar-actions">
          {error && <span className="toolbar-error">{error}</span>}
          <button
            className="btn-download"
            onClick={handleDownload}
            disabled={generating}
          >
            {generating ? (
              <span>Generating&hellip;</span>
            ) : (
              <>
                <DownloadIcon />
                Download PDF
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="workspace">
        <div className="canvas-scroll">
          <div className="canvas-wrapper">
            <DomCanvas schema={navionSample} editable={mode === 'edit'} />
          </div>
        </div>

        {/* Right info panel */}
        <aside className="panel">
          <h3 className="panel-title">Document</h3>
          <div className="panel-row">
            <span className="panel-label">Title</span>
            <span className="panel-value">{navionSample.meta.title}</span>
          </div>
          <div className="panel-row">
            <span className="panel-label">Page size</span>
            <span className="panel-value">
              {navionSample.meta.pageSize.w} &times; {navionSample.meta.pageSize.h} pt
            </span>
          </div>
          <div className="panel-row">
            <span className="panel-label">Elements</span>
            <span className="panel-value">{navionSample.pages[0].elements.length}</span>
          </div>

          <div className="panel-divider" />
          <h3 className="panel-title">Fields</h3>
          {navionSample.pages[0].elements
            .filter(el => el.type === 'field')
            .map(el => (
              <div key={el.id} className="panel-row">
                <span className="panel-label field-name">{el.name}</span>
                <span className={`field-badge field-badge--${el.fieldType}`}>
                  {el.fieldType}
                </span>
              </div>
            ))}

          <div className="panel-divider" />
          <h3 className="panel-title">Architecture</h3>
          <p className="panel-note">
            One schema &rarr; two renderers. DOM preview and fillable PDF are both
            driven by the same JSON coordinates. Fields use a{' '}
            <strong>static box + transparent AcroForm widget</strong> pattern so
            rounded corners survive in the PDF.
          </p>
        </aside>
      </main>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{ marginRight: 6, verticalAlign: 'middle' }}
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
