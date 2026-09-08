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
 *
 * `onBusyChange`, if given, is told whenever this is between a publisherId change and the
 * prune that follows it settling - the caller's own submit must stay disabled for that whole
 * stretch, not just while its own save request is in flight. Without it, a fast publisher
 * change followed immediately by Submit sends the old publisher's collection id through
 * before this component has had a chance to drop it, which is exactly the link this picker
 * exists to prevent.
 */
export default function BookCollectionPicker({
  publisherId,
  collectionIds,
  onChange,
  onBusyChange,
  disabled,
}) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  // Read inside the fetch below without retriggering it: the effect must only refetch when
  // publisherId itself changes, not on every Add/Remove click or every render the parent does
  // for reasons of its own (which would otherwise retrigger this if onBusyChange is not
  // memoized there).
  const latest = useRef({ collectionIds, onChange, onBusyChange });
  latest.current = { collectionIds, onChange, onBusyChange };

  useEffect(() => {
    if (!publisherId) {
      setCollections([]);
      setError(null);
      latest.current.onBusyChange?.(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    latest.current.onBusyChange?.(true);
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
        .catch((failure) => {
          // The debounce already absorbed every keystroke; by the time this actually runs the
          // id has sat still for DEBOUNCE_MS, so a 404 here is a real answer about the id
          // typed, not typing noise - show it rather than a confident-sounding "no collections".
          if (!cancelled) {
            setCollections([]);
            setError(failure);
          }
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
          // Only now, after the prune above has already run, is it safe for the caller to
          // submit again - not a moment earlier, or the exact race this prop exists to close
          // reopens.
          latest.current.onBusyChange?.(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [publisherId, retryToken]);

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
        error={error}
        emptyMessage="This publisher has no collections yet."
        onRetry={() => setRetryToken((token) => token + 1)}
      />
    </div>
  );
}
