import TextField from './TextField.jsx';
import StatusBadge from './StatusBadge.jsx';
import ShelfBookPicker from './ShelfBookPicker.jsx';
import { SHELF_LABEL } from './shelfFormFields.js';

// A shelf's fixed slot number (1/2/3), from its own id — shelf_1 -> 1, etc. Real and derived,
// not a counter kept separately, so it can never drift from the id the contract fixes.
function slotNumberOf(shelfId) {
  return shelfId.slice(-1);
}

/** One shelf's title and picked items, as a card — Stitch's own layout for a fixed shelf
 * slot: its number, id, visible/hidden state, and inline title on one header row, its
 * curated books (with an "Add entitled book" modal trigger) underneath. Kept separate from
 * ShelvesScreen since the same block repeats three times. */
export default function ShelfFields({
  institutionId,
  shelf,
  titleError,
  itemsError,
  saving,
  onChange,
}) {
  return (
    <section className="card">
      <div className="shelf-card-header">
        <div className="shelf-card-title-row" style={{ flex: 1 }}>
          <span className="shelf-card-number" aria-hidden="true">
            {slotNumberOf(shelf.id)}
          </span>
          <div className="stack" style={{ gap: 'var(--space-2xs)', flex: 1, minWidth: 220 }}>
            <div className="shelf-card-title-row">
              <span className="code-chip-plain">id: {shelf.id}</span>
              <StatusBadge status={shelf.itemIds.length > 0 ? 'VISIBLE' : 'HIDDEN'} />
            </div>
            <TextField
              label={`${SHELF_LABEL[shelf.id]} title`}
              name={`${shelf.id}-title`}
              compact
              value={shelf.title}
              onChange={(_name, value) => onChange(shelf.id, 'title', value)}
              error={titleError}
              maxLength={60}
              required
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {itemsError ? <p className="field-error">{itemsError}</p> : null}
      <ShelfBookPicker
        institutionId={institutionId}
        shelfTitle={shelf.title}
        itemIds={shelf.itemIds}
        onChange={(itemIds) => onChange(shelf.id, 'itemIds', itemIds)}
        disabled={saving}
      />
    </section>
  );
}
