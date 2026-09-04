import { useState } from 'react';
import FieldLabel from './FieldLabel.jsx';
import { uploadCatalogueItemCover } from '../api/catalogueItems.js';
import { useToast } from './ToastContext.jsx';

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
 */
export default function CoverUploadPanel({ item }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(null);

  // Computed during render rather than copied into state: the record stays the source of
  // truth until an upload actually returns something newer.
  const current = uploaded ?? item;

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    setError(null);

    // A name proves nothing about the bytes, so the backend stays the real validation. This is
    // a courtesy check only.
    if (chosen && !chosen.type.startsWith('image/')) {
      toast.failed('Choose an image file.');
      event.target.value = '';
      setFile(null);
      return;
    }

    if (chosen && chosen.size > MAX_BYTES) {
      toast.failed(`File exceeds the ${MAX_BYTES / 1024 / 1024} MB upload limit.`);
      event.target.value = '';
      setFile(null);
      return;
    }

    setFile(chosen);
  }

  async function handleUpload() {
    if (uploading || !file) return;
    setError(null);
    setUploading(true);
    try {
      const refreshed = await uploadCatalogueItemCover(item.id, file);
      setUploaded(refreshed);
      toast.saved('Cover uploaded.');
      setFile(null);
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
    <div>
      <h2>Cover image</h2>

      {current.coverUrl ? (
        <p>
          <img src={current.coverUrl} alt="Cover preview" className="cover-preview" />
        </p>
      ) : null}

      <div className="field">
        <FieldLabel id={FILE_ID} label="Choose an image" />
        <input
          id={FILE_ID}
          name="file"
          type="file"
          accept="image/*"
          className="input"
          disabled={uploading}
          onChange={handleFileChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${HINT_ID} ${ERROR_ID}` : HINT_ID}
        />
        <p className="muted small" id={HINT_ID}>
          Up to {MAX_BYTES / 1024 / 1024} MB.
        </p>
        {error ? (
          <p className="field-error" id={ERROR_ID} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {file ? <p className="muted small">Selected: {file.name}</p> : null}

      <div className="form-actions">
        {/* type="button" so it can never submit a form this panel is rendered next to. */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
