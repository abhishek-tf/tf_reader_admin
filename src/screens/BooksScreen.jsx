import { Link, Outlet, useLocation } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import { BooksDecoration } from '../ui/pageDecorations.jsx';
import Tabs from '../ui/Tabs.jsx';
import Button from '../ui/Button.jsx';
import RouteErrorBoundary from '../ui/RouteErrorBoundary.jsx';
import { useBooks, STATUS_TABS } from './useBooks.js';
import { COLUMNS } from './bookColumns.jsx';

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

function BookFilters({ b }) {
  return (
    <FilterBar
      searchValue={b.filters.q}
      onSearchChange={(q) => b.updateFilters({ q })}
      searchPlaceholder="Search title, author or ISBN..."
      filters={[
        {
          name: 'publisherId',
          label: 'Publisher',
          value: b.filters.publisherId,
          onChange: (publisherId) => b.updateFilters({ publisherId }),
          placeholder: 'Publisher: All',
          options: b.publisherOptions.map((publisher) => ({
            value: publisher.id,
            label: publisher.name,
          })),
        },
        {
          name: 'contentType',
          label: 'Format',
          value: b.filters.contentType,
          onChange: (contentType) => b.updateFilters({ contentType }),
          placeholder: 'Format: All',
          options: CONTENT_TYPE_OPTIONS,
        },
        {
          name: 'accessTier',
          label: 'Access tier',
          value: b.filters.accessTier,
          onChange: (accessTier) => b.updateFilters({ accessTier }),
          placeholder: 'Tier: All',
          options: TIER_OPTIONS,
        },
        {
          name: 'collectionId',
          label: 'Collection ID',
          type: 'text',
          value: b.filters.collectionId,
          onChange: (collectionId) => b.updateFilters({ collectionId }),
          placeholder: 'Collection ID',
        },
      ]}
      trailing={
        <button type="button" className="btn-reset-link" onClick={b.clear}>
          Reset
        </button>
      }
    />
  );
}

function HiddenCountNotice({ b }) {
  if (b.error || b.loading || b.hiddenCount === 0 || b.visibleCount === 0) return null;
  return (
    <p className="muted small">
      Also hidden: {b.hiddenCount} more book{b.hiddenCount === 1 ? '' : 's'} matching these
      filters, whose publisher is suspended.
    </p>
  );
}

function emptyMessageFor(b) {
  if (b.hiddenCount > 0 && b.visibleCount === 0) {
    return 'Every book matching these filters belongs to a suspended publisher, so none are shown.';
  }
  return 'No books match these filters.';
}

export default function BooksScreen() {
  const b = useBooks();
  const location = useLocation();

  return (
    <div className="stack">
      <PageHeader
        title="Books"
        subtitle="The console's catalogue, filtered by tier, type and publisher."
        decoration={<BooksDecoration />}
        actions={
          <Button as={Link} variant="primary" icon="add" to="/books/new">
            Add book
          </Button>
        }
      />

      <Tabs
        tabs={STATUS_TABS.map((tab) => ({ ...tab, count: b.tabCounts[tab.key] }))}
        active={b.statusTab}
        onChange={b.changeStatusTab}
      />

      <BookFilters b={b} />

      <DataTable
        columns={COLUMNS}
        rows={b.pageItems}
        loading={b.loading}
        error={b.error}
        emptyMessage={emptyMessageFor(b)}
        onRetry={b.retry}
        header={!b.loading && !b.error ? <span>{b.total} book{b.total === 1 ? '' : 's'} listed</span> : null}
      />
      <HiddenCountNotice b={b} />
      {/* Guarded like every other list: unguarded, Previous/Next and "Page 1 of 1 · 0 total"
          rendered underneath the loading row and underneath the error message. `total` is
          the client-filtered count, not the server's raw one, so this always matches what
          paging through actually reaches. */}
      {!b.error && b.total > 0 ? (
        <Pagination page={b.page} size={b.pageSize} total={b.total} onPageChange={b.setPage} />
      ) : null}

      {/* Filled by the /books/new and /books/:itemId/edit child routes — BookFormScreen's own
          fixed-position drawer overlay, rendered here so this table stays mounted and visible
          (blurred) behind it, rather than being replaced by it. Renders nothing on the plain
          /books address, where there's no matching child route. Wrapped in an error boundary
          because that overlay's backdrop is a sibling of this Outlet, not an ancestor of it —
          without one, a render error in there has nothing to catch it and leaves the backdrop
          on screen with no panel and no way to close it.
          `context` hands BookFormScreen this list's own reload — since this table now stays
          mounted across a create/edit instead of remounting on the way back to /books (that
          remount used to be what refetched it for free), something has to trigger that
          refetch explicitly, or a status edit lands on the server but the row goes on
          showing what it said before the edit until a manual reload. */}
      <RouteErrorBoundary resetKey={location.pathname} fallbackTo="/books">
        <Outlet context={{ reload: b.retry }} />
      </RouteErrorBoundary>
    </div>
  );
}
