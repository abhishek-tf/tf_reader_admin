import { useEffect, useState } from 'react';
import { getPublisher } from '../api/publishers.js';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { fetchAllPages } from '../api/client.js';

const ATTENTION_STATES = new Set(['QUEUED', 'PROCESSING', 'FAILED']);

/**
 * A PUBLISHER_ADMIN's dashboard is their own imprint: `getPublisher` on their own
 * `scopePublisherId` for the record itself (name, status, the real `itemCount`/
 * `collectionCount` the Publishers table already trusts), and their own catalogue - `
 * listCatalogueItems` needs no `publisherId` filter here because the server already scopes a
 * PUBLISHER_ADMIN's own calls to their own publisher, the same way every other screen that
 * calls it does.
 */
export function usePublisherAdminDashboard(publisherId) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((c) => ({ ...c, loading: true, error: null }));

    Promise.all([
      getPublisher(publisherId),
      fetchAllPages((page) => listCatalogueItems({ page, size: 100 })),
    ])
      .then(([publisher, catalogueItems]) => {
        if (cancelled) return;
        const attention = catalogueItems.filter((item) => ATTENTION_STATES.has(item.contentState));
        setState({
          loading: false,
          error: null,
          data: {
            publisher,
            totalItems: catalogueItems.length,
            publishedCount: catalogueItems.filter((item) => item.status === 'PUBLISHED').length,
            draftCount: catalogueItems.filter((item) => item.status === 'DRAFT').length,
            attentionItems: attention.slice(0, 8),
            attentionTotal: attention.length,
          },
        });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [publisherId, reloadCount]);

  return { ...state, reload: () => setReloadCount((count) => count + 1) };
}
