import { useEffect, useRef, useState } from 'react';
import DataTable from './DataTable.jsx';
import { listCollections } from '../api/collections.js';
import { fetchAllPages } from '../api/client.js';

const DEBOUNCE_MS = 400;

/**
 * Which of the selected publisher's collections this book belongs to, picked from that
 * publisher's own list rather than typed by id - so an operator can no longer link a book to
 * a collection owned by a different publisher. A console-side stopgap for the backend's
 * missing collection/publisher cross-check (F3): once that lands server-side, only this
 * picker's scoping needs re-checking against the new validation, not rebuilding.
 *
 * listCollections(publisherId) has no search parameter and a publisher's own collections are
 * few, so this loads the whole set with fetchAllPages rather than paging or searching. The
 * fetch is debounced on publisherId so it does not fire, and fail, on every keystroke while
 * that field is still being typed.
 */
export default function BookCollectionPicker({ publisherId, collectionIds, onChange, disabled }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Read inside the fetch below without retriggering it: the effect must only refetch when
  // publisherId itself changes, not on every Add/Remove click.
  const latest = useRef({ collectionIds, onChange });
  latest.current = { collectionIds, onChange };

  useEffect(() => {
    if (!publisherId) {
      setCollections([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchAllPages((page) => listCollections(publisherId, { page, size: 100 }))
        .then((loaded) => {
          if (cancelled) return;
          setCollections(loaded);
          // A publisher change can leave a previously picked id behind that this publisher
          // does not actually own - drop it rather than silently resubmitting a cross-publisher
          // link, which is exactly what this picker exists to prevent.
          const validIds = new Set(loaded.map((collection) => collection.id));
          const { collectionIds: picked, onChange: notify } = latest.current;
          const stillValid = picked.filter((id) => validIds.has(id));
          if (stillValid.length !== picked.length) notify(stillValid);
        })
        .catch(() => {
          // Still being typed, or not a real publisher id - nothing to pick from, and not
          // worth a toast for every keystroke.
          if (!cancelled) setCollections([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [publisherId]);

  function toggle(collectionId) {
    onChange(
      collectionIds.includes(collectionId)
        ? collectionIds.filter((id) => id !== collectionId)
        : [...collectionIds, collectionId]
    );
  }

  if (!publisherId) {
    return (
      <div>
        <p className="field-label">Collections</p>
        <p className="muted">Enter a publisher ID above to choose its collections.</p>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button type="button" className="btn" disabled={disabled} onClick={() => toggle(row.id)}>
          {collectionIds.includes(row.id) ? 'Remove' : 'Add'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <p className="field-label">Collections ({collectionIds.length} selected)</p>
      <DataTable
        columns={columns}
        rows={collections}
        loading={loading}
        emptyMessage="This publisher has no collections yet."
      />
    </div>
  );
}
