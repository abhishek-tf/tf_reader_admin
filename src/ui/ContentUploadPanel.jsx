import { useCallback, useEffect, useRef, useState } from 'react';
import FieldLabel from './FieldLabel.jsx';
import IngestStateBadge from './IngestStateBadge.jsx';
import { getIngestStatus, uploadCatalogueItemContent } from '../api/catalogueItems.js';
import { useToast } from './ToastContext.jsx';

const FILE_ID = 'content-file';
const HINT_ID = `${FILE_ID}-hint`;
const ERROR_ID = `${FILE_ID}-error`;

// The backend's own queue ticks every 5s and its watchdog gives up at 15 minutes, so asking
// every 3s is often enough to look live without asking twice per tick for nothing.
const POLL_INTERVAL_MS = 3000;
// The two states ingest passes through. Everything else — READY, FAILED, NONE — is where it
// stops, and so is where this stops asking.
const POLLING_STATES = ['QUEUED', 'PROCESSING'];

// What each content type's file is expected to be called, so an obvious mistake is caught here
// rather than several minutes later as a FAILED ingest saying something like "failed to read PDF
// for search indexing". The extensions follow the one mime type the backend assigns to each
// format in AssetLocker.mimeTypeFor: application/pdf, application/epub+zip and audio/mpeg — and
// audio/mpeg is .mp3, which is also the only audio file in the backend's seed dataset. No other
// audio extension is listed because nothing in the contract supports one.
//
// This is a courtesy check on the file's name, nothing more. A name proves nothing about the
// bytes, so the backend stays the real validation.
const EXPECTED_EXTENSIONS = {
  PDF: ['.pdf'],
  EPUB: ['.epub'],
  AUDIO: ['.mp3'],
};

const FORMAT_MISMATCH = 'File format does not match content type.';

/**
 * Upload the file for one book, and follow its ingest until it settles.
 *
 * Lives beside the metadata form rather than inside it: a book being created has no id yet, so
 * there is nothing to upload to, and a second submit button inside that form would save the
 * metadata instead of sending the file.
 *
 * Polling is one setTimeout that reschedules itself, not an interval: an interval keeps firing
 * while a slow response is still outstanding and stacks requests on an already struggling
 * server. It begins either when an upload is accepted, or on mount when the book arrives
 * already mid-ingest — somebody who opens this screen while a file is being processed should
 * not have to upload it again to see it finish.
 */
export default function ContentUploadPanel({ item }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(null);

  // The one outstanding timeout, if there is one. A ref rather than state because nothing
  // renders it, and changing it must not cause a render.
  const timerRef = useRef(null);
  // Which run of the poll loop is the current one. A new upload bumps it, and so does
  // unmounting, so a timeout that has already fired or a GET still in flight can see that it
  // belongs to a superseded run and do nothing. Clearing the timeout alone would not catch the
  // request that is already on its way back.
  const cycleRef = useRef(0);

  /**
   * Asks for the status once, after the interval, and books the next ask only if ingest is
   * still moving. The first question is deliberately not asked straight away: whoever started
   * this run has just been told the state, and asking again in the same breath would only be
   * told so again.
   *
   * The recursion goes through the inner name `schedule`, not through the outer binding, so
   * this stays a stable dependency for the effect below rather than one that rebuilds itself.
   */
  const pollAfterDelay = useCallback(
    function schedule(cycle) {
      // At most one timeout outstanding: the previous one goes before another is set.
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(async () => {
        let next;
        try {
          next = await getIngestStatus(item.id);
        } catch (cause) {
          // Stop rather than keep asking an endpoint that is already answering with an error.
          // The operator can start a fresh run by uploading again, and the toast carries the
          // traceId that makes this reportable.
          if (cycle === cycleRef.current) toast.failed(cause);
          return;
        }
        // A newer run started, or the panel went away, while this was in flight.
        if (cycle !== cycleRef.current) return;
        setUploaded(next);
        if (POLLING_STATES.includes(next.contentState)) schedule(cycle);
      }, POLL_INTERVAL_MS);
    },
    [item.id, toast]
  );

  // Pick up an ingest that was already running when this panel appeared, and tidy up after
  // whichever run is current when it goes away.
  //
  // Safe under StrictMode's mount/cleanup/mount: the cleanup retires the first run's cycle and
  // clears its timeout, then the second mount starts one fresh run. One timer either way.
  useEffect(() => {
    if (POLLING_STATES.includes(item.contentState)) {
      pollAfterDelay((cycleRef.current += 1));
    }
    return () => {
      cycleRef.current += 1;
      window.clearTimeout(timerRef.current);
    };
  }, [item.contentState, pollAfterDelay]);

  // Computed during render rather than copied into state: the record stays the source of truth
  // until an upload actually returns something newer, and there is no effect to keep in step.
  const current = uploaded ?? item;

  // AssetFormat and ContentType are the same three values — PDF, EPUB, AUDIO — so the book's
  // own contentType is the format. Nothing to map, and nothing for the operator to choose:
  // the server rejects a format that disagrees with the item, so a picker could only ever
  // produce a failure.
  const format = item.contentType;

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    setError(null);

    // An unrecognised contentType is left to the server rather than guessed at here.
    const expected = EXPECTED_EXTENSIONS[item.contentType];
    if (chosen && expected && !expected.some((ext) => chosen.name.toLowerCase().endsWith(ext))) {
      toast.failed(FORMAT_MISMATCH);
      // Dropping the file leaves Upload disabled, so nothing is sent and no ingest is started.
      // Clearing the input as well means picking the *same* file again still fires a change
      // event, which it would not if the element kept holding it.
      event.target.value = '';
      setFile(null);
      return;
    }

    setFile(chosen);
  }

  async function handleUpload() {
    // Guards the double click as well as the disabled attribute does, because a fast second
    // click can land before React has re-rendered the button.
    if (uploading || !file) return;
    setError(null);
    setUploading(true);
    try {
      const status = await uploadCatalogueItemContent(item.id, file, format);
      setUploaded(status);
      toast.saved('Upload queued.');
      // Bumped even when there is nothing to poll, so any earlier run is retired either way.
      const cycle = (cycleRef.current += 1);
      if (POLLING_STATES.includes(status.contentState)) pollAfterDelay(cycle);
    } catch (cause) {
      // The same split BookForm makes: a validation message belongs next to the field, and
      // anything else is a toast, which is what carries the traceId. A file over the size cap
      // arrives as VALIDATION_FAILED too, so the limit the operator reads is the server's own
      // — it differs by access tier, and this file does not know it.
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
      <h2>Content file</h2>

      <p className="muted">
        Current state: <IngestStateBadge state={current.contentState} />
      </p>
      {current.contentState === 'FAILED' && current.contentError ? (
        <p className="content-error">{current.contentError}</p>
      ) : null}
      {current.updatedAt ? (
        <p className="muted small" title={current.updatedAt}>
          Updated {new Date(current.updatedAt).toLocaleString()}
        </p>
      ) : null}

      <div className="field">
        <FieldLabel id={FILE_ID} label="Choose a file" />
        <input
          id={FILE_ID}
          name="file"
          type="file"
          className="input"
          disabled={uploading}
          onChange={handleFileChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${HINT_ID} ${ERROR_ID}` : HINT_ID}
        />
        <p className="muted small" id={HINT_ID}>
          Sent as {format}, matching this book&apos;s content type.
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
