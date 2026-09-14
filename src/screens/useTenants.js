import { useCallback, useEffect, useRef, useState } from 'react';
import { listTenants } from '../api/tenants.js';

/**
 * Holds the search text, the status filter, the current page and page size, and the fetched
 * rows for the tenants list, along with loading and error state. Mirrors useInstitutions.js,
 * without a KPI row — nothing in the tenants plan calls for one.
 */
export function useTenants() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState(null); // { items, page, size, total }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Same staleness guard as useInstitutions.js: only the most recently *started* request is
  // allowed to write its result, so a fast filter change can never be overwritten by a slower,
  // stale response landing after it.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await listTenants({ q, status, page, size: pageSize });
      if (requestId === requestIdRef.current) setData(result);
    } catch (e) {
      if (requestId === requestIdRef.current) setError(e);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [q, status, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  // Go back to the first page whenever a filter changes, so a narrower search never lands on a
  // page that no longer has any rows.
  const changeQ = useCallback((value) => {
    setPage(0);
    setQ(value);
  }, []);

  const changeStatus = useCallback((value) => {
    setPage(0);
    setStatus(value);
  }, []);

  const changePageSize = useCallback((value) => {
    setPage(0);
    setPageSize(value);
  }, []);

  const clear = useCallback(() => {
    setPage(0);
    setQ('');
    setStatus('');
  }, []);

  return {
    q,
    setQ: changeQ,
    status,
    setStatus: changeStatus,
    page,
    setPage,
    size: pageSize,
    pageSize,
    changePageSize,
    clear,
    items: data?.items ?? [],
    total: data?.total ?? 0,
    loading,
    error,
    reload: load,
  };
}
