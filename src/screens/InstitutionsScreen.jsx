import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import DataTable from '../ui/DataTable.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import Pagination from '../ui/Pagination.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import KpiCard from '../ui/KpiCard.jsx';
import Button from '../ui/Button.jsx';
import RouteErrorBoundary from '../ui/RouteErrorBoundary.jsx';
import { InstitutionsDecoration } from '../ui/pageDecorations.jsx';
import InstitutionStatusModal from './InstitutionStatusModal.jsx';
import { useInstitutions } from './useInstitutions.js';
import { buildInstitutionColumns } from './institutionColumns.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import { setInstitutionStatus } from '../api/institution.js';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'RETIRED', label: 'Retired' },
];

function KpiRow({ kpis }) {
  const activePercent = kpis ? Math.round((kpis.active / Math.max(kpis.total, 1)) * 100) : null;
  return (
    <div className="kpi-grid kpi-grid-3">
      <KpiCard
        label="Total Institutions"
        value={kpis?.total ?? '—'}
        icon="account_balance"
        helper="institutions registered"
      />
      <KpiCard
        label="Active Institutions"
        value={kpis?.active ?? '—'}
        icon="check_circle"
        accent
        helper={activePercent === null ? undefined : `${activePercent}% active`}
      />
      <KpiCard
        label="Suspended / Retired"
        value={kpis ? kpis.suspended + kpis.retired : '—'}
        icon="pause_circle"
        helper={kpis ? `${kpis.suspended} suspended · ${kpis.retired} retired` : undefined}
      />
    </div>
  );
}

function InstitutionFilters({ list }) {
  return (
    <FilterBar
      searchValue={list.q}
      onSearchChange={list.setQ}
      searchPlaceholder="Search by institution name..."
      filters={[
        {
          name: 'status',
          label: 'Status',
          value: list.status,
          options: STATUS_OPTIONS,
          placeholder: 'Status: All',
          onChange: list.setStatus,
        },
      ]}
      trailing={
        <button type="button" className="btn-reset-link" onClick={list.clear}>
          Reset
        </button>
      }
    />
  );
}

/** The institutions page: a filterable list. Create and edit are pages, rendered through this
 * screen's own `<Outlet/>` as a modal overlaying this list — see App.jsx's nested
 * `/institutions` routes and the same pattern already used by Publishers/Books. Clicking an
 * institution's name goes to its own detail page (`/institutions/:id`), where its entitlements
 * and the books under them live — not an inline card at the bottom of this list. */
export default function InstitutionsScreen() {
  const list = useInstitutions();
  const toast = useToast();
  const location = useLocation();
  const [pendingStatusIds, setPendingStatusIds] = useState(() => new Set());
  // The row a Suspend/Reactivate click is waiting to be confirmed for, plus the reason text
  // typed so far. Not a window.prompt: a native browser prompt is silently blocked (returns
  // null with no dialog shown at all) in several embedded/preview browsers and webviews, which
  // makes the button look like it does nothing. An on-page confirmation has no such failure
  // mode.
  const [statusConfirm, setStatusConfirm] = useState(null); // { institution, nextStatus, reason }

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

  const columns = buildInstitutionColumns({
    onToggleStatus: startStatusChange,
    pendingIds: pendingStatusIds,
  });

  return (
    <div className="stack">
      <PageHeader
        title="Institutions"
        subtitle="Manage licensed academic institutions, universities, medical libraries, and consortia access."
        decoration={<InstitutionsDecoration />}
        actions={
          <Button as={Link} variant="primary" icon="add" to="/institutions/new">
            Create institution
          </Button>
        }
      />

      <KpiRow kpis={list.kpis} />

      <InstitutionFilters list={list} />

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No institutions match this filter."
        onRetry={list.reload}
        header={
          !list.loading && !list.error ? (
            <span>
              {list.total} institution{list.total === 1 ? '' : 's'} listed
            </span>
          ) : null
        }
      />

      {!list.error && list.total > 0 ? (
        <Pagination
          page={list.page}
          size={list.size}
          total={list.total}
          onPageChange={list.setPage}
          pageSize={list.pageSize}
          onPageSizeChange={list.changePageSize}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      ) : null}

      <InstitutionStatusModal
        statusConfirm={statusConfirm}
        onChangeReason={(reason) => setStatusConfirm((c) => ({ ...c, reason }))}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusConfirm(null)}
      />

      {/* Filled by the /institutions/new and /institutions/:institutionId/edit child routes —
          InstitutionForm's own fixed-position modal overlay, rendered here so this table stays
          mounted and visible (blurred) behind it, matching Stitch's "Add Institution" modal.
          `context` hands it this list's own reload, same reasoning as Publishers/Books: since
          this table now stays mounted across a create/edit instead of remounting on the way
          back to /institutions, something has to trigger that refetch explicitly. */}
      <RouteErrorBoundary resetKey={location.pathname} fallbackTo="/institutions">
        <Outlet context={{ reload: list.reload }} />
      </RouteErrorBoundary>
    </div>
  );
}
