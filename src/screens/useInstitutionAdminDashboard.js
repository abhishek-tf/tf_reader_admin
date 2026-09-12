import { useEffect, useState } from 'react';
import { getInstitution } from '../api/institution.js';
import { getFeedSettings } from '../api/feedSettings.js';
import { listEntitlements } from '../api/entitlements.js';
import { fetchAllPages } from '../api/client.js';

/**
 * An INSTITUTION_ADMIN's dashboard is their own institution: `getInstitution` for the record
 * itself (catalogueVersion, and — when the server sends them — its real entitlement/accessible-
 * item counts, the same fields InstitutionSummaryPanel already trusts), `getFeedSettings` for
 * their three curated shelves, and their own entitlement grants, walked once and split into
 * pending vs. everything else client-side (the contract has no status filter on that list, the
 * same constraint EntitlementsAdminScreen works around).
 *
 * No approve/reject here: that endpoint is SUPER_ADMIN only (shared.md), so a pending row is
 * shown as what it is - awaiting a super admin - not as an action this role cannot take.
 */
export function useInstitutionAdminDashboard(institutionId) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((c) => ({ ...c, loading: true, error: null }));

    Promise.all([
      getInstitution(institutionId),
      getFeedSettings(institutionId),
      fetchAllPages((page) => listEntitlements(institutionId, { page, size: 100 })),
    ])
      .then(([institution, feedSettings, entitlements]) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          data: {
            institution,
            feedSettings,
            pendingEntitlements: entitlements.filter((e) => e.status === 'PENDING'),
            activeEntitlements: entitlements.filter((e) => e.status === 'ACTIVE').length,
            totalEntitlements: entitlements.length,
          },
        });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error, data: null });
      });

    return () => {
      cancelled = true;
    };
  }, [institutionId, reloadCount]);

  return { ...state, reload: () => setReloadCount((count) => count + 1) };
}
