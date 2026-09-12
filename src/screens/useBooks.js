import { useCallback, useEffect, useState } from 'react';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { listPublishers } from '../api/publishers.js';
import { fetchAllPages } from '../api/client.js';
import { buildCatalogueTree, flattenVisible } from './bookTree.js';

const PAGE_SIZE = 20;
// Server-side page size for the walk below - deliberately larger than PAGE_SIZE, since this
// walks the whole matching set once per filter change rather than one page at a time.
const WALK_PAGE_SIZE = 100;

const EMPTY_FILTERS = { publisherId: '', collectionId: '', contentType: '', accessTier: '', q: '' };

// The four segments Stitch's status ribbon shows, mapped onto the console's own real
// `status` values rather than Stitch's copy — "All titles" aside, the other three are exactly
// ItemStatus's three values, just Title Cased for reading rather than relabelled.
export const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'ARCHIVED', label: 'Archived' },
];

/**
 * All the state and data-fetching behind the books list: the filters, the publisher picker's
 * own options, the suspended-publisher hide, the status-tab segmentation, and the client-side
 * page slice. Kept out of BooksScreen so that component is JSX, not several effects.
 *
 * The whole matching set is walked and filtered client-side, same as the console has always
 * done here (see the original load() below) — GET /catalogue-items has no way to exclude a
 * suspended publisher's books or segment by status ribbon tab, so both have to happen after
 * the fetch, over the complete set, not one already-paginated slice at a time. That is what
 * keeps `total` honest: it is the true reachable count for the current filters and tab, not
 * the server's raw one.
 */
export function useBooks() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [statusTab, setStatusTab] = useState('ALL');
  const [page, setPage] = useState(0);
  const [list, setList] = useState({ items: [], loading: true, error: null });
  const [suspendedPublisherIds, setSuspendedPublisherIds] = useState(() => new Set());
  const [publisherOptions, setPublisherOptions] = useState([]);
  // Which Journal/Volume/Issue rows are expanded, by id. Collapsed by default. Not reset on a
  // filter/tab change or a retry() reload - ids are stable across a refetch, and a stale id
  // left in here is harmless, since flattenVisible only ever consults it for a node that is
  // actually present in whatever subtree it is flattening.
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // Loaded once, not re-run per page or filter change: matches what the backend already does
  // for entitlement checks and OPDS feeds, where a suspended publisher's whole catalogue
  // disappears.
  useEffect(() => {
    const controller = new AbortController();
    fetchAllPages((statusPage) =>
      listPublishers(
        { status: 'SUSPENDED', page: statusPage, size: 100 },
        { signal: controller.signal }
      )
    )
      .then((suspended) => {
        setSuspendedPublisherIds(new Set(suspended.map((publisher) => publisher.id)));
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        // No retry, and this effect never runs again after mount: not worth failing the
        // whole screen over, but be accurate about the cost - if this call fails, suspended
        // publishers' books stay visible for as long as this screen stays mounted, full stop.
      });
    return () => controller.abort();
  }, []);

  // The publisher picker's own options — independent of the books query, fetched once. A
  // failure just leaves the dropdown empty; it does not block the list itself.
  useEffect(() => {
    let cancelled = false;
    listPublishers({ size: 100 })
      .then((loaded) => {
        if (!cancelled) setPublisherOptions(loaded.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Stable on `filters` alone (via useCallback) rather than a plain function redefined every
  // render — `retry` below is handed out through Outlet context to BookFormScreen, which
  // reloads this list on unmount. A new function identity on every render would re-fire that
  // effect's cleanup on every unrelated re-render this hook causes, including the ones its
  // own reload triggers, which is a loop, not a reload.
  const load = useCallback(
    (signal) => {
      setList((current) => ({ ...current, loading: true, error: null }));
      return fetchAllPages((walkPage) =>
        listCatalogueItems({ ...filters, page: walkPage, size: WALK_PAGE_SIZE }, { signal })
      )
        .then((items) => setList({ items, loading: false, error: null }))
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setList((current) => ({ ...current, loading: false, error }));
        });
    },
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const retry = useCallback(() => load(), [load]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function updateFilters(patch) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  }

  function changeStatusTab(nextTab) {
    setStatusTab(nextTab);
    setPage(0);
  }

  function clear() {
    setFilters(EMPTY_FILTERS);
    setStatusTab('ALL');
    setPage(0);
  }

  const visibleItems = list.items.filter((item) => !suspendedPublisherIds.has(item.publisherId));
  const hiddenCount = list.items.length - visibleItems.length;

  // Root count per tab, not flat item count — a Journal with a dozen Articles nested under it
  // is one row on this page, not a dozen, so the tab badge has to count the same way the pager
  // and "N catalogue items listed" already do. Counting tabs by flat item count instead (as
  // this once did) put a bigger number on the "All" tab than the pager's own total ever showed,
  // which read as "there are 83 items but I can't page past the first 12" — the tree grouping
  // was real, the mismatched count next to it was not.
  function rootCount(items) {
    return buildCatalogueTree(items).length;
  }

  const tabCounts = {
    ALL: rootCount(visibleItems),
    PUBLISHED: rootCount(visibleItems.filter((item) => item.status === 'PUBLISHED')),
    DRAFT: rootCount(visibleItems.filter((item) => item.status === 'DRAFT')),
    ARCHIVED: rootCount(visibleItems.filter((item) => item.status === 'ARCHIVED')),
  };

  const segmentedItems =
    statusTab === 'ALL' ? visibleItems : visibleItems.filter((item) => item.status === statusTab);

  // Grouped into a Journal -> Volume -> Issue -> Article tree, then paginated over the root
  // nodes rather than the flat item list: a Journal and its whole subtree can never be split
  // across two pages this way. `page` still only slices what is already loaded - changing it
  // does not refetch anything. Each page's roots are flattened (respecting `expandedIds`) into
  // exactly the rows the table renders, so a collapsed Journal contributes one row, not one
  // per Article underneath it.
  const roots = buildCatalogueTree(segmentedItems);
  const pageRoots = roots.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageItems = flattenVisible(pageRoots, expandedIds);

  return {
    filters,
    updateFilters,
    clear,
    statusTab,
    changeStatusTab,
    tabCounts,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    pageItems,
    // Root count, not flat item count: a collapsed Journal with a dozen Articles under it
    // counts as one here, matching what "N books listed" and the pager actually page through.
    total: roots.length,
    loading: list.loading,
    error: list.error,
    retry,
    hiddenCount,
    visibleCount: visibleItems.length,
    publisherOptions,
    toggleExpand,
  };
}
