import { useState } from 'react';
import Button from './Button.jsx';
import ShelfBookPickerModal from './ShelfBookPickerModal.jsx';
import ShelfPickedBooks from './ShelfPickedBooks.jsx';

const MAX_ITEMS = 50;

/**
 * Builds a shelf's ordered item list by picking books through a modal search, instead of
 * typing ids by hand. Split into the modal (ShelfBookPickerModal, a dual-panel transfer
 * workspace) and the page's own picked-list half (ShelfPickedBooks), since together they were
 * over the line budget — this component just owns the one itemIds array both mutate, plus
 * whether the modal is open.
 */
export default function ShelfBookPicker({
  institutionId,
  shelfTitle,
  itemIds,
  onChange,
  disabled,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

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
    <div className="stack">
      <div className="shelf-card-title-row" style={{ justifyContent: 'flex-end' }}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon="add"
          disabled={disabled || itemIds.length >= MAX_ITEMS}
          onClick={() => setPickerOpen(true)}
        >
          Add entitled book
        </Button>
      </div>
      <ShelfPickedBooks
        institutionId={institutionId}
        itemIds={itemIds}
        maxItems={MAX_ITEMS}
        onRemove={remove}
        onMove={move}
        disabled={disabled}
      />
      <ShelfBookPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        shelfTitle={shelfTitle}
        institutionId={institutionId}
        itemIds={itemIds}
        onChange={onChange}
        maxItems={MAX_ITEMS}
        disabled={disabled}
      />
    </div>
  );
}
