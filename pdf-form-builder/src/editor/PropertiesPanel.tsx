import { useDocStore } from '../store/useDocStore';
import type { DocElement, FieldType, TextAlign, FontRef, ImageElement } from '../schema/types';

// ── Shared input primitives ───────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="prop-row">
      <span className="prop-label">{label}</span>
      <div className="prop-control">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      className="prop-num"
      value={Math.round(value * 10) / 10}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="prop-color-wrap">
      <input type="color" className="prop-color" value={value} onChange={e => onChange(e.target.value)} />
      <span className="prop-color-hex">{value.toUpperCase()}</span>
    </div>
  );
}

function SelectInput({
  value, options, onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select className="prop-select" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function CheckboxInput({ value, label, onChange }: { value: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <label className="prop-checkbox">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="prop-section-title">{children}</div>;
}

function Divider() {
  return <div className="prop-divider" />;
}

// ── Per-element property editors ─────────────────────────────────────────────

function BoundsSection({ el, commit }: { el: DocElement & { x: number; y: number; w: number; h: number }; commit: (p: Partial<DocElement>) => void }) {
  return (
    <>
      <SectionTitle>Position & Size</SectionTitle>
      <div className="prop-grid-2">
        <Row label="X"><NumInput value={el.x} onChange={v => commit({ x: v } as Partial<DocElement>)} /></Row>
        <Row label="Y"><NumInput value={el.y} onChange={v => commit({ y: v } as Partial<DocElement>)} /></Row>
        <Row label="W"><NumInput value={el.w} onChange={v => commit({ w: v } as Partial<DocElement>)} /></Row>
        <Row label="H"><NumInput value={el.h} onChange={v => commit({ h: v } as Partial<DocElement>)} /></Row>
      </div>
    </>
  );
}

function RectProps({ el, commit }: { el: Extract<DocElement, { type: 'rect' }>; commit: (p: Partial<typeof el>) => void }) {
  return (
    <>
      <BoundsSection el={el} commit={commit as (p: Partial<DocElement>) => void} />
      <Divider />
      <SectionTitle>Style</SectionTitle>
      <Row label="Fill"><ColorInput value={el.fill ?? '#FFFFFF'} onChange={v => commit({ fill: v })} /></Row>
      <Row label="Stroke"><ColorInput value={el.stroke ?? '#000000'} onChange={v => commit({ stroke: v })} /></Row>
      <Row label="Stroke W"><NumInput value={el.strokeWidth ?? 1} onChange={v => commit({ strokeWidth: v })} /></Row>
      <Row label="Radius"><NumInput value={el.radius ?? 0} onChange={v => commit({ radius: v })} /></Row>
    </>
  );
}

function TextProps({ el, commit }: { el: Extract<DocElement, { type: 'text' }>; commit: (p: Partial<typeof el>) => void }) {
  return (
    <>
      <BoundsSection el={el} commit={commit as (p: Partial<DocElement>) => void} />
      <Divider />
      <SectionTitle>Text</SectionTitle>
      <Row label="Content">
        <textarea
          className="prop-textarea"
          value={el.content}
          onChange={e => commit({ content: e.target.value })}
        />
      </Row>
      <Row label="Size"><NumInput value={el.size} onChange={v => commit({ size: v })} /></Row>
      <Row label="Color"><ColorInput value={el.color} onChange={v => commit({ color: v })} /></Row>
      <Row label="Font">
        <SelectInput
          value={el.fontRef ?? 'body'}
          options={[{ value: 'body', label: 'Inter (body)' }, { value: 'heading', label: 'Poppins (heading)' }]}
          onChange={v => commit({ fontRef: v as FontRef })}
        />
      </Row>
      <Row label="Weight">
        <SelectInput
          value={el.weight ?? 'normal'}
          options={[{ value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Bold' }]}
          onChange={v => commit({ weight: v as 'normal' | 'bold' })}
        />
      </Row>
      <Row label="Align">
        <SelectInput
          value={el.align ?? 'left'}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
          onChange={v => commit({ align: v as TextAlign })}
        />
      </Row>
    </>
  );
}

function LineProps({ el, commit }: { el: Extract<DocElement, { type: 'line' }>; commit: (p: Partial<typeof el>) => void }) {
  return (
    <>
      <SectionTitle>Line</SectionTitle>
      <div className="prop-grid-2">
        <Row label="X1"><NumInput value={el.x1} onChange={v => commit({ x1: v })} /></Row>
        <Row label="Y1"><NumInput value={el.y1} onChange={v => commit({ y1: v })} /></Row>
        <Row label="X2"><NumInput value={el.x2} onChange={v => commit({ x2: v })} /></Row>
        <Row label="Y2"><NumInput value={el.y2} onChange={v => commit({ y2: v })} /></Row>
      </div>
      <Divider />
      <Row label="Color"><ColorInput value={el.stroke} onChange={v => commit({ stroke: v })} /></Row>
      <Row label="Width"><NumInput value={el.width} onChange={v => commit({ width: v })} /></Row>
    </>
  );
}

function FieldProps({ el, commit }: { el: Extract<DocElement, { type: 'field' }>; commit: (p: Partial<typeof el>) => void }) {
  return (
    <>
      <BoundsSection el={el} commit={commit as (p: Partial<DocElement>) => void} />
      <Divider />
      <SectionTitle>Field</SectionTitle>
      <Row label="Name">
        <input
          className="prop-text"
          value={el.name}
          onChange={e => commit({ name: e.target.value })}
          placeholder="acroform_key"
        />
      </Row>
      <Row label="Type">
        <SelectInput
          value={el.fieldType}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'textarea', label: 'Textarea' },
            { value: 'date', label: 'Date' },
            { value: 'checkbox', label: 'Checkbox' },
            { value: 'dropdown', label: 'Dropdown' },
            { value: 'signature', label: 'Signature' },
            { value: 'currency', label: 'Currency' },
            { value: 'number', label: 'Number' },
          ]}
          onChange={v => commit({ fieldType: v as FieldType })}
        />
      </Row>
      <Row label="Label">
        <input className="prop-text" value={el.label ?? ''} onChange={e => commit({ label: e.target.value })} />
      </Row>
      <Row label="Placeholder">
        <input className="prop-text" value={el.placeholder ?? ''} onChange={e => commit({ placeholder: e.target.value })} />
      </Row>
      <Row label="">
        <CheckboxInput value={el.required ?? false} label="Required" onChange={v => commit({ required: v })} />
      </Row>
      {el.fieldType === 'dropdown' && (
        <Row label="Options">
          <textarea
            className="prop-textarea"
            value={(el.options ?? []).join('\n')}
            placeholder="One option per line"
            onChange={e => commit({ options: e.target.value.split('\n') })}
            onBlur={e => commit({ options: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
          />
        </Row>
      )}
      <Divider />
      <SectionTitle>Box Style</SectionTitle>
      <Row label="Fill"><ColorInput value={el.boxStyle.fill} onChange={v => commit({ boxStyle: { ...el.boxStyle, fill: v } })} /></Row>
      <Row label="Stroke"><ColorInput value={el.boxStyle.stroke} onChange={v => commit({ boxStyle: { ...el.boxStyle, stroke: v } })} /></Row>
      <Row label="Radius"><NumInput value={el.boxStyle.radius} onChange={v => commit({ boxStyle: { ...el.boxStyle, radius: v } })} /></Row>
      <Divider />
      <SectionTitle>Widget Style</SectionTitle>
      <Row label="Font size"><NumInput value={el.widgetStyle.size} onChange={v => commit({ widgetStyle: { ...el.widgetStyle, size: v } })} /></Row>
      <Row label="Color"><ColorInput value={el.widgetStyle.color} onChange={v => commit({ widgetStyle: { ...el.widgetStyle, color: v } })} /></Row>
      <Row label="Align">
        <SelectInput
          value={el.widgetStyle.align ?? 'left'}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
          onChange={v => commit({ widgetStyle: { ...el.widgetStyle, align: v as TextAlign } })}
        />
      </Row>
      <Row label="Padding"><NumInput value={el.widgetStyle.padding ?? 8} onChange={v => commit({ widgetStyle: { ...el.widgetStyle, padding: v } })} /></Row>
    </>
  );
}

function ImageProps({ el, commit }: { el: ImageElement; commit: (p: Partial<ImageElement>) => void }) {
  return (
    <>
      <BoundsSection el={el} commit={commit as (p: Partial<DocElement>) => void} />
      <Divider />
      <SectionTitle>Image Placeholder</SectionTitle>
      <Row label="Label">
        <input className="prop-text" value={el.label ?? ''} onChange={e => commit({ label: e.target.value })} />
      </Row>
    </>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function PropertiesPanel() {
  const { schema, selectedId, commitUpdate } = useDocStore();
  const el = schema.pages[0].elements.find(e => e.id === selectedId) ?? null;

  if (!el) {
    return (
      <aside className="props-panel">
        <p className="props-empty">Click an element to edit its properties.</p>
      </aside>
    );
  }

  // Commit wrapper: type-safe partial patch with history.
  const commit = (patch: Partial<DocElement>) => commitUpdate(el.id, patch);

  return (
    <aside className="props-panel">
      <div className="props-type-badge">{el.type === 'image' ? 'image placeholder' : el.type}</div>

      {el.type === 'rect'  && <RectProps  el={el} commit={p => commit(p as Partial<DocElement>)} />}
      {el.type === 'text'  && <TextProps  el={el} commit={p => commit(p as Partial<DocElement>)} />}
      {el.type === 'line'  && <LineProps  el={el} commit={p => commit(p as Partial<DocElement>)} />}
      {el.type === 'field' && <FieldProps el={el} commit={p => commit(p as Partial<DocElement>)} />}
      {el.type === 'image' && <ImageProps el={el} commit={p => commit(p as Partial<DocElement>)} />}
    </aside>
  );
}
