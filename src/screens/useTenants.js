import { useCallback, useEffect, useMemo, useState } from 'react';
import { listTenants } from '../api/tenants.js';

/**
 * Loads every tenant once - the real endpoint takes no parameters and returns a plain array,
 * so there is no server-side paging or filtering to hold state for, and no staleness-guard
 * machinery needed (a single unparameterized fetch can't race itself the way a filtered one
 * could). `q` is a client-side-only search over the already-fetched rows, matched against a
 * tenant's code and name.
 */
export function useTenants() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listTenants());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (t) => t.code.toLowerCase().includes(needle) || t.name.toLowerCase().includes(needle)
    );
  }, [items, q]);

  return { q, setQ, items: filtered, total: filtered.length, loading, error, reload: load };
}
