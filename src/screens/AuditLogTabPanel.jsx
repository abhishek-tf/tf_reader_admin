import { useState } from 'react';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import Button from '../ui/Button.jsx';
import { ACTION_OPTIONS, ENTITY_TYPE_OPTIONS } from '../api/auditLogs.js';
import { ACTION_LABEL, formatAuditTimestamp, hasDiff } from './auditLogFields.jsx';
import AuditDiffModal from './AuditDiffModal.jsx';

function buildColumns(onOpenDiff) {
  return [
    {
      key: 'at',
      label: 'Timestamp',
      render: (row) => {
        const { relative, absolute } = formatAuditTimestamp(row.at);
        return (
          <div className="table-entity-text">
            <span className="row-link-emphasis">{relative}</span>
            <span className="table-entity-sub code-chip-plain">{absolute}</span>
          </div>
        );
      },
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => <span className="role-chip">{ACTION_LABEL[row.action] ?? row.action}</span>,
    },
    {
      key: 'entity',
      label: 'Entity target',
      render: (row) => (
        <div className="table-entity-text">
          <span className="table-entity-sub">{row.entityType ?? '—'}</span>
          <span className="code-chip-plain">{row.entityId ?? '—'}</span>
        </div>
      ),
    },
    { key: 'actor', label: 'Actor', render: (row) => row.actorEmail ?? row.actorId ?? '—' },
    {
      key: 'diff',
      label: '',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => onOpenDiff(row)}>
          {hasDiff(row) ? 'View diff' : 'Details'}
        </Button>
      ),
    },
  ];
}

/** The "Security & Activity Audit Log" tab: Stitch's own compact filter grid and ledger table,
 * with a "View diff" button opening the full before/after/metadata instead of three wide
 * columns on every row (see AuditDiffModal). Every filter and the pager are unchanged from the
 * old standalone AuditLogsScreen. */
export default function AuditLogTabPanel({ a }) {
  const [diffRow, setDiffRow] = useState(null);
  const columns = buildColumns(setDiffRow);

  function handleSubmit(event) {
    event.preventDefault();
    a.submit();
  }

  return (
    <div className="stack">
      <form onSubmit={handleSubmit} noValidate>
        <div className="field-grid-3">
          <SelectField
            label="Entity type"
            name="entityType"
            compact
            value={a.filters.entityType}
            onChange={a.change}
            options={ENTITY_TYPE_OPTIONS}
            placeholder="All entity types"
            disabled={a.loading}
          />
          <TextField
            label="Entity ID"
            name="entityId"
            compact
            value={a.filters.entityId}
            onChange={a.change}
            placeholder="pub_rtlg"
            disabled={a.loading}
          />
          <TextField
            label="Actor email or ID"
            name="actorId"
            compact
            value={a.filters.actorId}
            onChange={a.change}
            placeholder="adm_2"
            disabled={a.loading}
          />
          <SelectField
            label="Action"
            name="action"
            compact
            value={a.filters.action}
            onChange={a.change}
            options={ACTION_OPTIONS}
            placeholder="All actions"
            disabled={a.loading}
          />
          <TextField
            label="From"
            name="from"
            compact
            type="date"
            value={a.filters.from}
            onChange={a.change}
            disabled={a.loading}
          />
          <TextField
            label="To"
            name="to"
            compact
            type="date"
            value={a.filters.to}
            onChange={a.change}
            disabled={a.loading}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={a.loading}>
            {a.loading ? 'Searching...' : 'Search'}
          </Button>
          <Button type="button" onClick={a.clear} disabled={a.loading}>
            Clear
          </Button>
        </div>
      </form>

      <DataTable
        columns={columns}
        rows={a.rows}
        loading={a.loading}
        error={a.error}
        onRetry={a.retry}
        emptyMessage={
          a.filtered
            ? 'No audit records match these filters.'
            : 'No audit records yet. They appear as operators make changes.'
        }
        header={
          !a.loading && !a.error ? (
            <span>
              Showing {a.rows.length} of {a.total} audit records in the 90-day retention window
            </span>
          ) : null
        }
      />
      {!a.error && a.total > 0 ? (
        <Pagination page={a.page} size={a.pageSize} total={a.total} onPageChange={a.setPage} />
      ) : null}

      <AuditDiffModal row={diffRow} onClose={() => setDiffRow(null)} />
    </div>
  );
}
