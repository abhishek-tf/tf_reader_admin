import { useCallback, useEffect, useRef, useState } from 'react';
import { listInstitutions } from '../api/institution';

/**
 * Holds the search text, the status filter, the current page and page size, and the fetched
 * rows for the institutions list, along with loading and error state, plus the catalogue-wide
 * KPI counts Stitch's banner shows.
 */
export function useInstitutions() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState(null); // { items, page, size, total }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);

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
      const result = await listInstitutions({ q, status, page, size: pageSize });
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

  // The KPI row's totals: real counts from the same endpoint the list uses (RecordStatus is
  // exhaustively ACTIVE/SUSPENDED/RETIRED), fetched once rather than per filter change — these
  // are catalogue-wide, not "how many matched your search".
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listInstitutions({ size: 1 }),
      listInstitutions({ status: 'ACTIVE', size: 1 }),
      listInstitutions({ status: 'SUSPENDED', size: 1 }),
      listInstitutions({ status: 'RETIRED', size: 1 }),
    ])
      .then(([allPage, activePage, suspendedPage, retiredPage]) => {
        if (cancelled) return;
        setKpis({
          total: allPage.total,
          active: activePage.total,
          suspended: suspendedPage.total,
          retired: retiredPage.total,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
    size: pageSize,
    pageSize,
    changePageSize,
    clear,
    items: data?.items ?? [],
    total: data?.total ?? 0,
    loading,
    error,
    reload: load,
    patchRow,
    kpis,
  };
}
