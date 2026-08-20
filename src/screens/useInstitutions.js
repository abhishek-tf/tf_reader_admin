import { useCallback, useEffect, useRef, useState } from 'react';
import { listInstitutions } from '../api/institution';

/**
 * Holds the search text, the status filter, the current page, and the fetched rows for the
 * institutions list, along with loading and error state.
 */
export function useInstitutions() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const size = 20;

  const [data, setData] = useState(null); // { items, page, size, total }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Typing in the search box or flipping filters/pages quickly can fire several requests before
  // the first one resolves. Only the most recently *started* request is allowed to write its
  // result — an older one that happens to resolve later is discarded, so a fast filter change can
  // never be overwritten by a slower, stale response landing after it.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await listInstitutions({ q, status, page, size });
      if (requestId === requestIdRef.current) setData(result);
    } catch (e) {
      if (requestId === requestIdRef.current) setError(e);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [q, status, page]);

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

  /** Updates one row's fields in the current list without fetching the whole page again. */
  const patchRow = useCallback((id, patch) => {
    setData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }
        : prev
    );
  }, []);

  return {
    q,
    setQ: changeQ,
    status,
    setStatus: changeStatus,
    page,
    setPage,
    size,
    items: data?.items ?? [],
    total: data?.total ?? 0,
    loading,
    error,
    reload: load,
    patchRow,
  };
}
