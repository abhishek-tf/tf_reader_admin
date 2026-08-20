import { useEffect, useState } from 'react';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import BookForm from '../ui/BookForm.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';

const PAGE_SIZE = 20;

const TIER_LABEL = {
  OPEN_ACCESS: 'Open access',
  SUBSCRIPTION: 'Subscription',
  ELITE: 'Elite',
};
const CONTENT_TYPE_OPTIONS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EPUB', label: 'EPUB' },
  { value: 'AUDIO', label: 'Audio' },
];
const TIER_OPTIONS = [
  { value: 'OPEN_ACCESS', label: 'Open access' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'ELITE', label: 'Elite' },
];
const CONTENT_STATE_LABEL = {
  NONE: 'No content',
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
};

const EMPTY_FILTERS = { publisherId: '', collectionId: '', contentType: '', accessTier: '', q: '' };

export default function BooksScreen() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [list, setList] = useState({ items: [], total: 0, loading: true, error: null });
  // null: no form. 'new': create. Otherwise the row being edited.
  const [editingItem, setEditingItem] = useState(null);

  function load(signal) {
    setList((current) => ({ ...current, loading: true, error: null }));
    return listCatalogueItems({ ...filters, page, size: PAGE_SIZE }, { signal })
      .then((data) =>
        setList({ items: data.items, total: data.total, loading: false, error: null })
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setList((current) => ({ ...current, loading: false, error }));
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load reads filters/page from state directly
  }, [filters, page]);

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  }

  function handleSaved() {
    setEditingItem(null);
    load();
  }

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'publisherName',
      label: 'Publisher',
      render: (row) => row.publisherName ?? row.publisherId,
    },
    { key: 'contentType', label: 'Type' },
    {
      key: 'accessTier',
      label: 'Access tier',
      render: (row) => (
        <span className={`badge badge-${row.accessTier}`}>{TIER_LABEL[row.accessTier]}</span>
      ),
    },
    {
      key: 'contentState',
      label: 'Content state',
      render: (row) => (
        <>
          {CONTENT_STATE_LABEL[row.contentState] ?? row.contentState}
          {row.contentState === 'FAILED' && row.contentError ? (
            <p className="content-error">{row.contentError}</p>
          ) : null}
        </>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button type="button" className="btn" onClick={() => setEditingItem(row)}>
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="stack">
      <section className="card">
        <h1>Books</h1>
        <p className="muted">The console&apos;s catalogue, filtered by tier, type and publisher.</p>
        <div className="row-buttons">
          <button type="button" className="btn btn-primary" onClick={() => setEditingItem('new')}>
            Add book
          </button>
        </div>

        <FilterBar
          searchValue={filters.q}
          onSearchChange={(q) => updateFilters({ q })}
          searchPlaceholder="Search title, author or ISBN"
          filters={[
            {
              name: 'publisherId',
              label: 'Publisher ID',
              type: 'text',
              value: filters.publisherId,
              onChange: (publisherId) => updateFilters({ publisherId }),
            },
            {
              name: 'collectionId',
              label: 'Collection ID',
              type: 'text',
              value: filters.collectionId,
              onChange: (collectionId) => updateFilters({ collectionId }),
            },
            {
              name: 'contentType',
              label: 'Content type',
              value: filters.contentType,
              options: CONTENT_TYPE_OPTIONS,
              onChange: (contentType) => updateFilters({ contentType }),
            },
            {
              name: 'accessTier',
              label: 'Access tier',
              value: filters.accessTier,
              options: TIER_OPTIONS,
              onChange: (accessTier) => updateFilters({ accessTier }),
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          error={list.error}
          emptyMessage="No books match these filters."
          onRetry={() => load()}
        />
        <Pagination page={page} size={PAGE_SIZE} total={list.total} onPageChange={setPage} />
      </section>

      {editingItem !== null ? (
        <section className="card">
          <h2>{editingItem === 'new' ? 'Add book' : 'Edit book'}</h2>
          <BookForm
            key={editingItem === 'new' ? 'new' : editingItem.id}
            initialItem={editingItem === 'new' ? null : editingItem}
            onSaved={handleSaved}
            onCancel={() => setEditingItem(null)}
          />
        </section>
      ) : null}
    </div>
  );
}
