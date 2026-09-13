import { useState } from 'react';
import Icon from './Icon.jsx';
import ShelfBookSearch from './ShelfBookSearch.jsx';
import ShelfContentsPanel from './ShelfContentsPanel.jsx';

/**
 * The picker modal's body: Stitch's dual-panel transfer workspace. Available entitled titles
 * on the left (checkbox per eligible row), the shelf's own contents on the right, one real
 * transfer action between them.
 *
 * Stitch's version has a second, left-pointing transfer button for "remove selected from
 * shelf" — left out here because the right panel already removes a row directly, one click,
 * with no selection step first. A second control that did the same thing a different way would
 * be a control for its own sake, not a real second capability.
 */
export default function ShelfBookTransferWorkspace({
  institutionId,
  itemIds,
  onChange,
  maxItems,
  disabled,
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  function toggleSelect(id) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible(ids) {
    setSelectedIds((current) => new Set([...current, ...ids]));
  }

  function addSelected() {
    const room = maxItems - itemIds.length;
    if (room <= 0 || selectedIds.size === 0) return;
    const toAdd = [...selectedIds].filter((id) => !itemIds.includes(id)).slice(0, room);
    onChange([...itemIds, ...toAdd]);
    setSelectedIds(new Set());
  }

  function remove(itemId) {
    onChange(itemIds.filter((id) => id !== itemId));
  }

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= itemIds.length) return;
    const next = [...itemIds];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="shelf-transfer-grid">
      <ShelfBookSearch
        institutionId={institutionId}
        itemIds={itemIds}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectVisible={selectVisible}
      />
      <div className="shelf-transfer-controls">
        <button
          type="button"
          className="btn btn-primary btn-icon"
          title="Add selected to shelf"
          aria-label="Add selected to shelf"
          disabled={disabled || selectedIds.size === 0 || itemIds.length >= maxItems}
          onClick={addSelected}
        >
          <Icon name="chevron_right" />
        </button>
      </div>
      <ShelfContentsPanel
        institutionId={institutionId}
        itemIds={itemIds}
        maxItems={maxItems}
        onRemove={remove}
        onMove={move}
        onClearAll={() => onChange([])}
        disabled={disabled}
      />
    </div>
  );
}
