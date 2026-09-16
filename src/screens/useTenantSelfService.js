import { useCallback, useEffect, useState } from 'react';
import { getTenant, setTenantDatabase, setTenantVaultKey } from '../api/tenants.js';

/**
 * Backs PublisherDatabaseVaultSection. `GET /tenants/{id}` and the two `PUT` self-service
 * endpoints now share the exact same access rule on the backend (that publisher's own
 * PUBLISHER_ADMIN, or any SUPER_ADMIN) - so `canAccess` gates both fetching and writing here,
 * with nothing left to fetch when the caller isn't allowed to see it in the first place.
 */
export function useTenantSelfService(publisherId, canAccess) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(canAccess);
  const [error, setError] = useState(null);
  const [savingDatabase, setSavingDatabase] = useState(false);
  const [savingVaultKey, setSavingVaultKey] = useState(false);

  useEffect(() => {
    if (!canAccess) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTenant(publisherId)
      .then((loaded) => {
        if (!cancelled) setTenant(loaded);
      })
      .catch((failure) => {
        if (!cancelled) setError(failure);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publisherId, canAccess]);

  const saveDatabase = useCallback(
    async (mongoUri) => {
      setSavingDatabase(true);
      try {
        const updated = await setTenantDatabase(publisherId, mongoUri);
        setTenant(updated);
        return updated;
      } finally {
        setSavingDatabase(false);
      }
    },
    [publisherId]
  );

  const saveVaultKey = useCallback(
    async (keyBase64) => {
      setSavingVaultKey(true);
      try {
        const updated = await setTenantVaultKey(publisherId, keyBase64);
        setTenant(updated);
        return updated;
      } finally {
        setSavingVaultKey(false);
      }
    },
    [publisherId]
  );

  return { tenant, loading, error, savingDatabase, savingVaultKey, saveDatabase, saveVaultKey };
}
