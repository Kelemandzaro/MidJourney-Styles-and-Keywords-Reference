import { useDocStore } from '../store/useDocStore';
import type { DocElement } from '../schema/types';

let _idCounter = Date.now();
const uid = () => `el_${(_idCounter++).toString(36)}`;

// Factories for default elements, placed near the top-center of the page.
const defaults = {
  rect: (): DocElement => ({
    id: uid(), type: 'rect',
    x: 160, y: 460, w: 200, h: 80,
    fill: '#EEF2F9', stroke: '#D5DEEC', strokeWidth: 1, radius: 8,
  }),

  text: (): DocElement => ({
    id: uid(), type: 'text',
    x: 160, y: 460, w: 200, h: 28,
    content: 'New text',
    fontRef: 'body', size: 12, color: '#1B2A6B',
    align: 'left', weight: 'normal',
  }),

  line: (): DocElement => ({
    id: uid(), type: 'line',
    x1: 36, y1: 500, x2: 576, y2: 500,
    stroke: '#D5DEEC', width: 1,
  }),

  fieldText: (): DocElement => ({
    id: uid(), type: 'field', fieldType: 'text',
    name: `field_${uid()}`,
    x: 160, y: 460, w: 240, h: 32,
    label: 'New Field', placeholder: 'Enter value',
    required: false,
    boxStyle: { fill: '#EEF2F9', stroke: '#D5DEEC', radius: 8, innerHighlight: true },
    widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
  }),

  fieldDate: (): DocElement => ({
    id: uid(), type: 'field', fieldType: 'date',
    name: `date_${uid()}`,
    x: 160, y: 460, w: 160, h: 32,
    label: 'Date', placeholder: 'MM/DD/YYYY',
    required: false,
    boxStyle: { fill: '#FBF4DD', stroke: '#D5DEEC', radius: 8 },
    widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
  }),

  fieldSig: (): DocElement => ({
    id: uid(), type: 'field', fieldType: 'signature',
    name: `sig_${uid()}`,
    x: 36, y: 460, w: 260, h: 60,
    label: 'Signature', placeholder: 'Sign here',
    required: true,
    boxStyle: { fill: '#F8FAFC', stroke: '#D5DEEC', radius: 8 },
    widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
  }),
};

type ElementKey = keyof typeof defaults;

interface ButtonDef {
  key: ElementKey;
  icon: string;
  label: string;
}

const BUTTONS: ButtonDef[] = [
  { key: 'rect',      icon: '▭', label: 'Rectangle' },
  { key: 'text',      icon: 'T', label: 'Text' },
  { key: 'line',      icon: '—', label: 'Line' },
  { key: 'fieldText', icon: '⌨', label: 'Text field' },
  { key: 'fieldDate', icon: '📅', label: 'Date field' },
  { key: 'fieldSig',  icon: '✍', label: 'Signature' },
];

export default function AddElementPanel() {
  const { addElement } = useDocStore();

  return (
    <aside className="add-panel">
      <div className="add-panel-title">Insert</div>
      {BUTTONS.map(btn => (
        <button
          key={btn.key}
          className="add-btn"
          title={btn.label}
          onClick={() => addElement(defaults[btn.key]())}
        >
          <span className="add-btn-icon">{btn.icon}</span>
          <span className="add-btn-label">{btn.label}</span>
        </button>
      ))}
    </aside>
  );
}
