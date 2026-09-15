import { useEffect, useState } from 'react';
import { listPublishers } from '../api/publishers.js';

/**
 * Every publisher, for a picker - the same `listPublishers({ size: 100 })` call
 * `useBooks.js`'s own publisher filter already uses. Pass `false` to skip the request
 * entirely (e.g. a PUBLISHER_ADMIN whose own picker is locked to their scope and never shows
 * this list, so there is nothing to fetch it for). A failure just leaves the list empty rather
 * than blocking whatever form or filter is asking for it.
 */
export function usePublisherOptions(enabled = true) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    listPublishers({ size: 100 })
      .then((loaded) => {
        if (!cancelled) setOptions(loaded.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return options;
}
