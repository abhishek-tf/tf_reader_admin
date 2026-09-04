import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import FilterBar from './FilterBar.jsx';
import { useToast } from './ToastContext.jsx';
import { listPublishers } from '../api/publishers.js';
import { createEntitlement } from '../api/entitlements.js';
import { canRequestScope, renderEntitlementStatus, useInFlightIds } from './entitlementFields.jsx';

const PAGE_SIZE = 20;

/**
 * Every active publisher, tagged with this institution's own status for the publisher as a
 * whole, against GET /api/admin/v1/publishers?institutionId=... - the publisher counterpart of
 * ItemRequestBrowser and CollectionRequestBrowser, now that Workstream 3 added the
 * entitlementStatus field this screen was waiting on. Replaces the old raw-id text form
 * (RequestScopeForm.jsx, now deleted) and the separate "your requests" list it needed, since
 * status and the request action both live in this one table now, the same shape as the other
 * two scopes.
 */
export default function PublisherRequestBrowser({ institutionId }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [publishers, setPublishers] = useState({ list: [], total: 0, loading: true, error: null });
  const requestingIds = useInFlightIds();

  function load(signal) {
    setPublishers((c) => ({ ...c, loading: true, error: null }));
    return listPublishers({ q, institutionId, status: 'ACTIVE', page, size: PAGE_SIZE }, { signal })
      .then((data) =>
        setPublishers({ list: data.items, total: data.total, loading: false, error: null })
      )
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setPublishers((c) => ({ ...c, loading: false, error }));
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, institutionId]);

  async function handleRequest(publisher) {
    if (requestingIds.has(publisher.id)) return;
    requestingIds.start(publisher.id);
    try {
      await createEntitlement(institutionId, { scopeType: 'PUBLISHER', scopeId: publisher.id });
      toast.saved('Requested.');
      load();
    } catch (error) {
      toast.failed(error);
    } finally {
      requestingIds.finish(publisher.id);
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'itemCount', label: 'Books' },
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
      <h2>Publishers</h2>
      <p className="muted">
        Every publisher you can ask for as a whole, and where each request stands.
      </p>
      <FilterBar
        searchValue={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(0);
        }}
        searchPlaceholder="Search publisher name or code"
      />
      <DataTable
        columns={columns}
        rows={publishers.list}
        loading={publishers.loading}
        error={publishers.error}
        emptyMessage="No publishers match this search."
      />
      <Pagination page={page} size={PAGE_SIZE} total={publishers.total} onPageChange={setPage} />
    </section>
  );
}
