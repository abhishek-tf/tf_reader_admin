import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import { useToast } from './ToastContext.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { createEntitlement } from '../api/entitlements.js';
import {
  CONTENT_TYPE_OPTIONS,
  TIER_OPTIONS,
  TIER_LABEL,
  canRequestScope,
  renderEntitlementStatus,
  useInFlightIds,
} from './entitlementFields.jsx';

const PAGE_SIZE = 20;

/**
 * Every book an institution admin can ask for, tagged with where their request stands, against
 * GET /api/admin/v1/catalogue-items. The item-scope counterpart of CollectionRequestBrowser,
 * split out of InstitutionCatalogueBrowser since that file was over the line budget.
 */
export default function ItemRequestBrowser({ institutionId }) {
  const toast = useToast();
  const [filters, setFilters] = useState({ q: '', contentType: '', accessTier: '' });
  const [page, setPage] = useState(0);
  const [items, setItems] = useState({ list: [], total: 0, loading: true, error: null });
  const requestingIds = useInFlightIds();

  function loadItems(signal) {
    setItems((c) => ({ ...c, loading: true, error: null }));
    return listCatalogueItems({ ...filters, institutionId, page, size: PAGE_SIZE }, { signal })
      .then((data) =>
        setItems({ list: data.items, total: data.total, loading: false, error: null })
      )
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
  }, [filters, page, institutionId]);

  function updateFilters(patch) {
    setFilters((c) => ({ ...c, ...patch }));
    setPage(0);
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
      key: 'entitlementStatus',
      label: 'Your status',
      // CatalogueItem.entitlementStatus is lowercase (none/pending/active/revoked); StatusBadge
      // expects the uppercase EntitlementStatus enum it shares with every other status badge.
      // renderEntitlementStatus handles the uppercasing and the null/'none' case identically
      // to CollectionRequestBrowser's own "Your status" column.
      render: (row) => renderEntitlementStatus(row.entitlementStatus),
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        canRequestScope(row.entitlementStatus) ? (
          <button
            type="button"
            className="btn"
            disabled={requestingIds.has(row.id)}
            onClick={() => handleRequestItem(row)}
          >
            Request
          </button>
        ) : null,
    },
  ];

  return (
    <section className="card">
      <h1>Browse &amp; request</h1>
      <p className="muted">Every book you can ask for, and where each request stands.</p>

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
        rows={items.list}
        loading={items.loading}
        error={items.error}
        emptyMessage="No books match these filters."
        onRetry={() => loadItems()}
      />
      <Pagination page={page} size={PAGE_SIZE} total={items.total} onPageChange={setPage} />
    </section>
  );
}
