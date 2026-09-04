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
 * does not enforce. No entitlement gating either: a collection has no institution of its own for
 * that check to be about. A not-yet-ready book can still be added - the backend does not block
 * it, and it stays invisible in every feed until it is PUBLISHED and READY anyway, the same rule
 * that already protects a stale shelf entry - but a warning next to Add says so, since the plan
 * calls for reusing that readiness signal even where there is nothing to block.
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
      render: (row) => {
        if (pickedIds.includes(row.id)) {
          return <span className="muted small btn-placeholder">Added</span>;
        }
        const notReady = row.status !== 'PUBLISHED' || row.contentState !== 'READY';
        return (
          <div className="row-buttons">
            <button
              type="button"
              className="btn"
              disabled={disabled}
              onClick={() => onAdd({ id: row.id, title: row.title })}
            >
              Add
            </button>
            {notReady ? <span className="muted small">Not ready yet</span> : null}
          </div>
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
