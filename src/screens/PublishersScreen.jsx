import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import { PublishersDecoration } from '../ui/pageDecorations.jsx';
import KpiCard from '../ui/KpiCard.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import RouteErrorBoundary from '../ui/RouteErrorBoundary.jsx';
import { usePublishers } from './usePublishers.js';
import { buildPublisherColumns, pluralize } from './publisherColumns.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'RETIRED', label: 'Retired' },
];

function KpiRow({ kpis }) {
  const activePercent = kpis ? Math.round((kpis.active / Math.max(kpis.total, 1)) * 100) : null;
  return (
    <div className="kpi-grid">
      <KpiCard
        label="Total Publishers"
        value={kpis?.total ?? '—'}
        icon="domain"
        helper="Catalogue total"
      />
      <KpiCard
        label="Active Publishers"
        value={kpis?.active ?? '—'}
        icon="check_circle"
        accent
        helper={activePercent === null ? undefined : `${activePercent}% operative`}
      />
      <KpiCard
        label="Suspended / Retired"
        value={kpis?.suspendedOrRetired ?? '—'}
        icon="pause_circle"
        helper="None pending"
      />
      <KpiCard
        label="Total Collections"
        value={kpis?.collections ?? '—'}
        icon="folder_copy"
        helper="Active sets"
      />
    </div>
  );
}

function PublisherFilters({ p, onSubmit }) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <FilterBar
        searchValue={p.filters.q}
        onSearchChange={(value) => p.change('q', value)}
        searchPlaceholder="Search by publisher name, code, or description..."
        filters={[
          {
            name: 'status',
            label: 'Status',
            value: p.filters.status,
            onChange: (value) => p.changeAndApply('status', value),
            placeholder: 'Status: All',
            options: STATUS_OPTIONS,
          },
          {
            name: 'institutionId',
            label: 'Institution',
            value: p.filters.institutionId,
            onChange: (value) => p.changeAndApply('institutionId', value),
            placeholder: 'Institution: All / Global',
            options: p.institutionOptions.map((institution) => ({
              value: institution.id,
              label: institution.name,
            })),
          },
        ]}
        trailing={
          <button type="button" className="btn-reset-link" onClick={p.clear} disabled={p.loading}>
            Reset
          </button>
        }
      />
    </form>
  );
}

function TableHeader({ total }) {
  return (
    <>
      <span>{pluralize(total, 'publisher')} listed</span>
      <div className="view-toggle">
        <button
          type="button"
          className="view-toggle-btn view-toggle-active"
          aria-pressed="true"
          aria-label="List view"
        >
          <Icon name="format_list_bulleted" />
        </button>
        <button
          type="button"
          className="view-toggle-btn"
          disabled
          aria-label="Grid view"
          title="Grid view is not available yet"
        >
          <Icon name="grid_view" />
        </button>
      </div>
    </>
  );
}

export default function PublishersScreen() {
  const { user } = useAuth();
  // Only a super admin creates publishers. Hiding the button is not the check: the server
  // refuses the POST either way. It just stops the console offering what would be refused.
  const canCreate = user.role === 'SUPER_ADMIN';
  const p = usePublishers();
  const location = useLocation();
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    p.submit();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Publishers"
        subtitle="Every publisher in the catalogue, and the collections they sell."
        decoration={<PublishersDecoration />}
        actions={
          canCreate ? (
            <Button as={Link} variant="primary" icon="add" to="/publishers/new">
              New publisher
            </Button>
          ) : null
        }
      />

      <KpiRow kpis={p.kpis} />

      <PublisherFilters p={p} onSubmit={handleSubmit} />

      <DataTable
        columns={buildPublisherColumns(p.selectedInstitutionId)}
        rows={p.rows}
        loading={p.loading}
        error={p.error}
        emptyMessage={
          p.searching
            ? 'No publishers match that search.'
            : 'No publishers yet. Create one to see it here.'
        }
        onRetry={p.retry}
        header={!p.loading && !p.error ? <TableHeader total={p.total} /> : null}
        onRowClick={(row) => navigate(`/publishers/${row.id}`)}
      />

      {!p.error && p.total > 0 ? (
        <Pagination
          page={p.currentPage}
          size={p.size}
          total={p.total}
          onPageChange={p.goToPage}
          pageSize={p.pageSize}
          onPageSizeChange={p.changePageSize}
        />
      ) : null}

      {/* Filled by the /publishers/new and /publishers/:publisherId/edit child routes —
          PublisherForm's own fixed-position modal overlay, rendered here so this table stays
          mounted and visible (blurred) behind it. Renders nothing on the plain /publishers
          address, where there's no matching child route. Wrapped in an error boundary because
          that overlay's backdrop is a sibling of this Outlet, not an ancestor of it — without
          one, a render error in there has nothing to catch it and leaves the backdrop on
          screen with no card and no way to close it.
          `context` hands PublisherForm this list's own reload — since this table now stays
          mounted across a create/edit instead of remounting on the way back to /publishers
          (that remount used to be what refetched it for free), something has to trigger that
          refetch explicitly, or a status edit lands on the server but the row goes on
          showing what it said before the edit until a manual reload. */}
      <RouteErrorBoundary resetKey={location.pathname} fallbackTo="/publishers">
        <Outlet context={{ reload: p.retry }} />
      </RouteErrorBoundary>
    </div>
  );
}
