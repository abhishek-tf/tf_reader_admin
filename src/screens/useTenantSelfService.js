import { useCallback, useEffect, useState } from 'react';
import { getTenant, setTenantDatabase, setTenantVaultKey } from '../api/tenants.js';

/**
 * Backs PublisherDatabaseVaultSection. `canRead` is deliberately separate from whether the
 * caller may write: GET /tenants/{id} is SUPER_ADMIN only, with no self-service carve-out, so a
 * PUBLISHER_ADMIN calling it always 403s. Rather than attempt-and-catch a guaranteed, expected
 * failure, this hook simply never calls getTenant when `canRead` is false. For that caller,
 * `tenant` starts and stays null until their own first successful PUT response populates it
 * locally for the rest of the session - there is no way to show "current status" before that,
 * and that gap is a real backend limitation (no self-service GET), not a bug here.
 */
export function useTenantSelfService(publisherId, canRead) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(canRead);
  const [error, setError] = useState(null);
  const [savingDatabase, setSavingDatabase] = useState(false);
  const [savingVaultKey, setSavingVaultKey] = useState(false);

  useEffect(() => {
    if (!canRead) return undefined;
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
  }, [publisherId, canRead]);

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
