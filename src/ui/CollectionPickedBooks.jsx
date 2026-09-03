import DataTable from './DataTable.jsx';

/**
 * The collection's current membership, unordered - CollectionItemsWrite is a plain list, no
 * order field and no cap, unlike a shelf's itemIds. So this is add/remove only, no Up/Down.
 */
export default function CollectionPickedBooks({ items, onRemove, disabled }) {
  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button type="button" className="btn" disabled={disabled} onClick={() => onRemove(row.id)}>
          Remove
        </button>
      ),
    },
  ];

  return (
    <div>
      <p className="field-label">In this collection ({items.length})</p>
      <DataTable columns={columns} rows={items} emptyMessage="No books in this collection yet." />
    </div>
  );
}
