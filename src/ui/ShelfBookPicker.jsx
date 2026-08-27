import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';

const PAGE_SIZE = 10;
const MAX_ITEMS = 50;

/**
 * Search the catalogue and build a shelf's ordered item list by picking books, instead of
 * typing ids by hand. Order is the order items were added; Up/Down reorders.
 *
 * A shelf can only carry items this institution is actually entitled to - the save endpoint
 * checks the real entitlement seam and rejects anything else. Passing institutionId here
 * tags every search result with entitlementStatus, so a not-yet-entitled book is disabled
 * with a reason instead of failing at save time.
 */
export default function ShelfBookPicker({ institutionId, itemIds, onChange, disabled }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [results, setResults] = useState({ list: [], total: 0, loading: true, error: null });
  const [titles, setTitles] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    setResults((c) => ({ ...c, loading: true, error: null }));
    listCatalogueItems({ q, institutionId, page, size: PAGE_SIZE }, { signal: controller.signal })
      .then((data) => {
        setResults({ list: data.items, total: data.total, loading: false, error: null });
        setTitles((c) => ({ ...c, ...Object.fromEntries(data.items.map((i) => [i.id, i.title])) }));
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResults((c) => ({ ...c, loading: false, error }));
      });
    return () => controller.abort();
  }, [q, page, institutionId]);

  useEffect(() => {
    if (itemIds.every((id) => titles[id])) return;
    let cancelled = false;
    // The single-item endpoint requires publisher-level access and 403s for an institution
    // admin - the only role that actually uses this screen - so titles for already-picked
    // items are resolved from the same list endpoint the search above uses, at its max page
    // size, rather than one request per id.
    listCatalogueItems({ institutionId, size: 100 }).then((data) => {
      if (cancelled) return;
      setTitles((c) => ({ ...c, ...Object.fromEntries(data.items.map((i) => [i.id, i.title])) }));
    });
    return () => {
      cancelled = true;
    };
    // Only re-running when a picked id is not yet known; re-running on every keystroke in the
    // search box above would refetch the same page for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds]);

  /**
   * Mirrors EntitlementQueryImpl.check(), the real gate the save endpoint enforces: an active
   * entitlement is necessary but not sufficient. A book stuck in DRAFT or whose content
   * failed to process can never go on a shelf either, regardless of what the institution has
   * bought - entitlementStatus alone does not say that.
   */
  function isAddable(row) {
    return (
      row.entitlementStatus === 'active' &&
      row.status === 'PUBLISHED' &&
      row.contentState === 'READY'
    );
  }

  function add(row) {
    if (!isAddable(row)) return;
    if (itemIds.includes(row.id) || itemIds.length >= MAX_ITEMS) return;
    onChange([...itemIds, row.id]);
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

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'publisherId', label: 'Publisher' },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        if (itemIds.includes(row.id)) {
          return <span className="muted small btn-placeholder">Added</span>;
        }
        if (row.entitlementStatus !== 'active') {
          return <span className="muted small btn-placeholder">Not entitled</span>;
        }
        if (row.status !== 'PUBLISHED' || row.contentState !== 'READY') {
          return <span className="muted small btn-placeholder">Not ready</span>;
        }
        return (
          <button
            type="button"
            className="btn"
            disabled={disabled || itemIds.length >= MAX_ITEMS}
            onClick={() => add(row)}
          >
            Add
          </button>
        );
      },
    },
  ];

  return (
    <div className="stack">
      <FilterBar
        searchValue={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(0);
        }}
        searchPlaceholder="Search title, author or ISBN to add to this shelf"
      />
      <DataTable
        columns={columns}
        rows={results.list}
        loading={results.loading}
        error={results.error}
        emptyMessage="No books match this search."
      />
      <Pagination page={page} size={PAGE_SIZE} total={results.total} onPageChange={setPage} />

      <p className="field-label">
        Picked, in display order ({itemIds.length} of {MAX_ITEMS})
      </p>
      {itemIds.length === 0 ? (
        <p className="muted small">
          No books picked yet. This shelf stays hidden until you add one.
        </p>
      ) : (
        <table className="table">
          <tbody>
            {itemIds.map((itemId, index) => (
              <tr key={itemId}>
                <td>{titles[itemId] ?? itemId}</td>
                <td>
                  <div className="row-buttons">
                    <button
                      type="button"
                      className="btn"
                      disabled={disabled || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={disabled || index === itemIds.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={disabled}
                      onClick={() => remove(itemId)}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
