import { useEffect, useState } from 'react';
import { listAuditLogs } from '../api/auditLogs.js';

export const EMPTY_AUDIT_FILTERS = {
  entityType: '',
  entityId: '',
  actorId: '',
  action: '',
  from: '',
  to: '',
};

const PAGE_SIZE = 20;

function sevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().slice(0, 10);
}

/**
 * The audit trail's own state, extracted out of the old standalone AuditLogsScreen so it can
 * sit as a tab alongside Operators. `filters` is what is typed; `query` is what was submitted
 * and is on screen — applying on submit rather than per keystroke matters here, since a
 * half-typed date is a 400, not an empty result.
 */
export function useAuditLog() {
  const [filters, setFilters] = useState(EMPTY_AUDIT_FILTERS);
  const [query, setQuery] = useState({ ...EMPTY_AUDIT_FILTERS, page: 0 });
  const [list, setList] = useState({ items: [], total: 0, loading: true, error: null });
  const [recentTotal, setRecentTotal] = useState(null);

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

  // The "Audit Events / 7d" KPI: a real count from the same endpoint the table uses, fetched
  // once rather than per filter change - it describes the whole trail, not "how many matched
  // your search". `size: 1` because only `.total` is wanted, not the page of items.
  useEffect(() => {
    let cancelled = false;
    listAuditLogs({ from: sevenDaysAgo(), size: 1 })
      .then((data) => {
        if (!cancelled) setRecentTotal(data.total);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function change(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function submit() {
    setQuery({ ...filters, page: 0 });
  }

  function clear() {
    setFilters(EMPTY_AUDIT_FILTERS);
    setQuery({ ...EMPTY_AUDIT_FILTERS, page: 0 });
  }

  // A fresh object re-runs the load effect without changing the query.
  function retry() {
    setQuery((current) => ({ ...current }));
  }

  function setPage(page) {
    setQuery((current) => ({ ...current, page }));
  }

  // Only the filters count, never the page: being on page 3 is not a narrowed search, and
  // treating it as one would word the empty state wrongly.
  const filtered = Object.keys(EMPTY_AUDIT_FILTERS).some((name) => query[name] !== '');

  return {
    filters,
    change,
    submit,
    clear,
    retry,
    filtered,
    page: query.page,
    setPage,
    pageSize: PAGE_SIZE,
    rows: list.items,
    total: list.total,
    loading: list.loading,
    error: list.error,
    recentTotal,
  };
}
