import { useDocStore } from '../store/useDocStore';
import { PALETTE } from '../schema/elementTemplates';
import type { DocElement } from '../schema/types';

export default function PalettePanel() {
  const { addElement, addElements } = useDocStore();

  function handleAdd(item: (typeof PALETTE)[0]['items'][0]) {
    const result = item.factory();
    if (Array.isArray(result)) {
      addElements(result);
    } else {
      addElement(result as DocElement);
    }
  }

  return (
    <aside className="palette-panel">
      <div className="palette-panel-header">Elements</div>

      {PALETTE.map(group => (
        <div key={group.title} className="palette-group">
          <div className="palette-group-title">{group.title}</div>
          <div className="palette-items">
            {group.items.map(item => (
              <button
                key={item.label}
                className="palette-item"
                title={item.label}
                onClick={() => handleAdd(item)}
              >
                <span className="palette-item-icon">{item.icon}</span>
                <span className="palette-item-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
