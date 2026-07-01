export interface PageSize {
  w: number;
  h: number;
}

export type FontRef = 'heading' | 'body';
export type TextAlign = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | 'bold';
export type FieldType =
  | 'text'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'date'
  | 'signature'
  | 'currency'
  | 'number';

export interface RectElement {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
}

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  w: number;
  h: number;
  content: string;
  fontRef?: FontRef;
  size: number;
  color: string;
  align?: TextAlign;
  weight?: FontWeight;
}

export interface LineElement {
  id: string;
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  width: number;
}

export interface BoxStyle {
  fill: string;
  stroke: string;
  radius: number;
  innerHighlight?: boolean;
}

export interface WidgetStyle {
  fontRef?: FontRef;
  size: number;
  color: string;
  align?: TextAlign;
  padding?: number;
}

export interface FieldElement {
  id: string;
  type: 'field';
  fieldType: FieldType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  boxStyle: BoxStyle;
  widgetStyle: WidgetStyle;
}

export interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  objectFit?: 'contain' | 'cover';
}

export type DocElement = RectElement | TextElement | LineElement | FieldElement | ImageElement;

export interface DocumentPage {
  id: string;
  elements: DocElement[];
}

export interface DocumentTheme {
  colors: Record<string, string>;
  fonts: Record<FontRef, { family: string }>;
}

export interface DocumentSchema {
  id: string;
  version: number;
  meta: {
    title: string;
    pageSize: PageSize;
    units: 'pt';
    margins: { top: number; right: number; bottom: number; left: number };
  };
  theme: DocumentTheme;
  pages: DocumentPage[];
}
