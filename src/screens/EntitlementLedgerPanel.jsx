import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import SelectField from '../ui/SelectField.jsx';
import Card from '../ui/Card.jsx';
import EntitlementActivityLog from '../ui/EntitlementActivityLog.jsx';
import { EntitlementKpiRow, EntitlementFilters } from './EntitlementListControls.jsx';

/** Everything shown once an institution is picked: the institution switcher, its KPI row,
 * filters, ledger table, pager, and activity log. Split out of EntitlementsAdminScreen so that
 * component stays a plain set of handlers, not a second place JSX branches accumulate. */
export default function EntitlementLedgerPanel({ e, columns }) {
  return (
    <>
      <Card>
        <SelectField
          label="Institution"
          name="institutionId"
          compact
          value={e.institutionId}
          onChange={(_name, value) => e.selectInstitution(value)}
          options={e.institutionPicker.list.map((inst) => ({ value: inst.id, label: inst.name }))}
          placeholder="Choose an institution"
        />
      </Card>

      <EntitlementKpiRow kpis={e.kpis} />
      <EntitlementFilters e={e} />

      <DataTable
        columns={columns}
        rows={e.rows}
        loading={e.loading}
        error={e.error}
        onRetry={e.reload}
        emptyMessage={
          e.searching
            ? 'No entitlements match this filter.'
            : 'This institution holds no entitlements yet.'
        }
        header={
          !e.loading && !e.error ? (
            <span>
              {e.total} entitlement{e.total === 1 ? '' : 's'} listed
            </span>
          ) : null
        }
      />
      {!e.error && e.total > 0 ? (
        <Pagination page={e.page} size={e.pageSize} total={e.total} onPageChange={e.setPage} />
      ) : null}

      <EntitlementActivityLog institutionId={e.institutionId} />
    </>
  );
}
