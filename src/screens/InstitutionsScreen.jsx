import { useState } from 'react';

import DataTable from '../ui/DataTable';
import Pagination from '../ui/Pagination';
import SelectField from '../ui/SelectField';
import StatusBadge from '../ui/StatusBadge';
import TextField from '../ui/TextField';
import { useToast } from '../ui/ToastContext';
import InstitutionForm from '../screens/InstitutionForm';
import InstitutionSummaryPanel from '../screens/InstitutionSummaryPanel';
import { useInstitutions } from '../screens/useInstitutions';
import {
  createInstitution,
  getInstitution,
  setInstitutionStatus,
  updateInstitution,
} from '../api/institution';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'RETIRED', label: 'Retired' },
];

/** The institutions page: a filterable list, a create/edit form, and a detail panel. */
export default function InstitutionsScreen() {
  const list = useInstitutions();
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false); // false, 'create', or 'edit'
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

  async function handleFormSubmit(payload) {
    try {
      if (selected && editing === 'edit') {
        const updated = await updateInstitution(selected.id, payload);
        setSelected(updated);
        list.patchRow(updated.id, updated);
      } else {
        const created = await createInstitution(payload);
        setSelected(created);
        await list.reload();
      }
      toast.saved();
      setEditing(false);
    } catch (e) {
      toast.failed(e);
      throw e; // let InstitutionForm re-enable itself and, for CODE_TAKEN, show the field error
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSelected(null);
              setEditing('create');
            }}
          >
            New institution
          </button>
        </div>

        <div className="row-buttons">
          <input
            type="text"
            className="input"
            style={{ maxWidth: 280 }}
            value={list.q}
            onChange={(e) => list.setQ(e.target.value)}
            placeholder="Search by name"
            aria-label="Search by name"
          />
          <div style={{ minWidth: 200 }}>
            <SelectField
              label="Status"
              name="status"
              value={list.status}
              onChange={(_name, value) => list.setStatus(value)}
              options={STATUS_OPTIONS}
              placeholder="All statuses"
            />
          </div>
        </div>

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

      {editing && (
        <section className="card">
          <InstitutionForm
            // Forces a fresh form instance (and fresh internal state) whenever the underlying
            // institution changes, so clicking a different row while the form is open can never
            // leave the previous institution's values on screen.
            key={editing === 'edit' ? selected?.id : 'create'}
            initial={editing === 'edit' ? selected : null}
            onSubmit={handleFormSubmit}
            onCancel={() => setEditing(false)}
          />
        </section>
      )}

      {!editing && selected && (
        <section className="card">
          <InstitutionSummaryPanel institution={selected} />
          <button type="button" className="btn" onClick={() => setEditing('edit')}>
            Edit
          </button>
        </section>
      )}
    </div>
  );
}
