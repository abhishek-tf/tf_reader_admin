import StatusBadge from '../ui/StatusBadge.jsx';

const SCOPE_LABEL = { PUBLISHER: 'Publisher', COLLECTION: 'Collection', ITEM: 'Book' };

function formatDate(value) {
  return value ?? '—';
}

/** Columns for one institution's entitlements, matching Stitch's "Institution & Country"
 * layout — used by the Institution detail page's own read-only entitlements table. See
 * `entitlementLedgerColumns.jsx` for the fuller, action-bearing version the Entitlements admin
 * screen uses instead. */
export const ENTITLEMENT_COLUMNS = [
  {
    key: 'scope',
    label: 'Scope',
    render: (row) => (
      <div className="table-entity-text">
        <span className="type-chip">{SCOPE_LABEL[row.scopeType] ?? row.scopeType}</span>
        <span className="table-entity-sub">{row.scopeLabel ?? row.scopeId}</span>
      </div>
    ),
  },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'resolvedItemCount',
    label: 'Books',
    render: (row) => `${row.resolvedItemCount} book${row.resolvedItemCount === 1 ? '' : 's'}`,
  },
  {
    key: 'copies',
    label: 'Copies',
    render: (row) => (row.copyLimited ? row.copies : 'Unlimited'),
  },
  { key: 'loanPeriodDays', label: 'Loan period', render: (row) => `${row.loanPeriodDays} days` },
  { key: 'validFrom', label: 'Valid from', render: (row) => formatDate(row.validFrom) },
  { key: 'validTo', label: 'Valid to', render: (row) => formatDate(row.validTo) },
];
