import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import { listEntitlements } from '../api/entitlements.js';
import { listAuditLogs } from '../api/auditLogs.js';
import { fetchAllPages } from '../api/client.js';

function describeActivity(row) {
  if (row.action === 'CREATE') return `Requested (${row.after?.scopeType ?? 'scope'})`;
  if (row.action === 'STATUS') {
    const status = row.after?.status;
    if (status === 'ACTIVE') return 'Approved';
    if (status === 'REVOKED') return 'Rejected';
    return `Status changed to ${status ?? '?'}`;
  }
  if (row.action === 'UPDATE') return 'Terms updated';
  return row.action;
}

const COLUMNS = [
  {
    key: 'at',
    label: 'Date and time',
    render: (row) => <span title={row.at}>{new Date(row.at).toLocaleString()}</span>,
  },
  { key: 'actorEmail', label: 'Actor', render: (row) => row.actorEmail ?? row.actorId ?? '—' },
  { key: 'activity', label: 'What happened', render: describeActivity },
];

/**
 * History of what happened to one institution's entitlements — requests, approvals,
 * rejections. There is no institution filter on GET /audit-logs, and only the CREATE row's
 * `after` carries institutionId at all (STATUS rows only record the new status), so this is
 * built the only way that is actually correct: load this institution's own entitlement ids
 * first, then fetch entityType=ENTITLEMENT audit rows and keep only the ones whose entityId is
 * one of them. The same fetch-broad-filter-narrow shape this screen's pending list already uses.
 */
export default function EntitlementActivityLog({ institutionId }) {
  const [activity, setActivity] = useState({ list: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setActivity((c) => ({ ...c, loading: true, error: null }));
      try {
        const entitlements = await fetchAllPages((page) =>
          listEntitlements(institutionId, { page, size: 100 }, { signal: controller.signal })
        );
        const entitlementIds = new Set(entitlements.map((e) => e.id));

        const auditRows = await fetchAllPages((page) =>
          listAuditLogs({ entityType: 'ENTITLEMENT', page, size: 100 })
        );
        const matched = auditRows.filter((row) => entitlementIds.has(row.entityId));

        if (cancelled) return;
        setActivity({ list: matched, loading: false, error: null });
      } catch (error) {
        if (cancelled || error.name === 'AbortError') return;
        setActivity((c) => ({ ...c, loading: false, error }));
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [institutionId]);

  return (
    <section className="card">
      <h2>Activity</h2>
      <DataTable
        columns={COLUMNS}
        rows={activity.list}
        loading={activity.loading}
        error={activity.error}
        emptyMessage="No entitlement activity for this institution yet."
      />
    </section>
  );
}
