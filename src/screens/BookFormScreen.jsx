import { useEffect, useState } from 'react';
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
 * On create, BookForm saves metadata only; once that returns the newly created item, this
 * screen keeps rendering the same layout against it — still `/books/new`, not a redirect to
 * Edit — rather than switching to a different "now upload" screen. Saving again after that
 * (a metadata edit, not the original create) leaves the same way Edit's own save does.
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
  const [createdItem, setCreatedItem] = useState(null);
  const activeItem = editing ? record : createdItem;

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
    // The one save that must not leave: creating for the first time, which is what turns
    // this same screen into the "now upload" state instead of navigating anywhere.
    if (!editing && !createdItem && saved?.id) {
      setCreatedItem(saved);
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
          <BookForm initialItem={activeItem} onSaved={handleSaved} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
