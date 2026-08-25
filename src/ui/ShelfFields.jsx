import TextField from './TextField.jsx';
import { SHELF_LABEL } from './shelfFormFields.js';

/** One shelf's title and picked items, as a card. Kept separate from ShelvesScreen since the
 * same two-field block repeats three times. */
export default function ShelfFields({ shelf, titleError, itemsError, saving, onChange }) {
  return (
    <section className="card">
      <h2>{SHELF_LABEL[shelf.id]}</h2>
      <TextField
        label="Title"
        name={`${shelf.id}-title`}
        value={shelf.title}
        onChange={(_name, value) => onChange(shelf.id, 'title', value)}
        error={titleError}
        maxLength={60}
        required
        disabled={saving}
      />
      <TextField
        label="Item IDs"
        name={`${shelf.id}-items`}
        value={shelf.itemIdsText}
        onChange={(_name, value) => onChange(shelf.id, 'itemIdsText', value)}
        error={itemsError}
        hint="Comma separated, in display order. Up to 50. Leave blank to hide this shelf."
        disabled={saving}
      />
    </section>
  );
}
