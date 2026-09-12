import { Link } from 'react-router-dom';
import PageHeader from '../ui/PageHeader.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import DataTable from '../ui/DataTable.jsx';
import DashboardStatStrip from '../ui/DashboardStatStrip.jsx';
import { DashboardDecoration } from '../ui/pageDecorations.jsx';
import { useSuperAdminDashboard } from './useSuperAdminDashboard.js';
import { buildIngestAttentionColumns } from './dashboardIngestColumns.jsx';
import { ACTION_LABEL, formatAuditTimestamp } from './auditLogFields.jsx';
import DashboardLoadState from './DashboardLoadState.jsx';

const INGEST_COLUMNS = buildIngestAttentionColumns({ showPublisher: true });

function ActivityPanel({ activity }) {
  return (
    <Card>
      <div className="detail-section-title">
        <h2>Recent activity</h2>
      </div>
      {activity.length === 0 ? (
        <p className="muted small">No audit activity yet.</p>
      ) : (
        <div className="stack" style={{ gap: 0 }}>
          {activity.map((row) => {
            const { relative } = formatAuditTimestamp(row.at);
            return (
              <div className="dashboard-list-row" key={row.id}>
                <div className="dashboard-list-row-top">
                  <span className="row-link-emphasis">
                    {ACTION_LABEL[row.action] ?? row.action}
                  </span>
                  <span className="table-entity-sub">{relative}</span>
                </div>
                <span className="table-entity-sub">
                  {row.entityType ?? 'record'} · {row.actorEmail ?? row.actorId ?? 'unknown actor'}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div
        className="modal-footer"
        style={{
          padding: 0,
          border: 'none',
          marginTop: 'var(--space-sm)',
          justifyContent: 'flex-start',
        }}
      >
        <Link className="btn-reset-link" to="/operators" style={{ padding: 0 }}>
          View audit log →
        </Link>
      </div>
    </Card>
  );
}

/** A SUPER_ADMIN's dashboard: the whole catalogue's own numbers, what's mid-ingest anywhere in
 * it, and the tail of the global audit trail. See useSuperAdminDashboard.js for exactly which
 * real endpoints back each number, and why there is no cross-institution entitlements widget. */
export default function SuperAdminDashboard() {
  const { loading, error, data, reload } = useSuperAdminDashboard();

  return (
    <div className="stack">
      <PageHeader
        title="Overview & Operations"
        subtitle="Catalogue ingest, institutional licensing, and console activity, at a glance."
        decoration={<DashboardDecoration />}
        actions={
          <>
            <Button as={Link} variant="secondary" icon="add" to="/publishers/new">
              New publisher
            </Button>
            <Button as={Link} variant="primary" icon="add" to="/books/new">
              Add catalogue item
            </Button>
          </>
        }
      />

      <DashboardLoadState loading={loading} error={error} onRetry={reload} />

      {data ? (
        <>
          <DashboardStatStrip
            stats={[
              {
                label: 'Catalogue Items',
                value: data.totalCatalogueItems,
                helper: 'across every publisher',
              },
              { label: 'Institutions', value: data.totalInstitutions, helper: 'licensed campuses' },
              { label: 'Publisher Imprints', value: data.totalPublishers },
              {
                label: 'Ingest Needs Attention',
                value: data.attentionTotal,
                helper: 'queued, processing or failed',
                highlight: data.attentionTotal > 0,
              },
            ]}
          />

          <div className="dashboard-grid">
            <Card>
              <div className="detail-section-title">
                <h2>Background ingestion pipeline</h2>
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
              <ActivityPanel activity={data.activity} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
