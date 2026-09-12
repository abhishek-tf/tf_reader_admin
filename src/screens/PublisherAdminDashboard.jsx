import { Link } from 'react-router-dom';
import PageHeader from '../ui/PageHeader.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import DataTable from '../ui/DataTable.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import DashboardStatStrip from '../ui/DashboardStatStrip.jsx';
import { DashboardDecoration } from '../ui/pageDecorations.jsx';
import { usePublisherAdminDashboard } from './usePublisherAdminDashboard.js';
import { buildIngestAttentionColumns } from './dashboardIngestColumns.jsx';
import DashboardLoadState from './DashboardLoadState.jsx';

const INGEST_COLUMNS = buildIngestAttentionColumns({ showPublisher: false });

function PublisherSummaryPanel({ publisher }) {
  return (
    <Card>
      <div className="detail-section-title">
        <h2>{publisher.name}</h2>
        <StatusBadge status={publisher.status} />
      </div>
      <p className="muted small">{publisher.description || 'No description on file.'}</p>
      <dl className="kv">
        <div className="kv-row">
          <dt className="kv-key">Code</dt>
          <dd className="kv-value code-chip-plain">{publisher.code}</dd>
        </div>
        <div className="kv-row">
          <dt className="kv-key">Collections</dt>
          <dd className="kv-value">{publisher.collectionCount ?? '—'}</dd>
        </div>
        <div className="kv-row">
          <dt className="kv-key">Catalogue items</dt>
          <dd className="kv-value">{publisher.itemCount ?? '—'}</dd>
        </div>
      </dl>
      <Link className="btn btn-sm" to={`/publishers/${publisher.id}#collections`}>
        View collections
      </Link>
    </Card>
  );
}

/** A PUBLISHER_ADMIN's dashboard is their own imprint - see usePublisherAdminDashboard.js for
 * exactly which real, already-scoped endpoints back it. */
export default function PublisherAdminDashboard({ publisherId }) {
  const { loading, error, data, reload } = usePublisherAdminDashboard(publisherId);

  return (
    <div className="stack">
      <PageHeader
        title="Publisher overview"
        subtitle="Your catalogue, its ingest queue, and your collections, at a glance."
        decoration={<DashboardDecoration />}
        actions={
          <Button as={Link} variant="primary" icon="add" to="/books/new">
            Add catalogue item
          </Button>
        }
      />

      <DashboardLoadState loading={loading} error={error} onRetry={reload} />

      {data ? (
        <>
          <DashboardStatStrip
            stats={[
              { label: 'Catalogue Items', value: data.totalItems, helper: 'in your imprint' },
              { label: 'Published', value: data.publishedCount },
              { label: 'Draft', value: data.draftCount },
              {
                label: 'Needs Attention',
                value: data.attentionTotal,
                helper: 'queued, processing or failed',
                highlight: data.attentionTotal > 0,
              },
            ]}
          />

          <div className="dashboard-grid">
            <Card>
              <div className="detail-section-title">
                <h2>Ingest queue</h2>
              </div>
              <DataTable
                columns={INGEST_COLUMNS}
                rows={data.attentionItems}
                emptyMessage="Nothing is queued, processing or failed right now."
              />
              <div
                className="modal-footer"
                style={{
                  padding: 0,
                  border: 'none',
                  marginTop: 'var(--space-sm)',
                  justifyContent: 'flex-start',
                }}
              >
                <Link className="btn-reset-link" to="/books" style={{ padding: 0 }}>
                  View full catalogue →
                </Link>
              </div>
            </Card>

            <div className="dashboard-side">
              <PublisherSummaryPanel publisher={data.publisher} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
