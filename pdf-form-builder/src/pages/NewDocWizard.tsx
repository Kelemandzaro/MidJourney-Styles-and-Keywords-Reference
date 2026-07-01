import { useState } from 'react';
import type { PageSize } from '../schema/types';

interface Props {
  onCreate: (pageSize: PageSize, title: string) => void;
  onBack: () => void;
}

interface PageSizeOption {
  id: string;
  label: string;
  sub: string;
  w: number;
  h: number;
}

const PAGE_SIZES: PageSizeOption[] = [
  { id: 'letter', label: 'US Letter', sub: '8.5 × 11 in',  w: 612, h: 792 },
  { id: 'a4',     label: 'A4',        sub: '210 × 297 mm', w: 595, h: 842 },
  { id: 'legal',  label: 'Legal',     sub: '8.5 × 14 in',  w: 612, h: 1008 },
  { id: 'custom', label: 'Custom',    sub: 'Enter dimensions', w: 612, h: 792 },
];

export default function NewDocWizard({ onCreate, onBack }: Props) {
  const [selectedId, setSelectedId] = useState<string>('letter');
  const [title, setTitle] = useState('Untitled Form');
  const [customW, setCustomW] = useState(612);
  const [customH, setCustomH] = useState(792);

  const selected = PAGE_SIZES.find(p => p.id === selectedId)!;

  function handleCreate() {
    const pageSize: PageSize =
      selectedId === 'custom'
        ? { w: customW, h: customH }
        : { w: selected.w, h: selected.h };
    onCreate(pageSize, title);
  }

  return (
    <div className="wizard-backdrop">
      <div className="wizard-card">
        <button className="wizard-back" onClick={onBack}>← Back</button>

        <h2 className="wizard-title">New Document</h2>
        <p className="wizard-sub">Choose a page size to get started</p>

        <label className="wizard-label">Document title</label>
        <input
          className="wizard-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Untitled Form"
        />

        <label className="wizard-label" style={{ marginTop: 20 }}>Page size</label>
        <div className="wizard-sizes">
          {PAGE_SIZES.map(p => (
            <button
              key={p.id}
              className={`wizard-size-card${selectedId === p.id ? ' active' : ''}`}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="wizard-size-icon">
                <PageIcon ratio={p.h / p.w} />
              </div>
              <div className="wizard-size-label">{p.label}</div>
              <div className="wizard-size-sub">{p.sub}</div>
            </button>
          ))}
        </div>

        {selectedId === 'custom' && (
          <div className="wizard-custom">
            <div className="wizard-custom-row">
              <label>Width (pt)</label>
              <input
                type="number"
                value={customW}
                min={100}
                max={2000}
                onChange={e => setCustomW(Number(e.target.value))}
              />
            </div>
            <div className="wizard-custom-row">
              <label>Height (pt)</label>
              <input
                type="number"
                value={customH}
                min={100}
                max={3000}
                onChange={e => setCustomH(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <button className="wizard-create" onClick={handleCreate}>
          Create Document →
        </button>
      </div>
    </div>
  );
}

function PageIcon({ ratio }: { ratio: number }) {
  const w = 28;
  const h = Math.round(w * Math.min(ratio, 2));
  return (
    <div style={{
      width: w, height: h,
      background: '#fff',
      border: '1.5px solid #D5DEEC',
      borderRadius: 2,
      boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
    }} />
  );
}
