import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';

const PAGE_SIZE = 10;

/**
 * Search the whole catalogue and add a book to a collection. Unrestricted across publishers -
 * CollectionAdminService.setItems validates only that an id is a real catalogue item, nothing
 * about it matching the collection's own publisher - so this does not invent a rule the backend
 * does not enforce. No entitlement or readiness gating either: a collection has no institution
 * of its own for that check to be about.
 */
export default function CollectionBookSearch({ pickedIds, onAdd, disabled }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [results, setResults] = useState({ list: [], total: 0, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setResults((c) => ({ ...c, loading: true, error: null }));
    listCatalogueItems({ q, page, size: PAGE_SIZE }, { signal: controller.signal })
      .then((data) =>
        setResults({ list: data.items, total: data.total, loading: false, error: null })
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResults((c) => ({ ...c, loading: false, error }));
      });
    return () => controller.abort();
  }, [q, page]);

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'publisherName',
      label: 'Publisher',
      render: (row) => row.publisherName ?? row.publisherId,
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        pickedIds.includes(row.id) ? (
          <span className="muted small btn-placeholder">Added</span>
        ) : (
          <button
            type="button"
            className="btn"
            disabled={disabled}
            onClick={() => onAdd({ id: row.id, title: row.title })}
          >
            Add
          </button>
        ),
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
        searchPlaceholder="Search title, author or ISBN to add to this collection"
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
