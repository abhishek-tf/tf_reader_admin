import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge.jsx';
import Icon from '../ui/Icon.jsx';

const TYPE_LABEL = {
  ACADEMIC: 'Academic',
  PUBLIC: 'Public',
  SCHOOL: 'School',
  SPECIAL: 'Special',
  GOVERNMENT: 'Government',
  RESEARCH: 'Research',
  CORPORATE: 'Corporate',
};

// Up to two letters for an institution's table-row avatar chip, from its code — a code is
// always present and short, where a name is neither guaranteed nor bounded.
function initialsOf(code) {
  return (code ?? '').slice(0, 2).toUpperCase();
}

function formatCount(value) {
  return value == null ? null : value.toLocaleString();
}

/**
 * Columns for the Institutions table, matching Stitch's "Institution & Country" layout. Every
 * field here is a real one on `AdminInstitution` (wokay-api.yaml) — `type` and
 * `summary.{entitlementCount,accessibleItemCount}` are all returned on the list endpoint itself,
 * not fetched per row, so nothing here is a guess or an extra request.
 *
 * The row name is a real `Link` to that institution's own detail page (`/institutions/:id`),
 * not a click handler — same as a publisher's name on the Publishers table. `onToggleStatus`
 * is the Suspend/Reactivate action; `pendingIds` disables it row by row while that row's own
 * request is in flight.
 */
export function buildInstitutionColumns({ onToggleStatus, pendingIds }) {
  return [
    {
      key: 'name',
      label: 'Institution & Country',
      render: (row) => (
        <div className="table-entity">
          {row.branding?.logoUrl ? (
            <span className="table-entity-logo" aria-hidden="true">
              <img src={row.branding.logoUrl} alt="" />
            </span>
          ) : (
            <span className="table-entity-avatar" aria-hidden="true">
              {initialsOf(row.code)}
            </span>
          )}
          <div className="table-entity-text">
            <Link to={`/institutions/${row.id}`} className="row-link row-link-emphasis">
              {row.name}
            </Link>
            <span className="table-entity-sub">
              <Icon name="location_on" style={{ fontSize: 13 }} />
              {[row.city, row.country].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>
      ),
    },
    { key: 'code', label: 'Code', render: (row) => <span className="code-chip">{row.code}</span> },
    {
      key: 'type',
      label: 'Type',
      render: (row) => <span className="type-chip">{TYPE_LABEL[row.type] ?? row.type}</span>,
    },
    {
      key: 'accessibleItemCount',
      label: 'Accessible items',
      render: (row) => {
        const count = formatCount(row.summary?.accessibleItemCount);
        return count == null ? (
          '—'
        ) : (
          <div className="table-entity-text">
            <span className="row-link-emphasis">{count}</span>
            <span className="table-entity-sub">items</span>
          </div>
        );
      },
    },
    {
      key: 'entitlementCount',
      label: 'Entitlements',
      render: (row) => formatCount(row.summary?.entitlementCount) ?? '—',
    },
    {
      key: 'catalogueVersion',
      label: 'Catalogue ver.',
      render: (row) => <span className="code-chip-plain">v{row.catalogueVersion}</span>,
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="row-buttons" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
          <Link
            className="btn-icon-ghost"
            to={`/institutions/${row.id}/edit`}
            aria-label={`Edit ${row.name}`}
            title="Edit"
          >
            <Icon name="edit" />
          </Link>
          <button
            type="button"
            className="btn-icon-ghost"
            disabled={pendingIds.has(row.id)}
            onClick={() => onToggleStatus(row)}
            aria-label={row.status === 'ACTIVE' ? `Suspend ${row.name}` : `Reactivate ${row.name}`}
            title={row.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
          >
            <Icon name={row.status === 'ACTIVE' ? 'pause_circle' : 'play_circle'} />
          </button>
        </div>
      ),
    },
  ];
}
