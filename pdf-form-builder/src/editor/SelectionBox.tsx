import { ptToPx } from '../renderer/utils';
import type { DocElement } from '../schema/types';

export type ResizeHandle = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l';

const HANDLE_SIZE = 8; // px

const HANDLES: { id: ResizeHandle; left: string; top: string; cursor: string }[] = [
  { id: 'tl', left: '0',   top: '0',   cursor: 'nw-resize' },
  { id: 't',  left: '50%', top: '0',   cursor: 'n-resize'  },
  { id: 'tr', left: '100%',top: '0',   cursor: 'ne-resize' },
  { id: 'r',  left: '100%',top: '50%', cursor: 'e-resize'  },
  { id: 'br', left: '100%',top: '100%',cursor: 'se-resize' },
  { id: 'b',  left: '50%', top: '100%',cursor: 's-resize'  },
  { id: 'bl', left: '0',   top: '100%',cursor: 'sw-resize' },
  { id: 'l',  left: '0',   top: '50%', cursor: 'w-resize'  },
];

interface Props {
  el: DocElement;
  onResizeHandleMouseDown: (e: React.MouseEvent, handle: ResizeHandle) => void;
}

export function elementBounds(el: DocElement) {
  if (el.type === 'line') {
    const x = Math.min(el.x1, el.x2);
    const y = Math.min(el.y1, el.y2) - 4;
    const w = Math.abs(el.x2 - el.x1);
    const h = el.width + 8;
    return { x, y, w, h };
  }
  return { x: el.x, y: el.y, w: el.w, h: el.h };
}

export default function SelectionBox({ el, onResizeHandleMouseDown }: Props) {
  const { x, y, w, h } = elementBounds(el);

  // Lines don't support resize handles — just show the selection outline.
  const showHandles = el.type !== 'line';

  return (
    <div
      style={{
        position: 'absolute',
        left: ptToPx(x) - 1,
        top: ptToPx(y) - 1,
        width: ptToPx(w) + 2,
        height: ptToPx(h) + 2,
        outline: '2px solid #2563EB',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {showHandles && HANDLES.map(handle => (
        <div
          key={handle.id}
          onMouseDown={e => { e.stopPropagation(); onResizeHandleMouseDown(e, handle.id); }}
          style={{
            position: 'absolute',
            left: handle.left,
            top: handle.top,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            background: '#FFFFFF',
            border: '2px solid #2563EB',
            borderRadius: 2,
            transform: 'translate(-50%, -50%)',
            cursor: handle.cursor,
            pointerEvents: 'auto',
            zIndex: 11,
          }}
        />
      ))}
    </div>
  );
}

// Apply a resize delta (in pt) to an element's bounds.
export function applyResize(
  el: { x: number; y: number; w: number; h: number },
  handle: ResizeHandle,
  dx: number,
  dy: number,
): { x: number; y: number; w: number; h: number } {
  let { x, y, w, h } = el;
  const MIN = 8;

  if (handle === 'tl' || handle === 'bl' || handle === 'l') { x += dx; w -= dx; }
  if (handle === 'tr' || handle === 'br' || handle === 'r') { w += dx; }
  if (handle === 'tl' || handle === 'tr' || handle === 't') { y += dy; h -= dy; }
  if (handle === 'bl' || handle === 'br' || handle === 'b') { h += dy; }

  if (w < MIN) { w = MIN; if (handle.includes('l')) x = el.x + el.w - MIN; }
  if (h < MIN) { h = MIN; if (handle.includes('t')) y = el.y + el.h - MIN; }

  return { x, y, w, h };
}
