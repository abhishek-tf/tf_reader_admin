import { useState } from 'react';
import { Link } from 'react-router-dom';

import DataTable from '../ui/DataTable';
import FilterBar from '../ui/FilterBar';
import Pagination from '../ui/Pagination';
import StatusBadge from '../ui/StatusBadge';
import TextField from '../ui/TextField';
import { useToast } from '../ui/ToastContext';
import InstitutionSummaryPanel from '../screens/InstitutionSummaryPanel';
import { useInstitutions } from '../screens/useInstitutions';
import { getInstitution, setInstitutionStatus } from '../api/institution';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'RETIRED', label: 'Retired' },
];

/** The institutions page: a filterable list and a detail panel. Create and edit are pages. */
export default function InstitutionsScreen() {
  const list = useInstitutions();
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const [pendingStatusIds, setPendingStatusIds] = useState(() => new Set());
  // The row a Suspend/Reactivate click is waiting to be confirmed for, plus the reason text typed
  // so far. Not a window.prompt: a native browser prompt is silently blocked (returns null with
  // no dialog shown at all) in several embedded/preview browsers and webviews, which makes the
  // button look like it does nothing. An on-page confirmation has no such failure mode.
  const [statusConfirm, setStatusConfirm] = useState(null); // { institution, nextStatus, reason }

  async function selectRow(row) {
    try {
      setSelected(await getInstitution(row.id));
    } catch (e) {
      toast.failed(e);
      setSelected(row);
    }
  }

  function startStatusChange(institution) {
    if (pendingStatusIds.has(institution.id)) return; // already in flight for this row
    const nextStatus = institution.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusConfirm({ institution, nextStatus, reason: '' });
  }

  async function confirmStatusChange() {
    const { institution, nextStatus, reason } = statusConfirm;
    setStatusConfirm(null);

    setPendingStatusIds((prev) => new Set(prev).add(institution.id));
    try {
      const updated = await setInstitutionStatus(institution.id, {
        status: nextStatus,
        reason: reason.trim() || undefined,
      });
      list.patchRow(updated.id, updated);
      if (selected?.id === updated.id) setSelected(updated);
      toast.saved();
    } catch (e) {
      toast.failed(e);
    } finally {
      setPendingStatusIds((prev) => {
        const next = new Set(prev);
        next.delete(institution.id);
        return next;
      });
    }
  }

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'country', label: 'Country' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'catalogueVersion', label: 'Version' },
    {
      key: '_actions',
      label: '',
      render: (row) => (
        <div className="row-buttons" style={{ marginBottom: 0 }}>
          <button type="button" className="btn" onClick={() => selectRow(row)}>
            View
          </button>
          <button
            type="button"
            className="btn"
            disabled={pendingStatusIds.has(row.id)}
            onClick={() => startStatusChange(row)}
          >
            {pendingStatusIds.has(row.id)
              ? 'Saving...'
              : row.status === 'ACTIVE'
                ? 'Suspend'
                : 'Reactivate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack institutions-screen">
      <section className="card">
        <div className="row-buttons" style={{ justifyContent: 'space-between' }}>
          <h1>Institutions</h1>
          <Link className="btn btn-primary" to="/institutions/new">
            New institution
          </Link>
        </div>

        {/* FilterBar, not a bare input beside a SelectField: SelectField brings a label and a
            .field wrapper while the search box had neither, which left the two on different
            baselines and stretched the box to the taller one's height. Books uses the same
            control, so the two list screens now filter the same way. */}
        <FilterBar
          searchValue={list.q}
          onSearchChange={list.setQ}
          searchPlaceholder="Search by name"
          filters={[
            {
              name: 'status',
              label: 'Status',
              value: list.status,
              options: STATUS_OPTIONS,
              placeholder: 'All statuses',
              onChange: list.setStatus,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={list.items}
          loading={list.loading}
          error={list.error}
          emptyMessage="No institutions match this filter."
          onRetry={list.reload}
        />

        {!list.loading && !list.error && (
          <Pagination
            page={list.page}
            size={list.size}
            total={list.total}
            onPageChange={list.setPage}
          />
        )}
      </section>

      {statusConfirm && (
        <section className="card">
          <h2>
            Change {statusConfirm.institution.name} to{' '}
            {statusConfirm.nextStatus === 'ACTIVE' ? 'Active' : 'Suspended'}?
          </h2>
          <TextField
            label="Reason (optional)"
            name="reason"
            value={statusConfirm.reason}
            onChange={(_name, value) => setStatusConfirm((c) => ({ ...c, reason: value }))}
          />
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={confirmStatusChange}>
              Confirm
            </button>
            <button type="button" className="btn" onClick={() => setStatusConfirm(null)}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {selected && (
        <section className="card">
          <InstitutionSummaryPanel institution={selected} />
          <Link className="btn" to={`/institutions/${selected.id}/edit`}>
            Edit
          </Link>
        </section>
      )}
    </div>
  );
}
