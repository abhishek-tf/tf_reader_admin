import DataTable from '../ui/DataTable.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import Pagination from '../ui/Pagination.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import { useTenants } from './useTenants.js';
import { buildTenantColumns } from './tenantColumns.jsx';

const STATUS_OPTIONS = [
  { value: 'HEALTHY', label: 'Healthy' },
  { value: 'DEGRADED', label: 'Degraded' },
  { value: 'UNREACHABLE', label: 'Unreachable' },
];

function TenantFilters({ list }) {
  return (
    <FilterBar
      searchValue={list.q}
      onSearchChange={list.setQ}
      searchPlaceholder="Search by publisher name..."
      filters={[
        {
          name: 'status',
          label: 'Key vault health',
          value: list.status,
          options: STATUS_OPTIONS,
          placeholder: 'Health: All',
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

/**
 * SUPER_ADMIN only: which publisher's data lives in which database, and whether that
 * publisher's encryption key vault is reachable. Platform infrastructure bookkeeping, not a
 * publisher's own business status — that stays on the Publishers screen. There is no create,
 * edit or status-change flow here; the backend has not shipped anything beyond a list endpoint
 * for this yet, and this screen shows exactly that list.
 */
export default function TenantsScreen() {
  const list = useTenants();
  const columns = buildTenantColumns();

  return (
    <div className="stack">
      <PageHeader
        title="Tenants"
        subtitle="Which publisher's data lives in which database, and whether its encryption key vault is reachable."
      />

      <TenantFilters list={list} />

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No tenants match this filter."
        onRetry={list.reload}
        header={
          !list.loading && !list.error ? (
            <span>
              {list.total} tenant{list.total === 1 ? '' : 's'} listed
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
    </div>
  );
}
