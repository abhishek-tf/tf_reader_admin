import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge.jsx';

// Up to three letters for a tenant row's avatar chip, from its publisher code - same rule as
// the Publishers table.
function initialsOf(code) {
  return (code ?? '').slice(0, 3).toUpperCase();
}

/**
 * Columns for the Tenants table, against the real Tenant shape: { id, code, name, vaultRef,
 * connectionHealth }. There is no mongoUri on this shape (the contract has no way to read a
 * publisher's current connection string back - only whether one is configured, via
 * connectionHealth), so this table shows health and "vault key configured", never a value.
 */
export function buildTenantColumns() {
  return [
    {
      key: 'publisher',
      label: 'Publisher',
      render: (row) => (
        <div className="table-entity">
          <span className="table-entity-avatar" aria-hidden="true">
            {initialsOf(row.code)}
          </span>
          <div className="table-entity-text">
            <Link className="row-link-emphasis" to={`/publishers/${row.id}`}>
              {row.name}
            </Link>
            <span className="table-entity-sub">{row.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'connectionHealth',
      label: 'Database connection',
      render: (row) => <StatusBadge status={row.connectionHealth} />,
    },
    {
      key: 'vaultRef',
      label: 'Vault key',
      render: (row) => (row.vaultRef ? 'Configured' : "T&F's shared key"),
    },
  ];
}
