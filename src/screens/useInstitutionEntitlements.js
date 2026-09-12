import { useCallback, useEffect, useState } from 'react';
import { listEntitlements } from '../api/entitlements.js';
import { listCatalogueItems, getCatalogueItem } from '../api/catalogueItems.js';
import { fetchAllPages } from '../api/client.js';

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
 */
export function useInstitutionEntitlements(institutionId) {
  const [entitlements, setEntitlements] = useState([]);
  const [loadingEntitlements, setLoadingEntitlements] = useState(true);
  const [entitlementsError, setEntitlementsError] = useState(null);
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoadingEntitlements(true);
    setEntitlementsError(null);
    setBooks([]);

    fetchAllPages((page) => listEntitlements(institutionId, { page, size: 100 }))
      .then(async (loaded) => {
        if (cancelled) return;
        setEntitlements(loaded);
        setLoadingEntitlements(false);
        setLoadingBooks(true);

        const itemIds = loaded.filter((e) => e.scopeType === 'ITEM').map((e) => e.scopeId);
        const publisherIds = [
          ...new Set(loaded.filter((e) => e.scopeType === 'PUBLISHER').map((e) => e.scopeId)),
        ];
        const collectionIds = [
          ...new Set(loaded.filter((e) => e.scopeType === 'COLLECTION').map((e) => e.scopeId)),
        ];

        const [fromItems, fromPublishers, fromCollections] = await Promise.all([
          Promise.all(itemIds.map((id) => getCatalogueItem(id).catch(() => null))),
          Promise.all(
            publisherIds.map((publisherId) =>
              fetchAllPages((page) => listCatalogueItems({ publisherId, page, size: 100 })).catch(
                () => []
              )
            )
          ),
          Promise.all(
            collectionIds.map((collectionId) =>
              fetchAllPages((page) => listCatalogueItems({ collectionId, page, size: 100 })).catch(
                () => []
              )
            )
          ),
        ]);

        if (cancelled) return;
        const byId = new Map();
        for (const item of [
          ...fromItems.filter(Boolean),
          ...fromPublishers.flat(),
          ...fromCollections.flat(),
        ]) {
          byId.set(item.id, item);
        }
        setBooks([...byId.values()]);
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
  }, [institutionId, reloadCount]);

  return { entitlements, loadingEntitlements, entitlementsError, books, loadingBooks, reload };
}
