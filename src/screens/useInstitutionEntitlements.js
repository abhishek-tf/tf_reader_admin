import { useCallback, useEffect, useState } from 'react';
import { listEntitlements } from '../api/entitlements.js';
import { listCatalogueItems, getCatalogueItem } from '../api/catalogueItems.js';
import { fetchAllPages } from '../api/client.js';
import { buildCatalogueTree, flattenVisible } from './bookTree.js';

/**
 * Every entitlement an institution holds, plus the distinct books they resolve to.
 *
 * There is no single endpoint for "every book this institution can reach" — only
 * `AdminInstitution.summary.accessibleItemCount`, a deduplicated count with nothing behind it
 * to list. This resolves the same way that count is described as being computed: per grant,
 * by its scope. `ITEM` is the book itself; `PUBLISHER`/`COLLECTION` are resolved with exactly
 * the filters the Books page's own picker already sends (`publisherId`/`collectionId`), not a
 * new capability. Books reachable through more than one entitlement are merged once, by id —
 * the same overlap `resolvedItemCount` warns does not sum across grants.
 *
 * Only `ACTIVE` entitlements are resolved into books — a PENDING/SUSPENDED/REVOKED grant does
 * not currently give the institution access, so its books should not appear here even though
 * the Entitlements table above (which shows every status, on purpose) still lists the grant.
 *
 * The resolved set is grouped into a Journal -> Volume -> Issue -> Article tree the same way
 * the Books page does (`bookTree.js`), collapsed by default, so a Journal reachable through one
 * grant shows as one row with its Volumes/Issues/Articles nested under it, not as unrelated
 * flat siblings.
 */
export function useInstitutionEntitlements(institutionId) {
  const [entitlements, setEntitlements] = useState([]);
  const [loadingEntitlements, setLoadingEntitlements] = useState(true);
  const [entitlementsError, setEntitlementsError] = useState(null);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [booksError, setBooksError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [reloadCount, setReloadCount] = useState(0);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingEntitlements(true);
    setEntitlementsError(null);
    setBooksError(null);
    setBooks([]);

    fetchAllPages((page) => listEntitlements(institutionId, { page, size: 100 }))
      .then(async (loaded) => {
        if (cancelled) return;
        setEntitlements(loaded);
        setLoadingEntitlements(false);
        setLoadingBooks(true);

        const active = loaded.filter((e) => e.status === 'ACTIVE');
        const itemIds = active.filter((e) => e.scopeType === 'ITEM').map((e) => e.scopeId);
        const publisherIds = [
          ...new Set(active.filter((e) => e.scopeType === 'PUBLISHER').map((e) => e.scopeId)),
        ];
        const collectionIds = [
          ...new Set(active.filter((e) => e.scopeType === 'COLLECTION').map((e) => e.scopeId)),
        ];

        // Each lookup's own failure is recorded rather than swallowed into null/[] - a failed
        // fetch should surface as an error, not read as "this institution has no books".
        let anyFailed = false;
        const [fromItems, fromPublishers, fromCollections] = await Promise.all([
          Promise.all(
            itemIds.map((id) =>
              getCatalogueItem(id).catch(() => {
                anyFailed = true;
                return null;
              })
            )
          ),
          Promise.all(
            publisherIds.map((publisherId) =>
              fetchAllPages((page) => listCatalogueItems({ publisherId, page, size: 100 })).catch(
                () => {
                  anyFailed = true;
                  return [];
                }
              )
            )
          ),
          Promise.all(
            collectionIds.map((collectionId) =>
              fetchAllPages((page) =>
                listCatalogueItems({ collectionId, page, size: 100 })
              ).catch(() => {
                anyFailed = true;
                return [];
              })
            )
          ),
        ]);

        if (cancelled) return;

        if (anyFailed) {
          setBooksError(new Error("Could not load every book behind this institution's entitlements."));
          setLoadingBooks(false);
          return;
        }

        const byId = new Map();
        for (const item of [
          ...fromItems.filter(Boolean),
          ...fromPublishers.flat(),
          ...fromCollections.flat(),
        ]) {
          byId.set(item.id, item);
        }
        setBooks(flattenVisible(buildCatalogueTree([...byId.values()]), expandedIds));
        setLoadingBooks(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setEntitlementsError(error);
        setLoadingEntitlements(false);
      });

    return () => {
      cancelled = true;
    };
    // expandedIds is deliberately excluded - toggling expand re-flattens without refetching,
    // handled by the effect below instead of re-running this whole load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId, reloadCount]);

  // Re-flatten in place when a row is expanded/collapsed, without refetching anything - the
  // raw resolved items aren't kept in state, so re-derive the tree from the last flattened
  // set's own root rows (flattenVisible spreads each node, so `children` survives on every row).
  useEffect(() => {
    setBooks((current) => {
      if (current.length === 0) return current;
      const roots = current.filter((row) => row.depth === 0);
      return flattenVisible(roots, expandedIds);
    });
  }, [expandedIds]);

  return {
    entitlements,
    loadingEntitlements,
    entitlementsError,
    books,
    loadingBooks,
    booksError,
    toggleExpand,
    reload,
  };
}
