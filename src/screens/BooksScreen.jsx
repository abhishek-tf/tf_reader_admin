import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { listPublishers } from '../api/publishers.js';
import { fetchAllPages } from '../api/client.js';

const PAGE_SIZE = 20;
// Server-side page size for the walk below - deliberately larger than PAGE_SIZE, since this
// walks the whole matching set once per filter change rather than one page at a time.
const WALK_PAGE_SIZE = 100;

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
  const [list, setList] = useState({ items: [], loading: true, error: null });
  const [suspendedPublisherIds, setSuspendedPublisherIds] = useState(() => new Set());

  // Loaded once, not re-run per page or filter change: matches what the backend already does
  // for entitlement checks and OPDS feeds, where a suspended publisher's whole catalogue
  // disappears.
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
        // No retry, and this effect never runs again after mount: not worth failing the
        // whole screen over, but be accurate about the cost - if this call fails, suspended
        // publishers' books stay visible for as long as this screen stays mounted, full stop.
      });
    return () => controller.abort();
  }, []);

  // Walks every server page matching the current filters, once, rather than fetching one
  // page of PAGE_SIZE at a time. GET /catalogue-items has no way to exclude a suspended
  // publisher's books, so filtering has to happen client-side - and filtering one already-
  // paginated slice at a time is what let the pager's own total and page count drift from
  // what was actually shown. Filtering the whole matching set before paginating it, instead
  // of after, is what keeps them honest: `total` below is the true reachable count, and every
  // page (bar the last) is a full PAGE_SIZE. This app's catalogue is small enough in practice
  // for that whole-set walk to cost little; a catalogue large enough for that not to hold
  // would need the exclusion done server-side instead, not a bigger version of this workaround.
  function load(signal) {
    setList((current) => ({ ...current, loading: true, error: null }));
    return fetchAllPages((walkPage) =>
      listCatalogueItems({ ...filters, page: walkPage, size: WALK_PAGE_SIZE }, { signal })
    )
      .then((items) => setList({ items, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setList((current) => ({ ...current, loading: false, error }));
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load reads filters from state directly
  }, [filters]);

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  }

  const visibleItems = list.items.filter((item) => !suspendedPublisherIds.has(item.publisherId));
  const hiddenCount = list.items.length - visibleItems.length;
  // Paginated here, over the already-filtered set, not by the server: `page` only slices
  // what is already loaded, so changing it does not refetch anything.
  const pageItems = visibleItems.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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
          rows={pageItems}
          loading={list.loading}
          error={list.error}
          emptyMessage={
            hiddenCount > 0 && visibleItems.length === 0
              ? 'Every book matching these filters belongs to a suspended publisher, so none are shown.'
              : 'No books match these filters.'
          }
          onRetry={() => load()}
        />
        {!list.error && !list.loading && hiddenCount > 0 && visibleItems.length > 0 ? (
          <p className="muted small">
            Also hidden: {hiddenCount} more book{hiddenCount === 1 ? '' : 's'} matching these
            filters, whose publisher is suspended.
          </p>
        ) : null}
        {/* Guarded like every other list: unguarded, Previous/Next and "Page 1 of 1 · 0 total"
            rendered underneath the loading row and underneath the error message. `total` is
            visibleItems.length, not the server's raw count, so this always matches what
            paging through actually reaches. */}
        {!list.error && visibleItems.length > 0 ? (
          <Pagination
            page={page}
            size={PAGE_SIZE}
            total={visibleItems.length}
            onPageChange={setPage}
          />
        ) : null}
      </section>
    </div>
  );
}
