import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import { useToast } from './ToastContext.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { fetchAllPages } from '../api/client.js';

/**
 * The shelf's picked items, in display order, with reorder and remove. Split out of
 * ShelfBookPicker, which was over the line budget once this and the search half were both in
 * one file.
 */
export default function ShelfPickedBooks({
  institutionId,
  itemIds,
  maxItems,
  onRemove,
  onMove,
  disabled,
}) {
  const toast = useToast();
  const [titles, setTitles] = useState({});

  useEffect(() => {
    if (itemIds.every((id) => titles[id])) return;
    let cancelled = false;
    // The single-item endpoint requires publisher-level access and 403s for an institution
    // admin - the only role that actually uses this screen - so titles are resolved from the
    // list endpoint instead of one request per id. `until` stops the walk the moment every
    // picked id has turned up, so this terminates quickly for any institution smaller than a
    // few hundred books instead of paging through its whole catalogue for nothing.
    fetchAllPages((page) => listCatalogueItems({ institutionId, page, size: 100 }), {
      until: (seen) => itemIds.every((id) => seen.some((item) => item.id === id)),
    })
      .then((items) => {
        if (cancelled) return;
        const found = {};
        for (const item of items) {
          if (itemIds.includes(item.id)) found[item.id] = item.title;
        }
        setTitles((c) => ({ ...c, ...found }));
      })
      .catch((error) => {
        if (cancelled) return;
        toast.failed(error);
      });
    return () => {
      cancelled = true;
    };
    // Only re-running when a picked id is not yet known; re-running on every search keystroke
    // in the sibling component would refetch the same page for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds]);

  const rows = itemIds.map((itemId, index) => ({ id: itemId, index }));

  const columns = [
    { key: 'title', label: 'Title', render: (row) => titles[row.id] ?? row.id },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="row-buttons">
          <button
            type="button"
            className="btn"
            disabled={disabled || row.index === 0}
            onClick={() => onMove(row.index, -1)}
          >
            Up
          </button>
          <button
            type="button"
            className="btn"
            disabled={disabled || row.index === itemIds.length - 1}
            onClick={() => onMove(row.index, 1)}
          >
            Down
          </button>
          <button
            type="button"
            className="btn"
            disabled={disabled}
            onClick={() => onRemove(row.id)}
          >
            Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <p className="field-label">
        Picked, in display order ({itemIds.length} of {maxItems})
      </p>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No books picked yet. This shelf stays hidden until you add one."
      />
    </div>
  );
}
