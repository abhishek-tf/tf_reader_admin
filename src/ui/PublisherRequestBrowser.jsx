import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import StatusBadge from './StatusBadge.jsx';
import RequestScopeForm from './RequestScopeForm.jsx';
import { listEntitlements } from '../api/entitlements.js';

/**
 * The publisher-scope counterpart of CollectionRequestBrowser, except there is still no
 * browsable "every publisher, tagged with status" list (RequestScopeForm's own doc comment),
 * so this pairs the raw-id request form with the resulting request list right below it. Split
 * out of InstitutionCatalogueBrowser since that file was over the line budget.
 */
export default function PublisherRequestBrowser({ institutionId }) {
  const [scopeEntitlements, setScopeEntitlements] = useState({
    list: [],
    loading: true,
    error: null,
  });

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
