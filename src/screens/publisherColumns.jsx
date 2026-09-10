import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge.jsx';

// Up to three letters for a publisher's table-row avatar chip, from its code — a code is
// always present and short (CRCP, RTLG), where a name is neither guaranteed nor bounded.
function initialsOf(code) {
  return (code ?? '').slice(0, 3).toUpperCase();
}

export function pluralize(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

// Not sortable: the contract's list endpoint takes no sort parameter. The Entitlement Status
// column is appended only once an institution is selected — the contract only resolves that
// field per publisher when institutionId is on the request, and reads null otherwise, so the
// column would be a wall of dashes without that filter active.
export function buildPublisherColumns(selectedInstitutionId) {
  const base = [
    {
      key: 'name',
      label: 'Publisher',
      render: (row) => (
        <div className="table-entity">
          <span className="table-entity-avatar" aria-hidden="true">
            {initialsOf(row.code)}
          </span>
          <div className="table-entity-text">
            <Link to={`/publishers/${row.id}`} className="row-link row-link-emphasis">
              {row.name}
            </Link>
            {/* Every publisher in this catalogue is a Taylor & Francis imprint — a fact about
                the console, not a per-row field, so it's fine as a fixed second line rather
                than something read off the record. */}
            <span className="table-entity-sub">Taylor &amp; Francis Group</span>
          </div>
        </div>
      ),
    },
    { key: 'code', label: 'Code', render: (row) => <span className="code-chip">{row.code}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'collectionCount',
      label: 'Collections',
      render: (row) =>
        row.collectionCount == null ? (
          '—'
        ) : (
          <Link to={`/publishers/${row.id}`} className="row-link">
            {pluralize(row.collectionCount, 'collection')}
          </Link>
        ),
    },
    {
      key: 'itemCount',
      label: 'Books',
      render: (row) => (row.itemCount == null ? '—' : pluralize(row.itemCount, 'item')),
    },
  ];
  if (selectedInstitutionId) {
    base.push({
      key: 'entitlementStatus',
      label: 'Entitlement Status',
      render: (row) =>
        row.entitlementStatus ? <StatusBadge status={row.entitlementStatus} /> : '—',
    });
  }
  base.push({
    key: 'actions',
    label: 'Actions',
    render: (row) => (
      <Link className="btn btn-ghost btn-sm" to={`/publishers/${row.id}/edit`}>
        Edit
      </Link>
    ),
  });
  return base;
}
