import { create } from 'zustand';
import type { DocumentSchema, DocElement } from '../schema/types';
import { navionSample } from '../schema/navionSample';

const MAX_HISTORY = 60;

// Patch an element in the schema by id (shallow merge).
function patchEl(schema: DocumentSchema, id: string, patch: Partial<DocElement>): DocumentSchema {
  return {
    ...schema,
    pages: schema.pages.map(p => ({
      ...p,
      elements: p.elements.map(el => (el.id === id ? ({ ...el, ...patch } as DocElement) : el)),
    })),
  };
}

interface DocStore {
  schema: DocumentSchema;
  selectedId: string | null;
  past: DocumentSchema[];
  future: DocumentSchema[];

  setSelected: (id: string | null) => void;

  // Live update — no history push (use during drag / continuous slider input).
  setElementLive: (id: string, patch: Partial<DocElement>) => void;

  // Committed update — pushes to history. Pass the schema snapshot from BEFORE
  // the change so undo reverts cleanly (important for drag: snapshot at mousedown).
  commitUpdate: (id: string, patch: Partial<DocElement>, before?: DocumentSchema) => void;

  addElement: (el: DocElement) => void;
  deleteSelected: () => void;

  undo: () => void;
  redo: () => void;
}

export const useDocStore = create<DocStore>((set, get) => ({
  schema: navionSample,
  selectedId: null,
  past: [],
  future: [],

  setSelected: (id) => set({ selectedId: id }),

  setElementLive: (id, patch) => {
    set({ schema: patchEl(get().schema, id, patch) });
  },

  commitUpdate: (id, patch, before) => {
    const { schema, past } = get();
    const snapshot = before ?? schema;
    set({
      schema: patchEl(schema, id, patch),
      past: [...past.slice(-(MAX_HISTORY - 1)), snapshot],
      future: [],
    });
  },

  addElement: (el) => {
    const { schema, past } = get();
    set({
      schema: {
        ...schema,
        pages: schema.pages.map((p, i) =>
          i === 0 ? { ...p, elements: [...p.elements, el] } : p,
        ),
      },
      selectedId: el.id,
      past: [...past.slice(-(MAX_HISTORY - 1)), schema],
      future: [],
    });
  },

  deleteSelected: () => {
    const { schema, selectedId, past } = get();
    if (!selectedId) return;
    set({
      schema: {
        ...schema,
        pages: schema.pages.map(p => ({
          ...p,
          elements: p.elements.filter(el => el.id !== selectedId),
        })),
      },
      selectedId: null,
      past: [...past.slice(-(MAX_HISTORY - 1)), schema],
      future: [],
    });
  },

  undo: () => {
    const { schema, past, future } = get();
    if (!past.length) return;
    set({
      schema: past[past.length - 1],
      past: past.slice(0, -1),
      future: [schema, ...future.slice(0, MAX_HISTORY - 1)],
    });
  },

  redo: () => {
    const { schema, past, future } = get();
    if (!future.length) return;
    set({
      schema: future[0],
      past: [...past.slice(-(MAX_HISTORY - 1)), schema],
      future: future.slice(1),
    });
  },
}));
