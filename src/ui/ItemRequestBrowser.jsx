import { useEffect, useState } from 'react';
import Card from './Card.jsx';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import RequestButton from './RequestButton.jsx';
import RowTreeToggle from './RowTreeToggle.jsx';
import { useToast } from './ToastContext.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { createEntitlement } from '../api/entitlements.js';
import { fetchAllPages } from '../api/client.js';
import { buildCatalogueTree, flattenVisible } from '../screens/bookTree.js';
import {
  CONTENT_TYPE_OPTIONS,
  TIER_OPTIONS,
  TIER_LABEL,
  renderEntitlementStatus,
  useInFlightIds,
} from './entitlementFields.jsx';

const PAGE_SIZE = 20;
// Same walk size useBooks.js/ShelfBookSearch.jsx use, for the same reason: walk the whole
// matching set once per filter change so a Journal and its Volumes/Issues/Articles are never
// split apart before the tree is built.
const WALK_PAGE_SIZE = 100;

/**
 * Every book an institution admin can ask for, tagged with where their request stands, against
 * GET /api/admin/v1/catalogue-items. The item-scope counterpart of CollectionRequestBrowser;
 * both live under InstitutionEntitlementsScreen's "Request Access" tab.
 *
 * Grouped into a Journal -> Volume -> Issue -> Article tree the same way the Books page does
 * (bookTree.js): a Journal shows as one collapsed row, not flat siblings mixed in with its own
 * Volumes/Issues/Articles. Only a leaf (BOOK/ARTICLE) can be requested at ITEM scope - a
 * container has no content of its own to grant - so a container row only ever gets an expand
 * toggle, never a Request button.
 */
export default function ItemRequestBrowser({ institutionId }) {
  const toast = useToast();
  const [filters, setFilters] = useState({ q: '', contentType: '', accessTier: '' });
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [items, setItems] = useState({ items: [], loading: true, error: null });
  const requestingIds = useInFlightIds();

  function loadItems(signal) {
    setItems((c) => ({ ...c, loading: true, error: null }));
    return fetchAllPages((walkPage) =>
      listCatalogueItems(
        { ...filters, institutionId, page: walkPage, size: WALK_PAGE_SIZE },
        { signal }
      )
    )
      .then((loaded) => setItems({ items: loaded, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setItems((c) => ({ ...c, loading: false, error }));
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    loadItems(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, institutionId]);

  function updateFilters(patch) {
    setFilters((c) => ({ ...c, ...patch }));
    setPage(0);
  }

  function toggleExpand(id) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRequestItem(item) {
    if (requestingIds.has(item.id)) return;
    requestingIds.start(item.id);
    try {
      await createEntitlement(institutionId, { scopeType: 'ITEM', scopeId: item.id });
      toast.saved('Requested.');
      loadItems();
    } catch (error) {
      toast.failed(error);
    } finally {
      requestingIds.finish(item.id);
    }
  }

  const roots = buildCatalogueTree(items.items);
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
    { key: 'contentType', label: 'Type', render: (row) => row.contentType ?? '—' },
    {
      key: 'accessTier',
      label: 'Access tier',
      render: (row) =>
        row.accessTier ? (
          <span className={`badge badge-${row.accessTier}`}>{TIER_LABEL[row.accessTier]}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'entitlementStatus',
      label: 'Your status',
      render: (row) => (row.hasChildren ? '—' : renderEntitlementStatus(row.entitlementStatus)),
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        row.hasChildren ? (
          <span className="muted small">Expand to request an article</span>
        ) : (
          <RequestButton row={row} requestingIds={requestingIds} onRequest={handleRequestItem} />
        ),
    },
  ];

  return (
    <Card>
      <div className="detail-section-title">
        <h2>Books</h2>
      </div>
      <p className="muted small">Every book you can ask for, and where each request stands.</p>

      <FilterBar
        searchValue={filters.q}
        onSearchChange={(q) => updateFilters({ q })}
        searchPlaceholder="Search title, author or ISBN"
        filters={[
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
        rows={rows}
        loading={items.loading}
        error={items.error}
        emptyMessage="No books match these filters."
        onRetry={() => loadItems()}
      />
      <Pagination page={page} size={PAGE_SIZE} total={total} onPageChange={setPage} />
    </Card>
  );
}
