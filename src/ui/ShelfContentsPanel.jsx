import { ShelfBookRow } from './ShelfPickedBooks.jsx';
import { useShelfItems } from './useShelfItems.js';

/**
 * The picker modal's right panel — "Shelf contents", Stitch's own name for the ordered list
 * being built. Same rows as the page's own picked list (ShelfBookRow), inside the same panel
 * chrome the left "Available entitled titles" panel uses, plus "Clear all" — a real, one-click
 * version of removing every row by hand.
 */
export default function ShelfContentsPanel({
  institutionId,
  itemIds,
  maxItems,
  onRemove,
  onMove,
  onClearAll,
  disabled,
}) {
  const items = useShelfItems(institutionId, itemIds);

  return (
    <div className="shelf-panel">
      <div className="shelf-panel-header">
        <span className="shelf-panel-title">
          Shelf contents{' '}
          <span className="shelf-panel-count">
            ({itemIds.length} of {maxItems} max)
          </span>
        </span>
        {itemIds.length > 0 ? (
          <button type="button" className="btn-reset-link" disabled={disabled} onClick={onClearAll}>
            Clear all
          </button>
        ) : null}
      </div>

      {itemIds.length === 0 ? (
        <p className="muted small">
          No books picked yet. This shelf stays hidden until you add one.
        </p>
      ) : (
        <div className="shelf-panel-list">
          {itemIds.map((itemId, index) => (
            <ShelfBookRow
              key={itemId}
              itemId={itemId}
              item={items[itemId]}
              index={index}
              lastIndex={itemIds.length - 1}
              disabled={disabled}
              onMove={onMove}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
