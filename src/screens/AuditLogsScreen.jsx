import { useEffect, useState } from 'react';
import DataTable from '../ui/DataTable.jsx';
import Pagination from '../ui/Pagination.jsx';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { ACTION_OPTIONS, ENTITY_TYPE_OPTIONS, listAuditLogs } from '../api/auditLogs.js';

const PAGE_SIZE = 20;

const EMPTY_FILTERS = {
  entityType: '',
  entityId: '',
  actorId: '',
  action: '',
  from: '',
  to: '',
};

const ACTION_LABEL = Object.fromEntries(ACTION_OPTIONS.map((o) => [o.value, o.label]));

/**
 * One of before, after or meta. Free-form objects, so there is nothing to lay out field by
 * field: the compact JSON is the honest rendering, and a null one is not an error.
 */
function renderJson(value) {
  if (value === null || value === undefined) return '—';
  return <span className="trace">{JSON.stringify(value)}</span>;
}

const COLUMNS = [
  {
    key: 'at',
    label: 'Date and time',
    width: '15%',
    // No date helper exists in this console yet, and one screen does not justify inventing one.
    // The exact instant stays on the title, because that is what a filter has to be given.
    render: (row) => <span title={row.at}>{new Date(row.at).toLocaleString()}</span>,
  },
  {
    key: 'actorEmail',
    label: 'Actor',
    width: '14%',
    // The email is the readable one, but it is nullable, and so is the id behind it.
    render: (row) => row.actorEmail ?? row.actorId ?? '—',
  },
  {
    key: 'action',
    label: 'Action',
    width: '9%',
    render: (row) => ACTION_LABEL[row.action] ?? row.action,
  },
  // No render: the exact value the backend returned, straight through. DataTable already
  // falls back to an em dash for a null one, and the contract names no display label for an
  // entityType, so there is nothing correct to map it to.
  { key: 'entityType', label: 'Entity type', width: '10%' },
  {
    key: 'entityId',
    label: 'Entity ID',
    width: '10%',
    render: (row) => <span className="trace">{row.entityId ?? '—'}</span>,
  },
  { key: 'before', label: 'Before', render: (row) => renderJson(row.before) },
  { key: 'after', label: 'After', render: (row) => renderJson(row.after) },
  { key: 'meta', label: 'Metadata', render: (row) => renderJson(row.meta) },
];

/** The audit trail: six filters over a paged, read-only, newest-first table. */
export default function AuditLogsScreen() {
  // `filters` is what is typed. `query` is what was submitted and is on screen. Applying on
  // submit rather than per keystroke matters here: a half-typed date is a 400, not an empty
  // result, so firing a request mid-edit would show the operator a failure they did not cause.
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState({ ...EMPTY_FILTERS, page: 0 });
  const [list, setList] = useState({ items: [], total: 0, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setList((current) => ({ ...current, loading: true, error: null }));

    listAuditLogs({ ...query, size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setList({ items: data.items, total: data.total, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setList((current) => ({ ...current, loading: false, error }));
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  function change(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setQuery({ ...filters, page: 0 });
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    setQuery({ ...EMPTY_FILTERS, page: 0 });
  }

  // A fresh object re-runs the load effect without changing the query.
  function handleRetry() {
    setQuery((current) => ({ ...current }));
  }

  const { loading, error } = list;
  // Only the filters count, never the page: being on page 3 is not a narrowed search, and
  // treating it as one would word the empty state wrongly.
  const filtered = Object.keys(EMPTY_FILTERS).some((name) => query[name] !== '');

  return (
    <div className="stack">
      <section className="card">
        <h1>Audit log</h1>
        <p className="muted">
          Every change an operator has made, newest first. Records are kept for 90 days and then
          removed automatically.
        </p>
      </section>

      <section className="card">
        <h2>Filters</h2>
        <form onSubmit={handleSubmit} noValidate>
          <SelectField
            label="Entity type"
            name="entityType"
            value={filters.entityType}
            onChange={change}
            options={ENTITY_TYPE_OPTIONS}
            placeholder="Any entity type"
            disabled={loading}
          />
          <TextField
            label="Entity ID"
            name="entityId"
            value={filters.entityId}
            onChange={change}
            placeholder="pub_rtlg"
            disabled={loading}
          />
          <TextField
            label="Actor ID"
            name="actorId"
            value={filters.actorId}
            onChange={change}
            placeholder="adm_2"
            hint="The operator who made the change, by id rather than email."
            disabled={loading}
          />
          <SelectField
            label="Action"
            name="action"
            value={filters.action}
            onChange={change}
            options={ACTION_OPTIONS}
            placeholder="Any action"
            disabled={loading}
          />
          <TextField
            label="From"
            name="from"
            type="date"
            value={filters.from}
            onChange={change}
            hint="Counts from the start of this day."
            disabled={loading}
          />
          <TextField
            label="To"
            name="to"
            type="date"
            value={filters.to}
            onChange={change}
            hint="Counts to the end of this day."
            disabled={loading}
          />

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button type="button" className="btn" onClick={handleClear} disabled={loading}>
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Records</h2>
        <DataTable
          columns={COLUMNS}
          rows={list.items}
          loading={loading}
          error={error}
          emptyMessage={
            filtered
              ? 'No audit records match these filters.'
              : 'No audit records yet. They appear as operators make changes.'
          }
          onRetry={handleRetry}
        />

        {!error && list.total > 0 ? (
          <Pagination
            page={query.page}
            size={PAGE_SIZE}
            total={list.total}
            onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
          />
        ) : null}
      </section>
    </div>
  );
}
