import { useRef, useState, useEffect, useCallback } from 'react';
import DomCanvas from '../renderer/DomCanvas';
import SelectionBox, { elementBounds, applyResize } from './SelectionBox';
import type { ResizeHandle } from './SelectionBox';
import { useDocStore } from '../store/useDocStore';
import { ptToPx, PT_TO_PX } from '../renderer/utils';
import type { DocElement, DocumentSchema } from '../schema/types';

const GRID = 4; // snap grid in pt
const snap = (v: number) => Math.round(v / GRID) * GRID;

// Hit-test a point (pt) against an element's bounds.
function hitTest(el: DocElement, px: number, py: number): boolean {
  const b = elementBounds(el);
  return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
}

type DragMode = 'move' | 'resize';

interface DragState {
  mode: DragMode;
  elementId: string;
  handle?: ResizeHandle;
  startMousePt: { x: number; y: number }; // in pt
  startElemBounds: { x: number; y: number; w: number; h: number }; // in pt
  preSnapSchema: DocumentSchema;
  moved: boolean;
}

export default function EditorCanvas() {
  const { schema, selectedId, setSelected, setElementLive, commitUpdate, deleteSelected, undo, redo } =
    useDocStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [, forceUpdate] = useState(0); // trigger re-render for cursor change

  const { w: pageW, h: pageH } = schema.meta.pageSize;
  const elements = schema.pages[0].elements;
  const selectedEl = elements.find(e => e.id === selectedId) ?? null;

  // Convert client pixel coords to canvas-local pt coords.
  const clientToPt = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / PT_TO_PX,
      y: (clientY - rect.top) / PT_TO_PX,
    };
  }, []);

  // ── Mouse handlers ────────────────────────────────────────────────────────

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    const pt = clientToPt(e.clientX, e.clientY);

    // Hit test — topmost element first (last in array).
    let hit: DocElement | null = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (hitTest(elements[i], pt.x, pt.y)) { hit = elements[i]; break; }
    }

    if (hit) {
      setSelected(hit.id);
      const b = elementBounds(hit);
      dragRef.current = {
        mode: 'move',
        elementId: hit.id,
        startMousePt: pt,
        startElemBounds: b,
        preSnapSchema: useDocStore.getState().schema,
        moved: false,
      };
    } else {
      setSelected(null);
    }
  }

  function startResize(e: React.MouseEvent, handle: ResizeHandle) {
    if (!selectedEl) return;
    const pt = clientToPt(e.clientX, e.clientY);
    const b = elementBounds(selectedEl);
    dragRef.current = {
      mode: 'resize',
      elementId: selectedEl.id,
      handle,
      startMousePt: pt,
      startElemBounds: b,
      preSnapSchema: useDocStore.getState().schema,
      moved: false,
    };
  }

  // Global mousemove and mouseup — must be on document to track outside canvas.
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const d = dragRef.current;
      if (!d) return;

      const pt = clientToPt(e.clientX, e.clientY);
      const dx = pt.x - d.startMousePt.x;
      const dy = pt.y - d.startMousePt.y;

      if (!d.moved && Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      d.moved = true;

      if (d.mode === 'move') {
        const newX = snap(d.startElemBounds.x + dx);
        const newY = snap(d.startElemBounds.y + dy);
        if (d.elementId) {
          const el = useDocStore.getState().schema.pages[0].elements.find(e => e.id === d.elementId);
          if (el && el.type === 'line') {
            const lenX = el.x2 - el.x1;
            const lenY = el.y2 - el.y1;
            setElementLive(d.elementId, { x1: newX, y1: newY, x2: newX + lenX, y2: newY + lenY } as Partial<DocElement>);
          } else {
            setElementLive(d.elementId, { x: newX, y: newY } as Partial<DocElement>);
          }
        }
      } else if (d.mode === 'resize' && d.handle) {
        const resizeEl = useDocStore.getState().schema.pages[0].elements.find(e => e.id === d.elementId);
        if (resizeEl?.type === 'line') return; // lines have no resize handles
        const nb = applyResize(d.startElemBounds, d.handle, dx, dy);
        setElementLive(d.elementId, {
          x: snap(nb.x), y: snap(nb.y), w: snap(nb.w), h: snap(nb.h),
        } as Partial<DocElement>);
      }

      forceUpdate(n => n + 1);
    }

    function onMouseUp() {
      const d = dragRef.current;
      if (!d) return;
      if (d.moved) {
        const el = useDocStore.getState().schema.pages[0].elements.find(e => e.id === d.elementId);
        if (el) {
          const patch =
            el.type === 'line'
              ? { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 }
              : { x: el.x, y: el.y, w: (el as { w: number }).w, h: (el as { h: number }).h };
          commitUpdate(d.elementId, patch as Partial<DocElement>, d.preSnapSchema);
        }
      }
      dragRef.current = null;
      document.body.style.cursor = '';
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [clientToPt, setElementLive, commitUpdate]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    if (e.key === 'Escape') setSelected(null);

    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl && e.key === 'z') { e.preventDefault(); undo(); }
    if (isCtrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }

    // Arrow key nudge (1pt, 4pt with shift)
    if (selectedId && !isCtrl) {
      const delta = e.shiftKey ? 4 : 1;
      const el = elements.find(x => x.id === selectedId);
      if (!el) return;
      let nudge: Partial<DocElement> | null = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const d = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -delta : delta;
        const axis = (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ? 'x' : 'y';
        if (el.type === 'line') {
          if (axis === 'x') nudge = { x1: snap(el.x1 + d), x2: snap(el.x2 + d) } as Partial<DocElement>;
          else              nudge = { y1: snap(el.y1 + d), y2: snap(el.y2 + d) } as Partial<DocElement>;
        } else {
          if (axis === 'x') nudge = { x: snap(el.x + d) } as Partial<DocElement>;
          else              nudge = { y: snap(el.y + d) } as Partial<DocElement>;
        }
      }
      if (nudge) { e.preventDefault(); commitUpdate(selectedId, nudge); }
    }
  }

  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={handleCanvasMouseDown}
      style={{
        position: 'relative',
        width: ptToPx(pageW),
        height: ptToPx(pageH),
        outline: 'none',
        cursor: dragRef.current?.mode === 'move' ? 'move' : 'default',
        flexShrink: 0,
      }}
    >
      {/* Visual layer — pointer events off so the interaction layer above can handle them */}
      <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}>
        <DomCanvas schema={schema} editable={false} />
      </div>

      {/* Interaction layer — transparent hit areas with move cursor on hover */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {elements.map(el => {
          const b = elementBounds(el);
          const isSelected = el.id === selectedId;
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: ptToPx(b.x),
                top: ptToPx(b.y),
                width: ptToPx(b.w),
                height: ptToPx(b.h),
                cursor: isSelected ? 'move' : 'pointer',
                // Tiny transparent bg so the div is actually "visible" to the browser hit test
                background: 'transparent',
              }}
            />
          );
        })}

        {/* Selection box + resize handles */}
        {selectedEl && (
          <SelectionBox el={selectedEl} onResizeHandleMouseDown={startResize} />
        )}
      </div>
    </div>
  );
}
