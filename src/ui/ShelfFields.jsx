import TextField from './TextField.jsx';
import ShelfBookPicker from './ShelfBookPicker.jsx';
import { SHELF_LABEL } from './shelfFormFields.js';

/** One shelf's title and picked items, as a card. Kept separate from ShelvesScreen since the
 * same block repeats three times. */
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
      {itemsError ? <p className="field-error">{itemsError}</p> : null}
      <ShelfBookPicker
        institutionId={institutionId}
        itemIds={shelf.itemIds}
        onChange={(itemIds) => onChange(shelf.id, 'itemIds', itemIds)}
        disabled={saving}
      />
    </section>
  );
}
