import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import { useToast } from './ToastContext.jsx';
import { listAllCollections } from '../api/collections.js';
import { createEntitlement } from '../api/entitlements.js';
import { canRequestScope, renderEntitlementStatus, useInFlightIds } from './entitlementFields.jsx';

const PAGE_SIZE = 20;

/**
 * Every collection across every publisher, tagged with this institution's own status for the
 * collection as a whole, against GET /api/admin/v1/collections - the collection counterpart of
 * the books table in InstitutionCatalogueBrowser, split out for the same reason
 * RequestScopeForm was: that file was already at the line budget.
 */
export default function CollectionRequestBrowser({ institutionId }) {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [collections, setCollections] = useState({
    list: [],
    total: 0,
    loading: true,
    error: null,
  });
  const requestingIds = useInFlightIds();

  function load(signal) {
    setCollections((c) => ({ ...c, loading: true, error: null }));
    return listAllCollections({ institutionId, page, size: PAGE_SIZE }, { signal })
      .then((data) =>
        setCollections({ list: data.items, total: data.total, loading: false, error: null })
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setCollections((c) => ({ ...c, loading: false, error }));
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, institutionId]);

  async function handleRequest(collection) {
    if (requestingIds.has(collection.id)) return;
    requestingIds.start(collection.id);
    try {
      await createEntitlement(institutionId, { scopeType: 'COLLECTION', scopeId: collection.id });
      toast.saved('Requested.');
      load();
    } catch (error) {
      toast.failed(error);
    } finally {
      requestingIds.finish(collection.id);
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'publisherId', label: 'Publisher' },
    {
      key: 'entitlementStatus',
      label: 'Your status',
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
            onClick={() => handleRequest(row)}
          >
            Request
          </button>
        ) : null,
    },
  ];

  return (
    <section className="card">
      <h2>Collections</h2>
      <p className="muted">
        Every collection you can ask for as a package, and where each request stands.
      </p>
      <DataTable
        columns={columns}
        rows={collections.list}
        loading={collections.loading}
        error={collections.error}
        emptyMessage="No collections yet."
        onRetry={() => load()}
      />
      <Pagination page={page} size={PAGE_SIZE} total={collections.total} onPageChange={setPage} />
    </section>
  );
}
