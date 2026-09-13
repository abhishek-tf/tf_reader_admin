import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { uploadCatalogueItemCover } from '../api/catalogueItems.js';
import { useToast } from './ToastContext.jsx';
import { getCachedCoverSrc, peekCachedCoverSrc } from './coverImageCache.js';

const FILE_ID = 'cover-file';
const HINT_ID = `${FILE_ID}-hint`;
const ERROR_ID = `${FILE_ID}-error`;

// The cap the backend enforces for a cover, checked here only so an obviously oversized file
// fails in the browser rather than after crossing the wire. The server still enforces it, and
// its 413 is still handled below.
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload a cover image for one book, and show the one currently on record.
 *
 * Lives beside the metadata form rather than inside it, the same reasoning as
 * ContentUploadPanel: a book being created has no id yet, so there is nothing to upload to.
 *
 * Laid out as Stitch's "Cover Artwork" card — a thumbnail beside a Choose File control — but
 * the thumbnail shows the real cover already on record (or a placeholder, if there is none)
 * rather than the fixed mockup image Stitch's own drawer shows, and the hint states this
 * panel's actual size cap rather than Stitch's resolution recommendation, which nothing here
 * enforces.
 *
 * Choosing a file uploads it immediately — there is no separate Upload button, since picking
 * again is the only thing an operator could otherwise do in between.
 */
export default function CoverUploadPanel({ item }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(null);

  // Computed during render rather than copied into state: the record stays the source of
  // truth until an upload actually returns something newer.
  const current = uploaded ?? item;

  // Same reasoning as CoverThumb.jsx: current.coverUrl is a freshly re-presigned S3/B2 link on
  // every load of this screen, so it can't be trusted as a cache key - id + updatedAt can, and
  // coverImageCache.js already keys on exactly that. peekCachedCoverSrc as the lazy initial
  // state paints a cover already seen elsewhere in the app instantly, with no network request
  // and no spinner flash; getCachedCoverSrc handles the miss (including right after a fresh
  // upload, whose new updatedAt naturally busts the old cache entry).
  const [resolvedSrc, setResolvedSrc] = useState(() =>
    current.coverUrl ? peekCachedCoverSrc(current.id, current.updatedAt) : null
  );

  useEffect(() => {
    if (!current.coverUrl) {
      setResolvedSrc(null);
      return undefined;
    }
    const cached = peekCachedCoverSrc(current.id, current.updatedAt);
    if (cached) {
      setResolvedSrc(cached);
      return undefined;
    }
    let cancelled = false;
    getCachedCoverSrc(current.id, current.coverUrl, current.updatedAt).then((src) => {
      if (!cancelled) setResolvedSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [current.id, current.coverUrl, current.updatedAt]);

  async function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    setError(null);
    // Clearing the input means picking the *same* file again still fires a change event,
    // which it would not if the element kept holding it.
    event.target.value = '';
    if (!chosen) return;

    // A name proves nothing about the bytes, so the backend stays the real validation. This is
    // a courtesy check only.
    if (!chosen.type.startsWith('image/')) {
      toast.failed('Choose an image file.');
      return;
    }

    if (chosen.size > MAX_BYTES) {
      toast.failed(`File exceeds the ${MAX_BYTES / 1024 / 1024} MB upload limit.`);
      return;
    }

    setUploading(true);
    try {
      const refreshed = await uploadCatalogueItemCover(item.id, chosen);
      setUploaded(refreshed);
      toast.saved('Cover uploaded.');
    } catch (cause) {
      // The same split BookForm and ContentUploadPanel make: a validation message belongs
      // next to the field, and anything else is a toast, which is what carries the traceId.
      if (cause.isValidation) {
        setError(cause.traceId ? `${cause.friendly} (trace ${cause.traceId})` : cause.friendly);
      } else {
        toast.failed(cause);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="cover-upload-card">
      <div className="cover-upload-thumb">
        {resolvedSrc ? <img src={resolvedSrc} alt="Cover preview" /> : <Icon name="image" />}
      </div>
      <div className="cover-upload-body">
        <span className="cover-upload-title">Upload cover image</span>
        <p className="muted small" id={HINT_ID}>
          JPEG, PNG or WebP, up to {MAX_BYTES / 1024 / 1024} MB.
        </p>
        <div className="cover-upload-choose">
          <label className="btn upload-choose-btn" htmlFor={FILE_ID}>
            {uploading ? 'Uploading...' : 'Choose file'}
          </label>
          <input
            id={FILE_ID}
            name="file"
            type="file"
            className="file-input-hidden"
            accept="image/*"
            disabled={uploading}
            onChange={handleFileChange}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${HINT_ID} ${ERROR_ID}` : HINT_ID}
          />
          <span className="muted small">{uploading ? '' : 'No file chosen'}</span>
        </div>
        {error ? (
          <p className="field-error" id={ERROR_ID} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
