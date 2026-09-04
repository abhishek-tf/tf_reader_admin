import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';

const PAGE_SIZE = 10;

/**
 * Mirrors EntitlementQueryImpl.check(), the real gate the save endpoint enforces: an active
 * entitlement is necessary but not sufficient. A book stuck in DRAFT or whose content failed
 * to process can never go on a shelf either, regardless of what the institution has bought -
 * entitlementStatus alone does not say that. Returns why a book cannot be added, or null when
 * it can - the one place that rule is written, so the button and its disabled reason can
 * never disagree.
 */
function ineligibleReason(row) {
  if (row.entitlementStatus !== 'ACTIVE') return 'Not entitled';
  if (row.status !== 'PUBLISHED' || row.contentState !== 'READY') return 'Not ready';
  return null;
}

/**
 * Search the catalogue and add a book to a shelf. Split out of ShelfBookPicker, which was
 * over the line budget once this and the picked-list half were both in one file.
 */
export default function ShelfBookSearch({ institutionId, itemIds, maxItems, onAdd, disabled }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [results, setResults] = useState({ list: [], total: 0, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setResults((c) => ({ ...c, loading: true, error: null }));
    listCatalogueItems({ q, institutionId, page, size: PAGE_SIZE }, { signal: controller.signal })
      .then((data) =>
        setResults({ list: data.items, total: data.total, loading: false, error: null })
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResults((c) => ({ ...c, loading: false, error }));
      });
    return () => controller.abort();
  }, [q, page, institutionId]);

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
        const reason = ineligibleReason(row);
        if (reason !== null) {
          return <span className="muted small btn-placeholder">{reason}</span>;
        }
        return (
          <button
            type="button"
            className="btn"
            disabled={disabled || itemIds.length >= maxItems}
            onClick={() => onAdd(row.id)}
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
    </div>
  );
}
