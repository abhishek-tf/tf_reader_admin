import StatusBadge from '../ui/StatusBadge.jsx';

// Up to three letters for a tenant row's avatar chip, from its publisher code — same rule as
// the Publishers table, since a tenant is really a publisher's own infrastructure record.
function initialsOf(code) {
  return (code ?? '').slice(0, 3).toUpperCase();
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
}

/**
 * Columns for the Tenants table. The backend has not shipped a Tenant shape yet (see
 * api/tenants.js), so every field here is read defensively with a `—` fallback — nothing on
 * this table should ever throw on a missing field, only show a dash for it.
 */
export function buildTenantColumns() {
  return [
    {
      key: 'publisher',
      label: 'Publisher',
      render: (row) => (
        <div className="table-entity">
          <span className="table-entity-avatar" aria-hidden="true">
            {initialsOf(row.publisherCode)}
          </span>
          <div className="table-entity-text">
            <span className="row-link-emphasis">{row.publisherName ?? row.publisherId ?? '—'}</span>
            {row.publisherCode ? (
              <span className="table-entity-sub">{row.publisherCode}</span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'databaseRef',
      label: 'Database',
      render: (row) => row.databaseRef ?? '—',
    },
    {
      key: 'region',
      label: 'Region',
      render: (row) => row.region ?? '—',
    },
    {
      key: 'healthStatus',
      label: 'Key vault health',
      render: (row) => (row.healthStatus ? <StatusBadge status={row.healthStatus} /> : '—'),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
  ];
}
