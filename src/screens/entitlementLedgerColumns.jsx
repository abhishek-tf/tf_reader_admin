import StatusBadge from '../ui/StatusBadge.jsx';
import Icon from '../ui/Icon.jsx';

const SCOPE_LABEL = { COLLECTION: 'Collection', PUBLISHER: 'Publisher', ITEM: 'Book' };

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Columns for one institution's entitlements ledger (EntitlementsAdminScreen), matching
 * Stitch's "Institutional Entitlements" table. Every field is real, straight off `Entitlement`
 * (wokay-api.yaml) — no "Institution" column, unlike Stitch's own cross-institution mock-up:
 * this table is already scoped to one institution (the contract has no endpoint to list across
 * all of them), so repeating that institution's name on every row would say nothing a real
 * cross-institution table would.
 *
 * Actions are gated on status: PENDING gets Approve/Reject (the status endpoint's only two
 * valid transitions); ACTIVE/SUSPENDED get Amend/Revoke (the terms-update and revoke
 * endpoints, neither of which cares what the current status is); REVOKED keeps Amend only —
 * status itself is terminal (no un-revoke), but the terms-update endpoint still works on it.
 *
 * Not to be confused with `entitlementColumns.jsx`'s `ENTITLEMENT_COLUMNS` - a plainer,
 * read-only column set the Institution detail page uses for the same schema.
 */
export function buildEntitlementColumns({ onApprove, onReject, onAmend, onRevoke, pendingIds }) {
  return [
    {
      key: 'scope',
      label: 'Scope (type & target)',
      render: (row) => (
        <div className="table-entity-text">
          <span className="row-link-emphasis">{row.scopeLabel ?? row.scopeId}</span>
          <span className="table-entity-sub">
            <span className="type-chip">{SCOPE_LABEL[row.scopeType] ?? row.scopeType}</span>
            <span className="code-chip-plain">{row.scopeId}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'copies',
      label: 'Concurrency / copies',
      render: (row) =>
        row.copyLimited ? (
          <span>{row.copies} copies</span>
        ) : (
          <span className="format-chip">
            <Icon name="all_inclusive" style={{ fontSize: 13 }} />
            Unlimited
          </span>
        ),
    },
    { key: 'loanPeriodDays', label: 'Loan period', render: (row) => `${row.loanPeriodDays} days` },
    {
      key: 'validity',
      label: 'Validity window',
      render: (row) => (
        <div className="table-entity-text">
          <span>{formatDate(row.validFrom) ?? '—'}</span>
          <span className="table-entity-sub">
            {row.validTo ? `to ${formatDate(row.validTo)}` : 'No end date'}
          </span>
        </div>
      ),
    },
    {
      key: 'resolvedItemCount',
      label: 'Catalog items',
      render: (row) => (
        <div className="table-entity-text">
          <span className="row-link-emphasis">
            {row.resolvedItemCount} item{row.resolvedItemCount === 1 ? '' : 's'}
          </span>
          <span className="table-entity-sub">Non-additive</span>
        </div>
      ),
    },
    {
      key: 'version',
      label: 'Version',
      render: (row) => <span className="code-chip-plain">v{row.version}</span>,
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        const busy = pendingIds.has(row.id);
        if (row.status === 'PENDING') {
          return (
            <div className="row-buttons" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() => onApprove(row)}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={busy}
                onClick={() => onReject(row)}
              >
                Reject
              </button>
            </div>
          );
        }
        if (row.status === 'ACTIVE' || row.status === 'SUSPENDED') {
          return (
            <div className="row-buttons" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
              {/* .btn, not .btn-ghost: the border-less ghost style reads as plain bold text
                  next to Revoke's bordered pill, not as a second button of equal weight. */}
              <button
                type="button"
                className="btn btn-sm"
                disabled={busy}
                onClick={() => onAmend(row)}
              >
                Amend
              </button>
              <button
                type="button"
                className="btn btn-danger-ghost btn-sm"
                disabled={busy}
                onClick={() => onRevoke(row)}
              >
                Revoke
              </button>
            </div>
          );
        }
        if (row.status === 'REVOKED') {
          // Revoking never deletes the grant, and PUT .../entitlements/{id} amends its terms
          // without touching status - there's a real, working endpoint behind this even though
          // the grant itself stays REVOKED (there's no un-revoke; a fresh grant is the only way
          // to restore access). SUPER_ADMIN only, same as every other action on this screen -
          // this whole page is already gated to that role by EntitlementsScreen.
          return (
            <div className="row-buttons" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
              {/* .btn, not .btn-ghost: the border-less ghost style reads as plain bold text
                  next to Revoke's bordered pill, not as a second button of equal weight. */}
              <button
                type="button"
                className="btn btn-sm"
                disabled={busy}
                onClick={() => onAmend(row)}
              >
                Amend
              </button>
            </div>
          );
        }
        return <span className="muted small">—</span>;
      },
    },
  ];
}
