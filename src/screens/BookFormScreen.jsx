import { Link, useNavigate, useParams } from 'react-router-dom';
import BookForm from '../ui/BookForm.jsx';
import ContentUploadPanel from '../ui/ContentUploadPanel.jsx';
import CoverUploadPanel from '../ui/CoverUploadPanel.jsx';
import { useRecord } from './useRecord.js';
import RecordLoadState from '../ui/RecordLoadState.jsx';
import { getCatalogueItem } from '../api/catalogueItems.js';

/**
 * Create or edit one book, at its own address.
 *
 * `/books/new` creates. `/books/:itemId/edit` edits. BookForm does its own saving and its own
 * messages, so this screen only supplies the record and decides where a finished form goes.
 *
 * The cover and content upload panels each sit in their own card below the form, on the edit
 * address only: a book being created has no id yet, so there is nothing to upload against. Each
 * is handed the record this screen has already loaded, so adding them costs no extra request.
 */
export default function BookFormScreen() {
  const { itemId } = useParams();
  const editing = itemId !== undefined;
  const navigate = useNavigate();
  const { record, loading, error, reload } = useRecord(getCatalogueItem, itemId);

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

      <section className="card">
        <BookForm
          initialItem={record}
          onSaved={() => navigate('/books')}
          onCancel={() => navigate('/books')}
        />
      </section>

      {/* `record` as well as `editing`: the load guard above has already returned for loading
          and for failure, so this is only defensive about an endpoint answering with no body. */}
      {editing && record ? (
        <section className="card">
          <CoverUploadPanel item={record} />
        </section>
      ) : null}

      {editing && record ? (
        <section className="card">
          <ContentUploadPanel item={record} />
        </section>
      ) : null}
    </div>
  );
}
