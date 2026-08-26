import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { deactivateAdminUser, listAdminUsers } from '../api/adminUsers.js';

const PAGE_SIZE = 20;

// The same wording the header shows. SUPER_ADMIN is not a phrase to show an operator.
const ROLE_LABEL = {
  SUPER_ADMIN: 'Full access',
  PUBLISHER_ADMIN: 'Publisher admin',
  INSTITUTION_ADMIN: 'Institution admin',
};

/** Whichever scope dimension the role uses. A full-access operator is confined to neither. */
function scopeOf(operator) {
  return operator.scopePublisherId ?? operator.scopeInstitutionId ?? '—';
}

/**
 * The table's columns. At module level because it is a plain function of its arguments, and
 * because six columns with a two-button actions cell is most of a screen's worth of lines.
 */
function buildColumns({ currentUserId, pendingId, onDeactivate }) {
  return [
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role', render: (row) => ROLE_LABEL[row.role] ?? row.role },
    { key: 'scope', label: 'Scope', render: scopeOf },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: '_actions',
      label: '',
      render: (row) => (
        <div className="row-buttons" style={{ marginBottom: 0 }}>
          {/* The row travels with the link: there is no endpoint to fetch one operator by id,
              so the edit screen has no other way to get it. */}
          <Link className="btn" to={`/operators/${row.id}/edit`} state={{ operator: row }}>
            Edit
          </Link>
          {/* Nothing server side stops an operator disabling their own account, and doing it
              by accident locks them out on their next token refresh. */}
          {row.id === currentUserId ? (
            <span className="muted small">This is you</span>
          ) : (
            <button
              type="button"
              className="btn"
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

/** The operators page: a paged list and deactivation. Create and edit are pages of their own. */
export default function OperatorsScreen() {
  const toast = useToast();
  const { user } = useAuth();

  const [page, setPage] = useState(0);
  const [list, setList] = useState({ items: [], total: 0, loading: true, error: null });
  // The row a Deactivate click is waiting to be confirmed for. Not window.confirm: a native
  // dialog is silently blocked in several embedded browsers, which makes the button look dead.
  const [confirming, setConfirming] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  // There is no q, status or role parameter on this endpoint, so page and size are the whole
  // query and there is nothing else for a change to invalidate.
  function load() {
    setList((current) => ({ ...current, loading: true, error: null }));
    return listAdminUsers({ page, size: PAGE_SIZE })
      .then((data) =>
        setList({ items: data.items, total: data.total, loading: false, error: null })
      )
      .catch((error) => setList((current) => ({ ...current, loading: false, error })));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load reads page from state directly
  }, [page]);

  async function confirmDeactivate() {
    const target = confirming;
    setConfirming(null);
    setPendingId(target.id);
    try {
      // Answers 204 with no body, so there is no updated record to patch the row with.
      await deactivateAdminUser(target.id);
      toast.saved('Operator deactivated.');
      await load();
    } catch (failure) {
      toast.failed(failure);
    } finally {
      setPendingId(null);
    }
  }

  const columns = buildColumns({
    currentUserId: user?.id,
    pendingId,
    onDeactivate: (row) => setConfirming(row),
  });

  return (
    <div className="stack">
      <section className="card">
        <div className="row-buttons" style={{ justifyContent: 'space-between' }}>
          <h1>Operators</h1>
          <Link className="btn btn-primary" to="/operators/new">
            Add operator
          </Link>
        </div>
        <p className="muted">
          The people who run this console. Adding, changing or deactivating one needs full access.
        </p>

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          error={list.error}
          emptyMessage="No operators yet. Add one to see it here."
          onRetry={load}
        />

        {!list.error && list.total > 0 ? (
          <Pagination page={page} size={PAGE_SIZE} total={list.total} onPageChange={setPage} />
        ) : null}
      </section>

      {confirming ? (
        <section className="card">
          <h2>Deactivate {confirming.email}?</h2>
          <p className="muted">
            They lose access on their next request. The record is kept, so the audit trail can still
            name them, and their status becomes Disabled.
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={confirmDeactivate}>
              Deactivate
            </button>
            <button type="button" className="btn" onClick={() => setConfirming(null)}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
