import { useState } from 'react';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { buildOperatorColumns } from './operatorColumns.jsx';

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
  { value: 'PUBLISHER_ADMIN', label: 'PUBLISHER_ADMIN' },
  { value: 'INSTITUTION_ADMIN', label: 'INSTITUTION_ADMIN' },
];
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'DISABLED', label: 'Disabled' },
];

/** The "Admin Operators" tab: Stitch's own search-and-filter deck above the operator pool
 * table, plus the deactivate confirmation. `o` (from useOperators, owned by
 * OperatorsAuditScreen so the create/edit modal's Outlet context can reload the same instance)
 * is passed in rather than called here. */
export default function OperatorsTabPanel({ o }) {
  const { user } = useAuth();
  const toast = useToast();
  const [confirming, setConfirming] = useState(null);

  async function handleConfirmDeactivate() {
    const target = confirming;
    setConfirming(null);
    try {
      await o.deactivate(target);
      toast.saved('Operator deactivated.');
    } catch (error) {
      toast.failed(error);
    }
  }

  const columns = buildOperatorColumns({
    currentUserId: user?.id,
    pendingId: o.pendingId,
    scopeNames: o.scopeNames,
    onDeactivate: setConfirming,
  });

  return (
    <div className="stack">
      <FilterBar
        searchValue={o.filters.q}
        onSearchChange={(value) => o.changeFilter('q', value)}
        searchPlaceholder="Search operators by name or email..."
        filters={[
          {
            name: 'role',
            label: 'Role',
            value: o.filters.role,
            onChange: (value) => o.changeFilter('role', value),
            placeholder: 'All roles',
            options: ROLE_OPTIONS,
          },
          {
            name: 'status',
            label: 'Status',
            value: o.filters.status,
            onChange: (value) => o.changeFilter('status', value),
            placeholder: 'All statuses',
            options: STATUS_OPTIONS,
          },
        ]}
        trailing={
          <button type="button" className="btn-reset-link" onClick={o.clearFilters}>
            Reset
          </button>
        }
      />

      <DataTable
        columns={columns}
        rows={o.rows}
        loading={o.loading}
        error={o.error}
        onRetry={o.reload}
        emptyMessage={
          o.searching
            ? 'No operators match this filter.'
            : 'No operators yet. Add one to see it here.'
        }
        header={
          !o.loading && !o.error ? (
            <span>
              {o.total} operator{o.total === 1 ? '' : 's'} listed
            </span>
          ) : null
        }
      />
      {!o.error && o.total > 0 ? (
        <Pagination page={o.page} size={o.pageSize} total={o.total} onPageChange={o.setPage} />
      ) : null}

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={confirming ? `Deactivate ${confirming.email}?` : ''}
        footer={
          <div className="form-actions">
            <Button variant="dangerGhost" onClick={handleConfirmDeactivate}>
              Deactivate
            </Button>
            <Button onClick={() => setConfirming(null)}>Cancel</Button>
          </div>
        }
      >
        <p className="muted">
          They lose access on their next request. The record is kept, so the audit trail can still
          name them, and their status becomes Disabled.
        </p>
      </Modal>
    </div>
  );
}
