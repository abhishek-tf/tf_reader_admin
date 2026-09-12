import { Link } from 'react-router-dom';
import CoverThumb from '../ui/CoverThumb.jsx';
import IngestStateBadge from '../ui/IngestStateBadge.jsx';
import { formatAuditTimestamp } from './auditLogFields.jsx';

/** The catalogue items needing operator attention right now - QUEUED, PROCESSING or FAILED -
 * Stitch's own "Background Ingestion Pipeline" table, built from the same real `contentState`
 * every Books page row already carries. `showPublisher` is on for the SUPER_ADMIN dashboard
 * (whose items span every publisher) and off for a PUBLISHER_ADMIN's own, single-publisher one,
 * where repeating their own name on every row would say nothing a Books table doesn't already. */
export function buildIngestAttentionColumns({ showPublisher }) {
  const columns = [
    {
      key: 'title',
      label: 'Catalogue item & ISBN',
      render: (row) => (
        <div className="table-entity">
          <CoverThumb
            id={row.id}
            coverUrl={row.coverUrl}
            contentType={row.contentType}
            updatedAt={row.updatedAt}
          />
          <div className="table-entity-text">
            <Link to={`/books/${row.id}/edit`} className="row-link row-link-emphasis">
              {row.title}
            </Link>
            <span className="table-entity-sub code-chip-plain">{row.isbn ?? '—'}</span>
          </div>
        </div>
      ),
    },
  ];
  if (showPublisher) {
    columns.push({
      key: 'publisherName',
      label: 'Publisher',
      render: (row) => row.publisherName ?? row.publisherId,
    });
  }
  columns.push(
    {
      key: 'contentState',
      label: 'Status',
      render: (row) => <IngestStateBadge state={row.contentState} />,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row) => (row.updatedAt ? formatAuditTimestamp(row.updatedAt).relative : '—'),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link className="btn btn-ghost btn-sm" to={`/books/${row.id}/edit`}>
          Open
        </Link>
      ),
    }
  );
  return columns;
}
