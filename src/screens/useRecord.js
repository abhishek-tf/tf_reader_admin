import { useCallback, useEffect, useState } from 'react';

/**
 * Loads the one record a form screen is editing.
 *
 * A form that lives at its own address cannot rely on a row handed to it by a list: somebody
 * can arrive by typing the URL, by reloading, or from a bookmark. Every edit screen therefore
 * needs the same four things — the record, loading, the failure, and a way to retry — and
 * writing that out for the third time is what made it a hook rather than a coincidence.
 *
 * `id` undefined means create, so there is nothing to fetch and nothing to wait for.
 *
 * `load` must be a stable reference. Pass a module-level api function, not an arrow defined
 * during render, or the effect re-runs on every render and fetches forever.
 */
export function useRecord(load, id) {
  const [state, setState] = useState({ record: null, loading: id !== undefined, error: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (id === undefined) {
      setState({ record: null, loading: false, error: null });
      return undefined;
    }

    let cancelled = false;
    setState({ record: null, loading: true, error: null });

    load(id)
      .then((record) => {
        if (!cancelled) setState({ record, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ record: null, loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, [load, id, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { ...state, reload };
}
