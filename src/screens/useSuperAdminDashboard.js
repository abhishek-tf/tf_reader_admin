import { useEffect, useState } from 'react';
import { listPublishers } from '../api/publishers.js';
import { listInstitutions } from '../api/institution.js';
import { listAdminUsers } from '../api/adminUsers.js';
import { listCatalogueItems } from '../api/catalogueItems.js';
import { listAuditLogs } from '../api/auditLogs.js';
import { fetchAllPages } from '../api/client.js';

const ATTENTION_STATES = new Set(['QUEUED', 'PROCESSING', 'FAILED']);

/**
 * A SUPER_ADMIN sees the whole catalogue: real, global counts (Publishers/Institutions/
 * Operators are cheap `{size: 1}` calls, since only `.total` is wanted), the catalogue items
 * currently mid-ingest anywhere in it, and the tail of the global audit trail - the one list in
 * this console that is already SUPER_ADMIN-only server side (see shared.md), so nothing here
 * needs its own extra permission check.
 *
 * There is deliberately no cross-institution "pending entitlements" widget, unlike Stitch's own
 * mock: the contract has no endpoint to list entitlements across every institution at once,
 * only one institution at a time (see EntitlementsAdminScreen), and walking all of them just for
 * a dashboard count would be exactly the kind of expensive, easy-to-get-wrong aggregate the
 * brief warns against inventing.
 */
export function useSuperAdminDashboard() {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((c) => ({ ...c, loading: true, error: null }));

    Promise.all([
      listPublishers({ size: 1 }),
      listInstitutions({ size: 1 }),
      listAdminUsers({ size: 1 }),
      fetchAllPages((page) => listCatalogueItems({ page, size: 100 })),
      listAuditLogs({ size: 8 }),
    ])
      .then(([publisherPage, institutionPage, operatorPage, catalogueItems, activityPage]) => {
        if (cancelled) return;
        const attention = catalogueItems.filter((item) => ATTENTION_STATES.has(item.contentState));
        setState({
          loading: false,
          error: null,
          data: {
            totalPublishers: publisherPage.total,
            totalInstitutions: institutionPage.total,
            totalOperators: operatorPage.total,
            totalCatalogueItems: catalogueItems.length,
            attentionItems: attention.slice(0, 8),
            attentionTotal: attention.length,
            activity: activityPage.items,
          },
        });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  return { ...state, reload: () => setReloadCount((count) => count + 1) };
}
