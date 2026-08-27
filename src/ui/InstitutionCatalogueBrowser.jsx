import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import CollectionRequestBrowser from './CollectionRequestBrowser.jsx';
import RequestScopeForm from './RequestScopeForm.jsx';
import StatusBadge from './StatusBadge.jsx';
import { useToast } from './ToastContext.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { listEntitlements, createEntitlement } from '../api/entitlements.js';
import {
  CONTENT_TYPE_OPTIONS,
  TIER_OPTIONS,
  TIER_LABEL,
  canRequestScope,
} from './entitlementFields.js';

const PAGE_SIZE = 20;

/**
 * An institution admin's own view: every book they can ask for, tagged with where their
 * request stands, every collection the same way (via CollectionRequestBrowser, against GET
 * /api/admin/v1/collections), and a plain id field for a publisher — there is still no
 * browsable "every publisher, tagged with status" list, the same reason BookForm uses a plain
 * id for a publisher elsewhere in the console.
 */
export default function InstitutionCatalogueBrowser({ institutionId }) {
  const toast = useToast();
  const [filters, setFilters] = useState({ q: '', contentType: '', accessTier: '' });
  const [page, setPage] = useState(0);
  const [items, setItems] = useState({ list: [], total: 0, loading: true, error: null });
  const [scopeEntitlements, setScopeEntitlements] = useState({
    list: [],
    loading: true,
    error: null,
  });

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

  function loadScopeEntitlements(signal) {
    setScopeEntitlements((c) => ({ ...c, loading: true, error: null }));
    return listEntitlements(institutionId, { size: 100 }, { signal })
      .then((data) =>
        setScopeEntitlements({
          // COLLECTION requests now show inline in CollectionRequestBrowser's own status
          // column - PUBLISHER is the only scope left with no other place to show status.
          list: data.items.filter((e) => e.scopeType === 'PUBLISHER'),
          loading: false,
          error: null,
        })
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setScopeEntitlements((c) => ({ ...c, loading: false, error }));
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    loadScopeEntitlements(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  function updateFilters(patch) {
    setFilters((c) => ({ ...c, ...patch }));
    setPage(0);
  }

  async function handleRequestItem(item) {
    try {
      await createEntitlement(institutionId, { scopeType: 'ITEM', scopeId: item.id });
      toast.saved('Requested.');
      loadItems();
    } catch (error) {
      toast.failed(error);
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
      render: (row) =>
        row.entitlementStatus === 'none' ? (
          <span className="muted">Not requested</span>
        ) : (
          <StatusBadge status={row.entitlementStatus.toUpperCase()} />
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        canRequestScope(row.entitlementStatus) ? (
          <button type="button" className="btn" onClick={() => handleRequestItem(row)}>
            Request
          </button>
        ) : null,
    },
  ];

  const scopeColumns = [
    { key: 'scopeLabel', label: 'Publisher', render: (row) => row.scopeLabel ?? row.scopeId },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="stack">
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

      <CollectionRequestBrowser institutionId={institutionId} />

      <RequestScopeForm institutionId={institutionId} onRequested={loadScopeEntitlements} />

      <section className="card">
        <h2>Your publisher requests</h2>
        <DataTable
          columns={scopeColumns}
          rows={scopeEntitlements.list}
          loading={scopeEntitlements.loading}
          error={scopeEntitlements.error}
          emptyMessage="No publisher requests yet."
          onRetry={() => loadScopeEntitlements()}
        />
      </section>
    </div>
  );
}
