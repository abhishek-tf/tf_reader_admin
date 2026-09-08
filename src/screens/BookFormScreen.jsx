import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BookForm from '../ui/BookForm.jsx';
import ContentUploadPanel from '../ui/ContentUploadPanel.jsx';
import CoverUploadPanel from '../ui/CoverUploadPanel.jsx';
import { useRecord } from './useRecord.js';
import RecordLoadState from '../ui/RecordLoadState.jsx';
import { getCatalogueItem } from '../api/catalogueItems.js';

/**
 * Renders the create/edit form, or the upload step once a new book has an id.
 *
 * A book being created has no id until BookForm's create call returns, so the cover and content
 * panels cannot appear beside the form the way they do on Edit — there is nothing yet to upload
 * to. Once `createdItem` exists, the form is replaced by both upload panels against that item.
 */
function BookFormContent({ editing, record, createdItem, onSaved, onCancel, onDone }) {
  if (!editing && createdItem) {
    return (
      <>
        <section className="card">
          <p className="muted">
            Book created. Add a cover and content below, or finish and add them later.
          </p>
        </section>

        <section className="card">
          <CoverUploadPanel item={createdItem} />
        </section>

        <section className="card">
          <ContentUploadPanel item={createdItem} />
        </section>

        <section className="card">
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={onDone}>
              Done
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="card">
        <BookForm initialItem={record} onSaved={onSaved} onCancel={onCancel} />
      </section>

      {editing && record ? (
        <>
          <section className="card">
            <ContentUploadPanel item={record} />
          </section>

          <section className="card">
            <CoverUploadPanel item={record} />
          </section>
        </>
      ) : null}
    </>
  );
}

/**
 * Create or edit one book, at its own address.
 *
 * `/books/new` creates. `/books/:itemId/edit` edits.
 *
 * On create, BookForm saves metadata only. Once that returns the newly created item, this
 * screen moves to an upload step — still `/books/new`, not a redirect to Edit — showing the
 * same CoverUploadPanel and ContentUploadPanel Edit uses, against the new item. Both are
 * optional and independent, so the operator can upload a cover, content, both, or neither
 * before choosing Done.
 *
 * Editing keeps its existing form-plus-upload-panels behavior unchanged.
 */
export default function BookFormScreen() {
  const { itemId } = useParams();
  const editing = itemId !== undefined;
  const navigate = useNavigate();
  const { record, loading, error, reload } = useRecord(getCatalogueItem, itemId);
  const [createdItem, setCreatedItem] = useState(null);

  if (editing && (loading || error)) {
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
    if (editing || !saved?.id) {
      navigate('/books');
      return;
    }

    setCreatedItem(saved);
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="row-buttons">
          <Link className="btn" to="/books">
            Back to books
          </Link>
        </div>

        <h1>{editing ? 'Edit book' : 'Add book'}</h1>
      </section>

      <BookFormContent
        editing={editing}
        record={record}
        createdItem={createdItem}
        onSaved={handleSaved}
        onCancel={() => navigate('/books')}
        onDone={() => navigate('/books')}
      />
    </div>
  );
}
