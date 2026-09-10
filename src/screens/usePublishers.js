import { useCallback, useEffect, useState } from 'react';
import { listPublishers } from '../api/publishers.js';
import { listAllCollections } from '../api/collections.js';
import { listInstitutions } from '../api/institution.js';
import { fetchAllPages } from '../api/client.js';

const EMPTY_PAGE = { items: [], page: 0, size: 0, total: 0 };
const EMPTY_FILTERS = { q: '', status: '', institutionId: '' };

/**
 * All the state and data-fetching behind the publishers list: the draft/submitted filter
 * split, the page itself, the institution picker's own options, and the metric-row totals.
 * Kept out of PublishersScreen so that component is JSX, not five effects.
 *
 * `filters` is what every control shows. `query` is what was actually submitted and is what
 * the list reflects. Status and institution apply themselves the moment they change — a
 * dropdown has no "did you mean to pick that" moment the way free text does. The search box
 * is the one exception: it applies on Enter/submit only, so a partial word does not fire a
 * request per keystroke.
 */
export function usePublishers() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState({ ...EMPTY_FILTERS, page: 0 });
  const [pageSize, setPageSize] = useState(10);
  const [pageResult, setPageResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [institutionOptions, setInstitutionOptions] = useState([]);
  const [kpis, setKpis] = useState(null);

  // The institution picker's own options, fetched once. A failure just leaves the dropdown at
  // "All / Global"; it does not block the list itself.
  useEffect(() => {
    let cancelled = false;
    listInstitutions({ size: 100 })
      .then((loaded) => {
        if (!cancelled) setInstitutionOptions(loaded.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // The metric row's totals: real counts from the same endpoints the list uses, fetched once
  // rather than per filter change — these are catalogue-wide, not "how many matched your
  // search". Suspended/Retired is total minus active rather than a third request: the two are
  // exhaustive, so the subtraction is exact.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listPublishers({ size: 1 }),
      listPublishers({ status: 'ACTIVE', size: 1 }),
      listAllCollections({ size: 1 }),
    ])
      .then(([allPage, activePage, collectionsPage]) => {
        if (cancelled) return;
        setKpis({
          total: allPage.total,
          active: activePage.total,
          suspendedOrRetired: allPage.total - activePage.total,
          collections: collectionsPage.total,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const trimmedQ = query.q.trim();
    // The list endpoint's own `q` is a real backend behaviour we don't control, and it does
    // not reliably match a publisher's code (only its name) — which is the whole point of a
    // "code" column existing to search by. Rather than depend on that, a text search here
    // fetches every publisher matching status/institution (still server-side — the part the
    // contract does support), and does the actual name/code/description match client-side,
    // then pages the result itself. No `q` search at all skips this and hits the list
    // endpoint directly and singly, same as before — this only runs while there's text typed.
    const request = trimmedQ
      ? fetchAllPages((page) =>
          listPublishers({ status: query.status, institutionId: query.institutionId, page, size: 100 })
        ).then((all) => {
          const needle = trimmedQ.toLowerCase();
          const matches = all.filter((publisher) =>
            [publisher.name, publisher.code, publisher.description].some((field) =>
              field?.toLowerCase().includes(needle)
            )
          );
          const start = query.page * pageSize;
          return {
            items: matches.slice(start, start + pageSize),
            page: query.page,
            size: pageSize,
            total: matches.length,
          };
        })
      : listPublishers({ ...query, size: pageSize });

    request
      .then((loaded) => {
        if (cancelled) return;
        setPageResult(loaded);
        setLoading(false);
      })
      .catch((failure) => {
        if (cancelled) return;
        setError(failure);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, pageSize]);

  function change(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function changeAndApply(name, value) {
    setFilters((current) => {
      const next = { ...current, [name]: value };
      setQuery((currentQuery) => ({ ...currentQuery, ...next, page: 0 }));
      return next;
    });
  }

  function submit() {
    setQuery((current) => ({ ...current, q: filters.q.trim(), page: 0 }));
  }

  function clear() {
    setFilters(EMPTY_FILTERS);
    setQuery({ ...EMPTY_FILTERS, page: 0 });
  }

  // A fresh object re-runs the load effect without changing the query. `useCallback` with no
  // dependencies (setQuery is stable) rather than a plain function: this is handed out
  // through Outlet context to PublisherForm, which reloads this list on unmount — a new
  // function identity every render would re-fire that effect's cleanup on every unrelated
  // re-render this hook causes, including the ones its own reload triggers.
  const retry = useCallback(() => {
    setQuery((current) => ({ ...current }));
  }, []);

  function goToPage(page) {
    setQuery((current) => ({ ...current, page }));
  }

  function changePageSize(nextSize) {
    setPageSize(nextSize);
    setQuery((current) => ({ ...current, page: 0 }));
  }

  const result = pageResult ?? EMPTY_PAGE;

  return {
    filters,
    change,
    changeAndApply,
    submit,
    clear,
    retry,
    goToPage,
    pageSize,
    changePageSize,
    institutionOptions,
    kpis,
    loading,
    error,
    rows: result.items,
    total: result.total,
    size: result.size,
    currentPage: pageResult ? result.page : query.page,
    selectedInstitutionId: query.institutionId,
    searching: query.q !== '' || query.status !== '' || query.institutionId !== '',
  };
}
