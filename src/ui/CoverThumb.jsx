import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { getCachedCoverSrc, peekCachedCoverSrc } from './coverImageCache.js';

/**
 * A book's cover thumbnail, everywhere it appears in a table row - same markup and classes
 * BooksScreen always used, just sourced through coverImageCache so a full-catalogue refetch
 * (every keystroke in the Books search box, every filter/tab change, a plain page reload)
 * never re-downloads a cover already shown once. `updatedAt` is what lets a genuine re-upload
 * still show the new cover - see coverImageCache.js for why the URL itself can't be trusted as
 * a cache key.
 *
 * Three states, same box (`.book-cover-thumb`) throughout so nothing shifts as it settles:
 *  - resolving   a spinning version of the same placeholder icon everything else in this app
 *                spins mid-request (`.badge-PROCESSING`, `.upload-dropzone-busy`), for the
 *                brief gap while this row's own cover is being fetched or read out of cache
 *  - loaded      the real cover
 *  - failed      a cover with no reachable image - a broken presigned link, say - falls back
 *                to the same static placeholder a book with no cover at all gets, rather than
 *                the browser's own broken-image glyph
 *
 * Rows render immediately - nothing in BooksScreen waits for a cover to resolve before showing
 * the table - so this owns its own loading state end to end rather than depending on a
 * page-wide gate.
 */
export default function CoverThumb({ id, coverUrl, contentType, updatedAt }) {
  // Lazy initial state: checked once, synchronously, on this component's very first render -
  // not in an effect, which always runs a tick after the first paint. A cover already resolved
  // for an earlier page/filter (coverImageCache persists across both a refetch and a reload)
  // is a hit here, which is what lets it paint straight in rather than flashing the spinner for
  // one render first.
  const [resolvedSrc, setResolvedSrc] = useState(() =>
    coverUrl ? peekCachedCoverSrc(id, updatedAt) : null
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!coverUrl) {
      setResolvedSrc(null);
      return undefined;
    }
    // Re-check synchronously before falling back to the async path, for a row reused with new
    // props rather than freshly mounted (an edit lands and retry() reloads the same row in
    // place) - same reasoning as the lazy initial state above, just on a prop change instead
    // of on mount.
    const cached = peekCachedCoverSrc(id, updatedAt);
    if (cached) {
      setResolvedSrc(cached);
      return undefined;
    }
    let cancelled = false;
    getCachedCoverSrc(id, coverUrl, updatedAt).then((src) => {
      if (!cancelled) setResolvedSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [id, coverUrl, updatedAt]);

  if (resolvedSrc && !failed) {
    return (
      <img
        src={resolvedSrc}
        alt=""
        className="book-cover-thumb"
        aria-hidden="true"
        onError={() => setFailed(true)}
      />
    );
  }

  const resolving = Boolean(coverUrl) && !failed;
  return (
    <span className="book-cover-thumb book-cover-thumb-placeholder" aria-hidden="true">
      <Icon
        name={
          resolving ? 'progress_activity' : contentType === 'AUDIO' ? 'headphones' : 'menu_book'
        }
        className={resolving ? 'cover-thumb-spinner' : ''}
      />
    </span>
  );
}
