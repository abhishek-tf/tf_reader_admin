import { useMemo, useState } from 'react';

/**
 * One reusable table for the whole console.
 *
 * columns: [{ key, label, sortable, render }]
 *   key      the field on the row, also the sort key sent to the API
 *   label    the heading the operator reads
 *   sortable optional, defaults to false
 *   render   optional (row) => node, for a badge or a formatted date
 *
 * Four states, and every screen gets all four for free:
 *   loading  a message instead of an empty table, so nobody thinks it broke
 *   error    the failure and its traceId, so a bug report is actionable
 *   empty    a sentence saying nothing is here yet, not a blank box
 *   rows     the data
 *
 * Sorting works two ways. Give it `onSortChange` and it hands the sort key back for the API
 * to apply, which is right for a paged list where the client has one page of many. Leave
 * that out and it sorts the rows it already has, which is right for a small fixed list.
 */
export default function DataTable({
  columns,
  rows,
  loading = false,
  error = null,
  emptyMessage = 'Nothing here yet.',
  rowKey = (row) => row.id,
  onRetry,
  sort,
  onSortChange,
}) {
  const [localSort, setLocalSort] = useState(null);
  const serverSorted = typeof onSortChange === 'function';
  const active = serverSorted ? sort : localSort;

  const visibleRows = useMemo(() => {
    if (serverSorted || !localSort) return rows;
    const { key, direction } = localSort;
    // Copy before sorting: sorting the prop in place mutates the caller's state and gives
    // React nothing to notice.
    return [...rows].sort((a, b) => {
      const left = a[key];
      const right = b[key];
      if (left === right) return 0;
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      const result =
        typeof left === 'number' ? left - right : String(left).localeCompare(String(right));
      return direction === 'desc' ? -result : result;
    });
  }, [rows, localSort, serverSorted]);

  function toggleSort(key) {
    const direction = active?.key === key && active.direction === 'asc' ? 'desc' : 'asc';
    if (serverSorted) onSortChange({ key, direction });
    else setLocalSort({ key, direction });
  }

  function arrow(key) {
    if (active?.key !== key) return '';
    return active.direction === 'asc' ? ' ↑' : ' ↓';
  }

  // One <colgroup> width per column keeps the layout steady between states, so the table
  // does not jump when it goes from loading to rows.
  const body = () => {
    if (loading) {
      return (
        <tr>
          <td className="table-state" colSpan={columns.length}>
            Loading...
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td className="table-state table-state-error" colSpan={columns.length}>
            <p>{error.friendly ?? error.message ?? 'Could not load this list.'}</p>
            {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
            {onRetry ? (
              <button type="button" className="btn" onClick={onRetry}>
                Try again
              </button>
            ) : null}
          </td>
        </tr>
      );
    }
    if (visibleRows.length === 0) {
      return (
        <tr>
          <td className="table-state" colSpan={columns.length}>
            {emptyMessage}
          </td>
        </tr>
      );
    }
    return visibleRows.map((row) => (
      <tr key={rowKey(row)}>
        {columns.map((column) => (
          <td key={column.key}>{column.render ? column.render(row) : (row[column.key] ?? '—')}</td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.sortable ? (
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => toggleSort(column.key)}
                    aria-label={`Sort by ${column.label}`}
                  >
                    {column.label}
                    {arrow(column.key)}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{body()}</tbody>
      </table>
    </div>
  );
}
