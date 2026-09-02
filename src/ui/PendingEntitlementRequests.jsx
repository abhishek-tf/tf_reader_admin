import { useEffect, useState } from 'react';
import DataTable from './DataTable.jsx';
import SelectField from './SelectField.jsx';
import { useToast } from './ToastContext.jsx';
import { useInFlightIds } from './entitlementFields.jsx';
import { listInstitutions } from '../api/institution.js';
import { listEntitlements, changeEntitlementStatus } from '../api/entitlements.js';

/**
 * A super admin's queue: pick an institution, see its pending entitlement requests, approve
 * or reject each. The institution picker is kept local to this screen rather than reused from
 * elsewhere, same reasoning as ShelvesScreen — a super admin has no institution of their own.
 */
export default function PendingEntitlementRequests() {
  const toast = useToast();
  const [institutionPicker, setInstitutionPicker] = useState({
    list: [],
    loading: true,
    selectedId: '',
  });
  const [requests, setRequests] = useState({ list: [], loading: false, error: null });
  const pendingActionIds = useInFlightIds();

  useEffect(() => {
    listInstitutions({ status: 'ACTIVE', size: 100 })
      .then((page) => setInstitutionPicker((c) => ({ ...c, list: page.items, loading: false })))
      .catch(() => setInstitutionPicker((c) => ({ ...c, loading: false })));
  }, []);

  async function loadRequests(institutionId, signal) {
    setRequests((c) => ({ ...c, loading: true, error: null }));
    try {
      // An institution's entitlement history only grows, never shrinks, so the pending ones
      // this queue cares about can land on any page. Walk every page (at the endpoint's max
      // size) rather than just the first, so a request past the first 100 records is never
      // silently missing from the queue.
      const pending = [];
      let page = 0;
      let total = Infinity;
      while (page * 100 < total) {
        const data = await listEntitlements(institutionId, { page, size: 100 }, { signal });
        total = data.total;
        pending.push(...data.items.filter((e) => e.status === 'PENDING'));
        page += 1;
      }
      setRequests({ list: pending, loading: false, error: null });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setRequests((c) => ({ ...c, loading: false, error }));
    }
  }

  useEffect(() => {
    if (!institutionPicker.selectedId) return;
    const controller = new AbortController();
    loadRequests(institutionPicker.selectedId, controller.signal);
    return () => controller.abort();
  }, [institutionPicker.selectedId]);

  async function handleDecision(entitlement, status) {
    if (pendingActionIds.has(entitlement.id)) return;
    pendingActionIds.start(entitlement.id);
    try {
      await changeEntitlementStatus(entitlement.id, { status });
      toast.saved(status === 'ACTIVE' ? 'Approved.' : 'Rejected.');
      loadRequests(institutionPicker.selectedId);
    } catch (error) {
      toast.failed(error);
    } finally {
      pendingActionIds.finish(entitlement.id);
    }
  }

  const columns = [
    { key: 'scopeType', label: 'Type' },
    { key: 'scopeLabel', label: 'What', render: (row) => row.scopeLabel ?? row.scopeId },
    { key: 'resolvedItemCount', label: 'Books' },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="row-buttons">
          <button
            type="button"
            className="btn btn-primary"
            disabled={pendingActionIds.has(row.id)}
            onClick={() => handleDecision(row, 'ACTIVE')}
          >
            Approve
          </button>
          <button
            type="button"
            className="btn"
            disabled={pendingActionIds.has(row.id)}
            onClick={() => handleDecision(row, 'REVOKED')}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="stack">
      <section className="card">
        <h1>Pending requests</h1>
        <p className="muted">Approve or reject what an institution has asked for.</p>
        <SelectField
          label="Institution"
          name="institutionId"
          value={institutionPicker.selectedId}
          onChange={(_name, value) => setInstitutionPicker((c) => ({ ...c, selectedId: value }))}
          options={institutionPicker.list.map((inst) => ({ value: inst.id, label: inst.name }))}
          placeholder="Choose an institution"
          disabled={institutionPicker.loading}
        />
      </section>

      {institutionPicker.selectedId ? (
        <section className="card">
          <DataTable
            columns={columns}
            rows={requests.list}
            loading={requests.loading}
            error={requests.error}
            emptyMessage="No pending requests for this institution."
            onRetry={() => loadRequests(institutionPicker.selectedId)}
          />
        </section>
      ) : (
        <section className="card">
          <p className="muted">Choose an institution above to see its pending requests.</p>
        </section>
      )}
    </div>
  );
}
