import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { listPublishers } from '../api/publishers.js';
import { fetchAllPages } from '../api/client.js';

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
  const [suspendedPublisherIds, setSuspendedPublisherIds] = useState(() => new Set());

  // Loaded once, not re-run per page or filter change: matches what the backend already does
  // for entitlement checks and OPDS feeds, where a suspended publisher's whole catalogue
  // disappears. GET /catalogue-items has no publisher-status filter of its own, so this is a
  // client-side stand-in - rows are dropped after the fact, so `list.total` and the pager below
  // still count them. The hiddenCount note further down says so rather than leaving a page that
  // looks short, or empty, unexplained.
  useEffect(() => {
    const controller = new AbortController();
    fetchAllPages((statusPage) =>
      listPublishers(
        { status: 'SUSPENDED', page: statusPage, size: 100 },
        { signal: controller.signal }
      )
    )
      .then((suspended) => {
        setSuspendedPublisherIds(new Set(suspended.map((publisher) => publisher.id)));
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        // Not worth failing the whole screen over: worst case a suspended publisher's books
        // stay visible until this succeeds on a retry.
      });
    return () => controller.abort();
  }, []);

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

  const visibleItems = list.items.filter((item) => !suspendedPublisherIds.has(item.publisherId));
  // The server's own total still counts suspended-publisher rows this filter then drops, so a
  // page can show fewer than PAGE_SIZE, and one where every row was hidden must say so rather
  // than claim there is nothing to match - there is, it is just not shown.
  const hiddenCount = list.items.length - visibleItems.length;

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
        <Link className="btn" to={`/books/${row.id}/edit`}>
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="stack">
      <section className="card">
        <h1>Books</h1>
        <p className="muted">The console&apos;s catalogue, filtered by tier, type and publisher.</p>
        <div className="row-buttons">
          <Link className="btn btn-primary" to="/books/new">
            Add book
          </Link>
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
          rows={visibleItems}
          loading={list.loading}
          error={list.error}
          emptyMessage={
            hiddenCount > 0
              ? 'Every book on this page belongs to a suspended publisher, so none are shown.'
              : 'No books match these filters.'
          }
          onRetry={() => load()}
        />
        {!list.error && !list.loading && hiddenCount > 0 ? (
          <p className="muted small">
            This page also hides {hiddenCount} book{hiddenCount === 1 ? '' : 's'} whose publisher is
            suspended.
          </p>
        ) : null}
        {/* Guarded like every other list: unguarded, Previous/Next and "Page 1 of 1 · 0 total"
            rendered underneath the loading row and underneath the error message. */}
        {!list.error && list.total > 0 ? (
          <Pagination page={page} size={PAGE_SIZE} total={list.total} onPageChange={setPage} />
        ) : null}
      </section>
    </div>
  );
}
