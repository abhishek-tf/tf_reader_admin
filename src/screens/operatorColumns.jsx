import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge.jsx';

function initialsOf(name, email) {
  const source = name?.trim() || email || '';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/** Whichever scope dimension the role uses, resolved to its real name via `scopeNames` (see
 * useOperators.js) — a full-access operator is confined to neither. */
function ScopeCell({ operator, scopeNames }) {
  if (operator.scopePublisherId) {
    return (
      <div className="table-entity-text">
        <span className="code-chip-plain">{operator.scopePublisherId}</span>
        <span className="table-entity-sub">
          {scopeNames.publishers[operator.scopePublisherId] ?? '—'}
        </span>
      </div>
    );
  }
  if (operator.scopeInstitutionId) {
    return (
      <div className="table-entity-text">
        <span className="code-chip-plain">{operator.scopeInstitutionId}</span>
        <span className="table-entity-sub">
          {scopeNames.institutions[operator.scopeInstitutionId] ?? '—'}
        </span>
      </div>
    );
  }
  return <span className="row-link-emphasis">Global (all entities)</span>;
}

/**
 * The table's columns, matching Stitch's "Operator Name & Email" entity cell and "Assigned
 * Scope (Publisher / Institution)" column. At module level as a builder function of its
 * arguments, since six columns with a two-button actions cell is most of a screen's worth of
 * lines on its own.
 */
export function buildOperatorColumns({ currentUserId, pendingId, scopeNames, onDeactivate }) {
  return [
    {
      key: 'name',
      label: 'Operator name & email',
      render: (row) => (
        <div className="table-entity">
          <span className="table-entity-avatar" aria-hidden="true">
            {initialsOf(row.name, row.email)}
          </span>
          <div className="table-entity-text">
            <span className="row-link-emphasis">{row.name}</span>
            <span className="table-entity-sub code-chip-plain">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`role-chip${row.role === 'SUPER_ADMIN' ? '' : ' role-chip-muted'}`}>
          {row.role}
        </span>
      ),
    },
    {
      key: 'scope',
      label: 'Assigned scope (publisher / institution)',
      render: (row) => <ScopeCell operator={row} scopeNames={scopeNames} />,
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="row-buttons" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
          {/* The row travels with the link: there is no endpoint to fetch one operator by id,
              so the edit screen has no other way to get it. */}
          {/* .btn, not .btn-ghost: the border-less ghost style reads as plain bold text next
              to Deactivate's bordered pill, not as a second button of equal weight. */}
          <Link className="btn btn-sm" to={`/operators/${row.id}/edit`} state={{ operator: row }}>
            Edit
          </Link>
          {/* Nothing server side stops an operator disabling their own account, and doing it
              by accident locks them out on their next token refresh. .btn-placeholder-sm, not
              plain text: same box model as the Deactivate button it replaces, so Edit still
              lines up with every other row's instead of the column shifting per row. */}
          {row.id === currentUserId ? (
            <span className="btn-placeholder-sm">This is you</span>
          ) : (
            <button
              type="button"
              className="btn btn-danger-ghost btn-sm"
              disabled={pendingId === row.id}
              onClick={() => onDeactivate(row)}
            >
              {pendingId === row.id ? 'Saving...' : 'Deactivate'}
            </button>
          )}
        </div>
      ),
    },
  ];
}
