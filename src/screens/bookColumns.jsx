import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge.jsx';
import IngestStateBadge from '../ui/IngestStateBadge.jsx';
import Icon from '../ui/Icon.jsx';

const TIER_LABEL = {
  OPEN_ACCESS: 'Open access',
  SUBSCRIPTION: 'Subscription',
  ELITE: 'Elite',
};

// Per the encryption rule the whole app follows (shared.md): audio is never encrypted, in
// any tier, because whole-file encryption cannot seek; open access is never encrypted either,
// because a key handed to anonymous readers protects nothing. So the lock icon is a real,
// derived fact about the two fields already on the row, not a third one of its own.
function isEncrypted(row) {
  return row.contentType !== 'AUDIO' && row.accessTier !== 'OPEN_ACCESS';
}

export const COLUMNS = [
  {
    key: 'title',
    label: 'Title & authors',
    render: (row) => (
      <div className="table-entity">
        {row.coverUrl ? (
          <img src={row.coverUrl} alt="" className="book-cover-thumb" aria-hidden="true" />
        ) : (
          <span className="book-cover-thumb book-cover-thumb-placeholder" aria-hidden="true">
            <Icon name={row.contentType === 'AUDIO' ? 'headphones' : 'menu_book'} />
          </span>
        )}
        <div className="table-entity-text">
          <Link to={`/books/${row.id}/edit`} className="row-link row-link-emphasis">
            {row.title}
          </Link>
          {row.authors?.length ? (
            <span className="table-entity-sub">{row.authors.join(', ')}</span>
          ) : null}
        </div>
      </div>
    ),
  },
  {
    key: 'isbn',
    label: 'ISBN',
    render: (row) => (row.isbn ? <span className="code-chip">{row.isbn}</span> : '—'),
  },
  {
    key: 'publisherName',
    label: 'Publisher',
    render: (row) => row.publisherName ?? row.publisherId,
  },
  {
    key: 'contentType',
    label: 'Format',
    render: (row) => (
      <span className="format-chip">
        {row.contentType}
        {isEncrypted(row) ? <Icon name="lock" style={{ fontSize: 13 }} /> : null}
      </span>
    ),
  },
  {
    key: 'accessTier',
    label: 'Access tier',
    render: (row) => <span className={`badge badge-${row.accessTier}`}>{TIER_LABEL[row.accessTier]}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'contentState',
    label: 'Content state',
    render: (row) => (
      <>
        <IngestStateBadge state={row.contentState} />
        {row.contentState === 'FAILED' && row.contentError ? (
          <p className="content-error">{row.contentError}</p>
        ) : null}
      </>
    ),
  },
  {
    key: 'actions',
    label: '',
    render: (row) => (
      <Link className="btn-icon-ghost" to={`/books/${row.id}/edit`} aria-label={`Edit ${row.title}`} title="Edit">
        <Icon name="edit" />
      </Link>
    ),
  },
];
