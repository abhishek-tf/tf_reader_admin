import ShelfBookSearch from './ShelfBookSearch.jsx';
import ShelfPickedBooks from './ShelfPickedBooks.jsx';

const MAX_ITEMS = 50;

/**
 * Search the catalogue and build a shelf's ordered item list by picking books, instead of
 * typing ids by hand. Split into a search half (ShelfBookSearch) and a picked-list half
 * (ShelfPickedBooks), since together they were over the line budget - this component just
 * owns the one itemIds array both halves mutate.
 */
export default function ShelfBookPicker({ institutionId, itemIds, onChange, disabled }) {
  function add(itemId) {
    if (itemIds.includes(itemId) || itemIds.length >= MAX_ITEMS) return;
    onChange([...itemIds, itemId]);
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
    <div className="stack">
      <ShelfBookSearch
        institutionId={institutionId}
        itemIds={itemIds}
        maxItems={MAX_ITEMS}
        onAdd={add}
        disabled={disabled}
      />
      <ShelfPickedBooks
        institutionId={institutionId}
        itemIds={itemIds}
        maxItems={MAX_ITEMS}
        onRemove={remove}
        onMove={move}
        disabled={disabled}
      />
    </div>
  );
}
