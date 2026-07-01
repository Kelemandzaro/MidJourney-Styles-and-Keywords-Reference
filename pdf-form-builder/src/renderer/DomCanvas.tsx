import React, { useRef } from 'react';
import type {
  DocumentSchema,
  DocElement,
  RectElement,
  TextElement,
  LineElement,
  FieldElement,
  ImageElement,
} from '../schema/types';
import { ptToPx } from './utils';

interface Props {
  schema: DocumentSchema;
  editable?: boolean;
}

// ── Element renderers ────────────────────────────────────────────────────────

function RectEl({ el }: { el: RectElement }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: ptToPx(el.x),
        top: ptToPx(el.y),
        width: ptToPx(el.w),
        height: ptToPx(el.h),
        backgroundColor: el.fill ?? 'transparent',
        borderRadius: el.radius ? ptToPx(el.radius) : 0,
        border: el.stroke ? `${ptToPx(el.strokeWidth ?? 1)}px solid ${el.stroke}` : 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}

function TextEl({ el }: { el: TextElement }) {
  const fontFamily =
    el.fontRef === 'heading' ? "'Poppins', sans-serif" : "'Inter', sans-serif";

  return (
    <div
      style={{
        position: 'absolute',
        left: ptToPx(el.x),
        top: ptToPx(el.y),
        width: ptToPx(el.w),
        height: ptToPx(el.h),
        fontSize: ptToPx(el.size),
        fontFamily,
        fontWeight: el.weight === 'bold' ? 700 : 400,
        color: el.color,
        textAlign: el.align ?? 'left',
        display: 'flex',
        alignItems: 'center',
        lineHeight: 1.2,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {el.align === 'center' ? (
        <span style={{ width: '100%', textAlign: 'center' }}>{el.content}</span>
      ) : (
        el.content
      )}
    </div>
  );
}

function LineEl({ el }: { el: LineElement }) {
  const isHorizontal = el.y1 === el.y2;
  const left = ptToPx(Math.min(el.x1, el.x2));
  const top = ptToPx(Math.min(el.y1, el.y2));
  const width = isHorizontal ? ptToPx(Math.abs(el.x2 - el.x1)) : ptToPx(el.width);
  const height = isHorizontal ? ptToPx(el.width) : ptToPx(Math.abs(el.y2 - el.y1));
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: el.stroke,
      }}
    />
  );
}

function FieldEl({ el, editable }: { el: FieldElement; editable: boolean }) {
  const pad = ptToPx(el.widgetStyle.padding ?? 8);
  const fontFamily =
    el.widgetStyle.fontRef === 'heading' ? "'Poppins', sans-serif" : "'Inter', sans-serif";
  const inputRef = useRef<HTMLInputElement>(null);

  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    left: ptToPx(el.x),
    top: ptToPx(el.y),
    width: ptToPx(el.w),
    height: ptToPx(el.h),
    backgroundColor: el.boxStyle.fill,
    borderRadius: ptToPx(el.boxStyle.radius),
    border: `${ptToPx(0.75)}px solid ${el.boxStyle.stroke}`,
    boxSizing: 'border-box',
    // Inner highlight — a subtle inset shadow that mimics depth
    boxShadow: el.boxStyle.innerHighlight ? 'inset 0 1px 2px rgba(0,0,0,0.06)' : 'none',
    cursor: editable ? 'text' : 'default',
    overflow: 'hidden',
  };

  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    padding: `0 ${pad}px`,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: ptToPx(el.widgetStyle.size),
    fontFamily,
    color: el.widgetStyle.color,
    textAlign: el.widgetStyle.align ?? 'left',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    cursor: editable ? 'text' : 'default',
    pointerEvents: editable ? 'auto' : 'none',
  };

  return (
    <div style={boxStyle} onClick={() => editable && inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type={el.fieldType === 'date' ? 'text' : 'text'}
        placeholder={el.placeholder}
        name={el.name}
        required={el.required}
        readOnly={!editable}
        style={inputStyle}
        aria-label={el.label ?? el.name}
      />
    </div>
  );
}

function ImageEl({ el }: { el: ImageElement }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: ptToPx(el.x),
        top: ptToPx(el.y),
        width: ptToPx(el.w),
        height: ptToPx(el.h),
        border: '2px dashed #A8B8E8',
        borderRadius: 4,
        background: '#F0F4FF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8B8E8" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span style={{ fontSize: 9, color: '#A8B8E8', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: 0.5 }}>
        {el.label ?? 'IMAGE'}
      </span>
    </div>
  );
}

// ── Canvas ───────────────────────────────────────────────────────────────────

export default function DomCanvas({ schema, editable = true }: Props) {
  const { w: pageW, h: pageH } = schema.meta.pageSize;

  return (
    <div
      style={{
        position: 'relative',
        width: ptToPx(pageW),
        height: ptToPx(pageH),
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {schema.pages[0].elements.map(el => renderElement(el, editable))}
    </div>
  );
}

function renderElement(el: DocElement, editable: boolean): React.ReactNode {
  switch (el.type) {
    case 'rect':
      return <RectEl key={el.id} el={el} />;
    case 'text':
      return <TextEl key={el.id} el={el} />;
    case 'line':
      return <LineEl key={el.id} el={el} />;
    case 'field':
      return <FieldEl key={el.id} el={el} editable={editable} />;
    case 'image':
      return <ImageEl key={el.id} el={el} />;
    default:
      return null;
  }
}
