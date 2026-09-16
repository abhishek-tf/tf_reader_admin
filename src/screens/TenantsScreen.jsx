import DataTable from '../ui/DataTable.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import { useTenants } from './useTenants.js';
import { buildTenantColumns } from './tenantColumns.jsx';

/**
 * SUPER_ADMIN only: a platform-wide, view-only overview of which publisher's data lives in a
 * dedicated database vs. T&F's shared one, and whether that connection is healthy. There is no
 * create, edit or status-change flow here - reading and writing a single publisher's own
 * database/vault-key settings happens on that publisher's own page
 * (PublisherDatabaseVaultSection, reached via each row's link), since setting one is
 * self-service and only that publisher's own admin or a SUPER_ADMIN may do it. This list is
 * unpaged and unfiltered server-side because the real endpoint takes no parameters and returns
 * every tenant at once; the search box below only narrows the rows already fetched.
 */
export default function TenantsScreen() {
  const list = useTenants();
  const columns = buildTenantColumns();

  return (
    <div className="stack">
      <PageHeader
        title="Tenants"
        subtitle="Which publisher's data lives in which database, and whether that connection is healthy."
      />

      <FilterBar
        searchValue={list.q}
        onSearchChange={list.setQ}
        searchPlaceholder="Search by publisher code or name..."
      />

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No tenants match this search."
        onRetry={list.reload}
        header={
          !list.loading && !list.error ? (
            <span>
              {list.total} tenant{list.total === 1 ? '' : 's'} listed
            </span>
          ) : null
        }
      />
    </div>
  );
}
