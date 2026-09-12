import CoverThumb from './CoverThumb.jsx';
import Icon from './Icon.jsx';
import { useShelfItems } from './useShelfItems.js';

const ENTITLEMENT_LABEL = {
  ACTIVE: 'Entitled',
  PENDING: 'Pending entitlement',
  SUSPENDED: 'Entitlement suspended',
  REVOKED: 'Entitlement revoked',
  NONE: 'Not entitled',
};

function yearOf(publishedAt) {
  return publishedAt ? publishedAt.slice(0, 4) : null;
}

/** The ISBN / publisher (year) / entitlement caption line under a picked book's title —
 * Stitch's own metadata line for a curated shelf book. Nothing shown here is fabricated: it
 * only renders once the item itself has resolved, and only the parts of it that are present. */
export function ShelfBookMeta({ item }) {
  if (!item) return null;
  return (
    <span className="shelf-book-meta">
      {item.isbn ? <span>ISBN: {item.isbn}</span> : null}
      {item.isbn && item.publisherName ? <span>•</span> : null}
      {item.publisherName ? (
        <span>
          {item.publisherName}
          {yearOf(item.publishedAt) ? ` (${yearOf(item.publishedAt)})` : ''}
        </span>
      ) : null}
      {item.entitlementStatus ? (
        <>
          <span>•</span>
          <span>{ENTITLEMENT_LABEL[item.entitlementStatus] ?? item.entitlementStatus}</span>
        </>
      ) : null}
    </span>
  );
}

/** One picked book's row: cover, title, its meta caption, and the up/down/remove actions.
 * Shared by the page's own picked list (ShelfPickedBooks, below) and the picker modal's right
 * panel (ShelfContentsPanel). */
export function ShelfBookRow({ itemId, item, index, lastIndex, disabled, onMove, onRemove }) {
  return (
    <div className="shelf-book-row">
      <div className="table-entity">
        <CoverThumb
          id={itemId}
          coverUrl={item?.coverUrl}
          contentType={item?.contentType}
          updatedAt={item?.updatedAt}
        />
        <div className="table-entity-text">
          <span className="row-link-emphasis">{item?.title ?? itemId}</span>
          <ShelfBookMeta item={item} />
        </div>
      </div>
      <div className="row-buttons" style={{ marginBottom: 0 }}>
        <button
          type="button"
          className="btn-icon-ghost"
          aria-label="Move up"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, -1)}
        >
          <Icon name="arrow_upward" />
        </button>
        <button
          type="button"
          className="btn-icon-ghost"
          aria-label="Move down"
          disabled={disabled || index === lastIndex}
          onClick={() => onMove(index, 1)}
        >
          <Icon name="arrow_downward" />
        </button>
        <button
          type="button"
          className="btn-icon-ghost"
          aria-label="Remove from shelf"
          disabled={disabled}
          onClick={() => onRemove(itemId)}
        >
          <Icon name="close" />
        </button>
      </div>
    </div>
  );
}

/**
 * The shelf's picked items, in display order, with reorder and remove — shown directly under
 * the "Add entitled book" button on the Shelves page itself, so a shelf's contents are visible
 * without opening the picker. Split out of ShelfBookPicker, which was over the line budget once
 * this and the search half were both in one file.
 */
export default function ShelfPickedBooks({
  institutionId,
  itemIds,
  maxItems,
  onRemove,
  onMove,
  disabled,
}) {
  const items = useShelfItems(institutionId, itemIds);

  if (itemIds.length === 0) {
    return (
      <p className="muted small">No books picked yet. This shelf stays hidden until you add one.</p>
    );
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-2xs)' }}>
      <p className="field-label field-label-compact">
        Picked, in display order ({itemIds.length} of {maxItems})
      </p>
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
  );
}
