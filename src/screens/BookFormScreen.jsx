import { useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import BookForm from '../ui/BookForm.jsx';
import Icon from '../ui/Icon.jsx';
import { useRecord } from './useRecord.js';
import RecordLoadState from '../ui/RecordLoadState.jsx';
import { getCatalogueItem } from '../api/catalogueItems.js';

/**
 * Create or edit one book, at its own address.
 *
 * `/books/new` creates. `/books/:itemId/edit` edits.
 *
 * On create, BookForm saves metadata only (and uploads any staged content/cover inline, since
 * it already holds those files); the moment that succeeds, this screen switches the address to
 * `/books/{id}/edit` rather than staying on `/books/new`. That used to not happen — the screen
 * kept rendering the same layout against the newly created item without ever changing the
 * URL — but it meant a reload at any point after creation (including mid-upload) landed back
 * on a blank `/books/new` with no memory of the item the backend already has. `/books/{id}/edit`
 * already knows how to re-fetch that record and (via ContentUploadPanel) resume polling a
 * `QUEUED`/`PROCESSING` upload on its own, so switching to it immediately reuses that instead
 * of needing new persistence.
 *
 * Rendered through BooksScreen's own `<Outlet/>` (see App.jsx's nested `/books` routes), not
 * in place of it — so the table is still mounted underneath, and `.drawer-page`'s
 * fixed-position backdrop dims and blurs the real thing, matching Stitch's own overlay
 * instead of a flat tint over an empty page.
 *
 * That same persistence is why this reloads the list itself on unmount: before the list
 * stayed mounted, returning to /books was always a fresh BooksScreen, which fetched fresh
 * for free. Now it's the same BooksScreen the whole time, so a status edit that landed on
 * the server would otherwise go on showing the row's old status until a manual reload. Runs
 * on unmount rather than only after a save so Cancel and the close button reload it too —
 * harmless (the same filters, re-asked), and one rule instead of three call sites to keep in
 * sync.
 */
export default function BookFormScreen() {
  const { itemId } = useParams();
  const editing = itemId !== undefined;
  const navigate = useNavigate();
  const { reload: reloadList } = useOutletContext() ?? {};
  const { record, loading, error, reload } = useRecord(getCatalogueItem, itemId);

  useEffect(() => () => reloadList?.(), [reloadList]);

  function handleCancel() {
    navigate('/books');
  }

  // Only while there's no record at all yet — once one has loaded, a stray re-fetch
  // flipping `loading` back to true must not blank out a form the operator is mid-edit on.
  // `RecordLoadState` renders bare (no drawer chrome around it), so gating on `loading` alone
  // meant any re-render that revisited this branch made the whole panel appear to vanish.
  if (editing && !record && (loading || error)) {
    return (
      <RecordLoadState
        loading={loading}
        error={error}
        onRetry={reload}
        backTo="/books"
        backLabel="Back to books"
      />
    );
  }

  function handleSaved(saved) {
    // Creating for the first time switches straight to /books/{id}/edit - see the doc comment
    // above. Editing (a metadata save on an item that already existed) just closes the drawer,
    // same as every other edit screen in this app.
    if (!editing && saved?.id) {
      navigate(`/books/${saved.id}/edit`, { replace: true });
      return;
    }
    navigate('/books');
  }

  return (
    <div className="drawer-page">
      <div className="drawer-page-panel">
        <div className="drawer-header">
          <div>
            <div className="drawer-eyebrow">
              <span>Books</span>
              <span style={{ color: 'var(--line)' }}>/</span>
              <span>{editing ? 'Edit item' : 'New item'}</span>
            </div>
            <h2 className="drawer-title">{editing ? 'Edit catalogue item' : 'New catalogue item'}</h2>
          </div>
          <button type="button" className="modal-close" aria-label="Cancel and go back" onClick={handleCancel}>
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">
          <BookForm initialItem={editing ? record : null} onSaved={handleSaved} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
