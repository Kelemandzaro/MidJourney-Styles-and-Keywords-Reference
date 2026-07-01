import type { DocElement } from './types';

let _id = Date.now();
const uid = () => `el_${(_id++).toString(36)}`;

// ── Layout ───────────────────────────────────────────────────────────────────

export const tplHeaderBand = (): DocElement[] => [
  {
    id: uid(), type: 'rect',
    x: 0, y: 0, w: 612, h: 80,
    fill: '#1B2A6B', stroke: undefined, strokeWidth: 0, radius: 0,
  },
  {
    id: uid(), type: 'image',
    x: 20, y: 12, w: 100, h: 56,
    label: 'Logo',
  },
  {
    id: uid(), type: 'text',
    x: 140, y: 18, w: 320, h: 44,
    content: 'Document Title',
    fontRef: 'heading', size: 22, color: '#FFFFFF', align: 'left', weight: 'bold',
  },
];

export const tplFooterBar = (): DocElement[] => [
  {
    id: uid(), type: 'rect',
    x: 0, y: 752, w: 612, h: 40,
    fill: '#F3F4F6', stroke: undefined, strokeWidth: 0, radius: 0,
  },
  {
    id: uid(), type: 'text',
    x: 20, y: 758, w: 572, h: 28,
    content: 'Confidential — For authorized use only',
    fontRef: 'body', size: 9, color: '#6B7280', align: 'center', weight: 'normal',
  },
];

export const tplSectionDivider = (): DocElement[] => [
  {
    id: uid(), type: 'rect',
    x: 36, y: 320, w: 540, h: 28,
    fill: '#EEF2F9', stroke: undefined, strokeWidth: 0, radius: 6,
  },
  {
    id: uid(), type: 'text',
    x: 46, y: 322, w: 520, h: 24,
    content: 'Section Title',
    fontRef: 'heading', size: 11, color: '#1B2A6B', align: 'left', weight: 'bold',
  },
];

// ── Visual ───────────────────────────────────────────────────────────────────

export const tplLogoPh = (): DocElement => ({
  id: uid(), type: 'image',
  x: 36, y: 20, w: 120, h: 60,
  label: 'Logo',
});

export const tplRect = (): DocElement => ({
  id: uid(), type: 'rect',
  x: 160, y: 200, w: 200, h: 80,
  fill: '#EEF2F9', stroke: '#D5DEEC', strokeWidth: 1, radius: 8,
});

export const tplLine = (): DocElement => ({
  id: uid(), type: 'line',
  x1: 36, y1: 300, x2: 576, y2: 300,
  stroke: '#D5DEEC', width: 1,
});

export const tplAccentLine = (): DocElement => ({
  id: uid(), type: 'line',
  x1: 36, y1: 300, x2: 576, y2: 300,
  stroke: '#C9A227', width: 2,
});

// ── Text ─────────────────────────────────────────────────────────────────────

export const tplH1 = (): DocElement => ({
  id: uid(), type: 'text',
  x: 36, y: 100, w: 540, h: 40,
  content: 'Heading 1',
  fontRef: 'heading', size: 24, color: '#1B2A6B', align: 'left', weight: 'bold',
});

export const tplH2 = (): DocElement => ({
  id: uid(), type: 'text',
  x: 36, y: 150, w: 540, h: 32,
  content: 'Heading 2',
  fontRef: 'heading', size: 16, color: '#1B2A6B', align: 'left', weight: 'bold',
});

export const tplBodyText = (): DocElement => ({
  id: uid(), type: 'text',
  x: 36, y: 200, w: 540, h: 56,
  content: 'Body copy text goes here. Edit this to add your paragraph content.',
  fontRef: 'body', size: 11, color: '#374151', align: 'left', weight: 'normal',
});

export const tplLabel = (): DocElement => ({
  id: uid(), type: 'text',
  x: 36, y: 200, w: 200, h: 20,
  content: 'Label',
  fontRef: 'body', size: 9, color: '#6B7280', align: 'left', weight: 'bold',
});

export const tplCallout = (): DocElement => ({
  id: uid(), type: 'text',
  x: 36, y: 200, w: 540, h: 36,
  content: 'Important notice or callout text here.',
  fontRef: 'body', size: 13, color: '#C9A227', align: 'center', weight: 'bold',
});

// ── Form fields ───────────────────────────────────────────────────────────────

export const tplFieldText = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'text',
  name: `field_${uid()}`,
  x: 36, y: 250, w: 240, h: 32,
  label: 'Text Field', placeholder: 'Enter value',
  required: false,
  boxStyle: { fill: '#EEF2F9', stroke: '#D5DEEC', radius: 8, innerHighlight: true },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
});

export const tplFieldEmail = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'text',
  name: `email_${uid()}`,
  x: 36, y: 250, w: 240, h: 32,
  label: 'Email', placeholder: 'name@example.com',
  required: false,
  boxStyle: { fill: '#EEF2F9', stroke: '#D5DEEC', radius: 8, innerHighlight: true },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
});

export const tplFieldPhone = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'text',
  name: `phone_${uid()}`,
  x: 36, y: 250, w: 180, h: 32,
  label: 'Phone', placeholder: '(555) 000-0000',
  required: false,
  boxStyle: { fill: '#EEF2F9', stroke: '#D5DEEC', radius: 8, innerHighlight: true },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
});

export const tplFieldDate = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'date',
  name: `date_${uid()}`,
  x: 36, y: 250, w: 160, h: 32,
  label: 'Date', placeholder: 'MM/DD/YYYY',
  required: false,
  boxStyle: { fill: '#FBF4DD', stroke: '#D5DEEC', radius: 8 },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
});

export const tplFieldCurrency = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'currency',
  name: `amount_${uid()}`,
  x: 36, y: 250, w: 140, h: 32,
  label: 'Amount', placeholder: '$0.00',
  required: false,
  boxStyle: { fill: '#EEF2F9', stroke: '#D5DEEC', radius: 8 },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'right', padding: 8 },
});

export const tplFieldTextarea = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'textarea',
  name: `notes_${uid()}`,
  x: 36, y: 250, w: 540, h: 80,
  label: 'Notes', placeholder: 'Add notes here...',
  required: false,
  boxStyle: { fill: '#EEF2F9', stroke: '#D5DEEC', radius: 8 },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
});

export const tplFieldDropdown = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'dropdown',
  name: `select_${uid()}`,
  x: 36, y: 250, w: 200, h: 32,
  label: 'Select', placeholder: 'Choose…',
  required: false,
  options: ['Option A', 'Option B', 'Option C'],
  boxStyle: { fill: '#EEF2F9', stroke: '#D5DEEC', radius: 8 },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
});

export const tplFieldCheckbox = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'checkbox',
  name: `check_${uid()}`,
  x: 36, y: 250, w: 20, h: 20,
  label: 'Checkbox', placeholder: '',
  required: false,
  boxStyle: { fill: '#FFFFFF', stroke: '#D5DEEC', radius: 4 },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 2 },
});

export const tplFieldSignature = (): DocElement => ({
  id: uid(), type: 'field', fieldType: 'signature',
  name: `sig_${uid()}`,
  x: 36, y: 250, w: 260, h: 60,
  label: 'Signature', placeholder: 'Sign here',
  required: true,
  boxStyle: { fill: '#F8FAFC', stroke: '#D5DEEC', radius: 8 },
  widgetStyle: { fontRef: 'body', size: 11, color: '#1B2A6B', align: 'left', padding: 8 },
});

// ── Category structure for PalettePanel ──────────────────────────────────────

export type PaletteGroup = {
  title: string;
  items: PaletteItem[];
};

export type PaletteItem = {
  label: string;
  icon: string;
  multi?: boolean; // spawns multiple elements
  factory: () => DocElement | DocElement[];
};

export const PALETTE: PaletteGroup[] = [
  {
    title: 'Layout',
    items: [
      { label: 'Header Band',    icon: '▬', multi: true,  factory: tplHeaderBand },
      { label: 'Footer Bar',     icon: '▬', multi: true,  factory: tplFooterBar },
      { label: 'Section Divider',icon: '▤', multi: true,  factory: tplSectionDivider },
    ],
  },
  {
    title: 'Text',
    items: [
      { label: 'Heading 1',  icon: 'H1', factory: tplH1 },
      { label: 'Heading 2',  icon: 'H2', factory: tplH2 },
      { label: 'Body Text',  icon: 'T',  factory: tplBodyText },
      { label: 'Label',      icon: 'ab', factory: tplLabel },
      { label: 'Callout',    icon: '!',  factory: tplCallout },
    ],
  },
  {
    title: 'Form Fields',
    items: [
      { label: 'Text Field', icon: '⌨', factory: tplFieldText },
      { label: 'Email',      icon: '@',  factory: tplFieldEmail },
      { label: 'Phone',      icon: '☏',  factory: tplFieldPhone },
      { label: 'Date',       icon: '📅', factory: tplFieldDate },
      { label: 'Currency',   icon: '$',  factory: tplFieldCurrency },
      { label: 'Textarea',   icon: '¶',  factory: tplFieldTextarea },
      { label: 'Dropdown',   icon: '▾',  factory: tplFieldDropdown },
      { label: 'Checkbox',   icon: '☑',  factory: tplFieldCheckbox },
      { label: 'Signature',  icon: '✍',  factory: tplFieldSignature },
    ],
  },
  {
    title: 'Visual',
    items: [
      { label: 'Logo Placeholder', icon: '⬜', factory: tplLogoPh },
      { label: 'Rectangle',        icon: '▭', factory: tplRect },
      { label: 'Line',             icon: '—', factory: tplLine },
      { label: 'Accent Line',      icon: '—', factory: tplAccentLine },
    ],
  },
];
