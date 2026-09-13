import { useEffect, useState } from 'react';
import { useToast } from './ToastContext.jsx';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { fetchAllPages } from '../api/client.js';

/**
 * Resolves a shelf's picked item ids into full catalogue items (title, cover, ISBN,
 * publisher...), for both the page's own picked list and the picker modal's right panel.
 *
 * The single-item endpoint requires publisher-level access and 403s for an institution admin -
 * the only role that actually uses this screen - so items are resolved from the list endpoint
 * instead of one request per id. `until` stops the walk the moment every picked id has turned
 * up, so this terminates quickly for any institution smaller than a few hundred books instead
 * of paging through its whole catalogue for nothing.
 */
export function useShelfItems(institutionId, itemIds) {
  const toast = useToast();
  const [items, setItems] = useState({});

  useEffect(() => {
    if (itemIds.every((id) => items[id])) return;
    let cancelled = false;
    fetchAllPages((page) => listCatalogueItems({ institutionId, page, size: 100 }), {
      until: (seen) => itemIds.every((id) => seen.some((item) => item.id === id)),
    })
      .then((loaded) => {
        if (cancelled) return;
        const found = {};
        for (const item of loaded) {
          if (itemIds.includes(item.id)) found[item.id] = item;
        }
        setItems((c) => ({ ...c, ...found }));
      })
      .catch((error) => {
        if (cancelled) return;
        toast.failed(error);
      });
    return () => {
      cancelled = true;
    };
    // Only re-running when a picked id is not yet known; re-running on every search keystroke
    // in the sibling panel would refetch the same page for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds]);

  return items;
}
