import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import RowTreeToggle from './RowTreeToggle.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { fetchAllPages } from '../api/client.js';
import { buildCatalogueTree, flattenVisible } from '../screens/bookTree.js';

const PAGE_SIZE = 10;
// Same walk size useBooks.js/ShelfBookSearch.jsx use, for the same reason: walk the whole
// matching set once per search change so a Journal and its Volumes/Issues/Articles are never
// split apart before the tree is built.
const WALK_PAGE_SIZE = 100;

/**
 * Search a collection's own publisher and add a book to the collection. Scoped by
 * `publisherId` — the same filter BooksScreen already offers on this endpoint — so a
 * collection only ever picks up books from the publisher it belongs to. No entitlement
 * gating: a collection has no institution of its own for that check to be about. A
 * not-yet-ready book can still be added - the backend does not block it, and it stays
 * invisible in every feed until it is PUBLISHED and READY anyway, the same rule that already
 * protects a stale shelf entry - but a warning next to Add says so, since the plan calls for
 * reusing that readiness signal even where there is nothing to block.
 *
 * Grouped into a Journal -> Volume -> Issue -> Article tree the same way the Books page does
 * (bookTree.js), so a Journal shows as one collapsed row rather than flat siblings mixed in
 * with its own Volumes/Issues/Articles. A container carries no content of its own to add - it
 * only exists to be expanded into its leaves.
 */
export default function CollectionBookSearch({ publisherId, pickedIds, onAdd, disabled }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [results, setResults] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setResults((c) => ({ ...c, loading: true, error: null }));
    fetchAllPages((walkPage) =>
      listCatalogueItems(
        { publisherId, q, page: walkPage, size: WALK_PAGE_SIZE },
        { signal: controller.signal }
      )
    )
      .then((items) => setResults({ items, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResults((c) => ({ ...c, loading: false, error }));
      });
    return () => controller.abort();
  }, [publisherId, q]);

  function toggleExpand(id) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const roots = buildCatalogueTree(results.items);
  const total = roots.length;
  const pageRoots = roots.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const rows = flattenVisible(pageRoots, expandedIds);

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <span style={{ paddingLeft: row.depth ? row.depth * 20 : 0 }} className="table-entity">
          <RowTreeToggle row={row} onToggleExpand={toggleExpand} />
          {row.title}
        </span>
      ),
    },
    {
      key: 'publisherName',
      label: 'Publisher',
      render: (row) => row.publisherName ?? row.publisherId,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        if (row.hasChildren) {
          return <span className="muted small">Expand to add an article</span>;
        }
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
        rows={rows}
        loading={results.loading}
        error={results.error}
        emptyMessage="No books match this search."
      />
      <Pagination page={page} size={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
