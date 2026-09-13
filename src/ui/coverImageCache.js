/**
 * Caches a catalogue item's cover image by item id (plus updatedAt), not by URL, and persists
 * it across a real page reload - not just within one tab's lifetime.
 *
 * `coverUrl` is a presigned link (same private-bucket path as the book file itself - see
 * wokay-api.yaml, uploadCatalogueItemCover) and every full-catalogue refetch in useBooks.js
 * hands back a freshly-issued one for the same image, even though the file underneath is
 * unchanged. A fresh URL is a new cache key to the browser's own HTTP cache, so the cover
 * re-downloads on every refetch - which on the Books page is every keystroke in the
 * unthrottled search box, plus every filter/tab change, plus every plain reload of the page.
 *
 * Keyed on `id` + `updatedAt` rather than `id` alone: `updatedAt` is "touched by every write,
 * including ingest state changes" per the contract, which covers a real cover re-upload too -
 * so a stale cached image self-invalidates the moment the item it belongs to actually changes,
 * without needing to compare bytes or parse the presigned URL's own expiry.
 *
 * Two layers:
 *  - an in-memory Map, for the fastest path within one page's lifetime (no async round trip
 *    at all once warm)
 *  - the browser's Cache Storage API, which is what survives a reload. Keyed on a synthetic,
 *    never-actually-requested URL built from the cache key above, since Cache Storage keys off
 *    a Request/URL and the real coverUrl is exactly the unstable thing being worked around.
 *
 * Entries are never evicted here: an admin session's whole catalogue of cover thumbnails is
 * small, and a stale key (an old id+updatedAt pair whose item has since changed again) is just
 * unused storage, not a correctness problem, since it is never looked up again once the row's
 * `updatedAt` moves past it.
 */
const CACHE_NAME = 'tf-reader-admin-book-covers-v1';
const objectUrlByKey = new Map();
const pendingByKey = new Map();

function cacheKey(id, updatedAt) {
  return `${id}::${updatedAt ?? ''}`;
}

function syntheticRequest(key) {
  return new Request(`https://covers.cache.local/${encodeURIComponent(key)}`);
}

async function openCache() {
  if (typeof caches === 'undefined') return null; // no Cache Storage support - degrade quietly
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

/**
 * Synchronous in-memory lookup, with no `Promise` and no microtask even on a hit - for a
 * component's own initial render, so a cover already resolved once paints immediately instead
 * of committing one render of the spinner it does not need, then swapping to the image a tick
 * later. Returns `null` on a miss; the caller falls back to `getCachedCoverSrc` for that.
 */
export function peekCachedCoverSrc(id, updatedAt) {
  return objectUrlByKey.get(cacheKey(id, updatedAt)) ?? null;
}

/**
 * Resolves to a `blob:` URL for this item's cover, fetched over the network at most once per
 * `id`+`updatedAt` pair, ever - not once per page load. Falls back to the remote URL unchanged
 * when there is nothing to cache (no cover) or the fetch fails, so a cover that can't be
 * cached still tries to show exactly as it did before any of this existed.
 */
export function getCachedCoverSrc(id, remoteUrl, updatedAt) {
  if (!remoteUrl) return Promise.resolve(null);

  const key = cacheKey(id, updatedAt);

  const inMemory = objectUrlByKey.get(key);
  if (inMemory) return Promise.resolve(inMemory);

  const pending = pendingByKey.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const cache = await openCache();
    const request = syntheticRequest(key);

    if (cache) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrlByKey.set(key, objectUrl);
        return objectUrl;
      }
    }

    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error(`cover fetch failed: ${response.status}`);
    // Stored under the synthetic id+updatedAt request, never the real (rotating) coverUrl, so
    // the next reissued presigned URL for this same, unchanged item still lands on this entry.
    if (cache) await cache.put(request, response.clone());
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    objectUrlByKey.set(key, objectUrl);
    return objectUrl;
  })()
    .catch(() => remoteUrl)
    .finally(() => {
      pendingByKey.delete(key);
    });

  pendingByKey.set(key, promise);
  return promise;
}
