import KpiCard from '../ui/KpiCard.jsx';
import FilterBar from '../ui/FilterBar.jsx';

const SCOPE_OPTIONS = [
  { value: 'COLLECTION', label: 'Collection' },
  { value: 'PUBLISHER', label: 'Publisher' },
  { value: 'ITEM', label: 'Book' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'REVOKED', label: 'Revoked' },
];

/** The 4-card KPI row — Active/Pending/Suspended/Revoked grants for the institution currently
 * selected, matching Stitch's own four states exactly (all four real counts, not estimates). */
export function EntitlementKpiRow({ kpis }) {
  return (
    <div className="kpi-grid">
      <KpiCard
        label="Active Grants"
        value={kpis.active}
        icon="check_circle"
        accent
        helper="licences in force"
      />
      <KpiCard
        label="Pending Approvals"
        value={kpis.pending}
        icon="pending_actions"
        helper="requires review"
      />
      <KpiCard
        label="Suspended Grants"
        value={kpis.suspended}
        icon="pause_circle"
        helper="paused tiers"
      />
      <KpiCard
        label="Revoked Grants"
        value={kpis.revoked}
        icon="block"
        helper="expired/cancelled"
      />
    </div>
  );
}

/** Search plus the scope-type/status dropdowns — all client-side (see useEntitlements.js for
 * why), same FilterBar every other list page uses. */
export function EntitlementFilters({ e }) {
  return (
    <FilterBar
      searchValue={e.filters.q}
      onSearchChange={(value) => e.changeFilter('q', value)}
      searchPlaceholder="Filter by scope, label, or entitlement id..."
      filters={[
        {
          name: 'scopeType',
          label: 'Scope',
          value: e.filters.scopeType,
          onChange: (value) => e.changeFilter('scopeType', value),
          placeholder: 'Scope: All',
          options: SCOPE_OPTIONS,
        },
        {
          name: 'status',
          label: 'Status',
          value: e.filters.status,
          onChange: (value) => e.changeFilter('status', value),
          placeholder: 'Status: All',
          options: STATUS_OPTIONS,
        },
      ]}
      trailing={
        <button type="button" className="btn-reset-link" onClick={e.clearFilters}>
          Reset
        </button>
      }
    />
  );
}
