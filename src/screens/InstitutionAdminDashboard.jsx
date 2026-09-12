import { Link } from 'react-router-dom';
import PageHeader from '../ui/PageHeader.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import DataTable from '../ui/DataTable.jsx';
import DashboardStatStrip from '../ui/DashboardStatStrip.jsx';
import { DashboardDecoration } from '../ui/pageDecorations.jsx';
import { useInstitutionAdminDashboard } from './useInstitutionAdminDashboard.js';
import DashboardLoadState from './DashboardLoadState.jsx';

const PENDING_COLUMNS = [
  { key: 'scopeType', label: 'Scope' },
  { key: 'scopeLabel', label: 'What', render: (row) => row.scopeLabel ?? row.scopeId },
  {
    key: 'resolvedItemCount',
    label: 'Books',
    render: (row) => `${row.resolvedItemCount} book${row.resolvedItemCount === 1 ? '' : 's'}`,
  },
];

function ShelvesPanel({ feedSettings }) {
  return (
    <Card>
      <div className="detail-section-title">
        <h2>Curated shelves</h2>
      </div>
      <p className="muted small">Feed: {feedSettings.feedTitle}</p>
      <div className="stack" style={{ gap: 0 }}>
        {feedSettings.shelves.map((shelf) => (
          <div className="dashboard-list-row" key={shelf.id}>
            <div className="dashboard-list-row-top">
              <span className="row-link-emphasis">{shelf.title || 'Untitled shelf'}</span>
              <span className="table-entity-sub">
                {shelf.itemIds.length} book{shelf.itemIds.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        className="modal-footer"
        style={{
          padding: 0,
          border: 'none',
          marginTop: 'var(--space-sm)',
          justifyContent: 'flex-start',
        }}
      >
        <Link className="btn-reset-link" to="/shelves" style={{ padding: 0 }}>
          Curate shelves →
        </Link>
      </div>
    </Card>
  );
}

/** An INSTITUTION_ADMIN's dashboard is their own institution - see
 * useInstitutionAdminDashboard.js for exactly which real, already-scoped endpoints back it, and
 * why there is no Approve/Reject here (that action is SUPER_ADMIN only). */
export default function InstitutionAdminDashboard({ institutionId }) {
  const { loading, error, data, reload } = useInstitutionAdminDashboard(institutionId);

  return (
    <div className="stack">
      <PageHeader
        title="Institution overview"
        subtitle="Your entitlements, your curated shelves, and what's still waiting on approval."
        decoration={<DashboardDecoration />}
        actions={
          <Button as={Link} variant="primary" icon="verified_user" to="/entitlements">
            Browse catalogue
          </Button>
        }
      />

      <DashboardLoadState loading={loading} error={error} onRetry={reload} />

      {data ? (
        <>
          <DashboardStatStrip
            stats={[
              {
                label: 'Accessible Items',
                value: data.institution.summary?.accessibleItemCount ?? '—',
                helper: 'across active grants',
              },
              { label: 'Active Entitlements', value: data.activeEntitlements },
              { label: 'Catalogue Version', value: data.institution.catalogueVersion },
              {
                label: 'Pending Requests',
                value: data.pendingEntitlements.length,
                helper: 'awaiting a super admin',
                highlight: data.pendingEntitlements.length > 0,
              },
            ]}
          />

          <div className="dashboard-grid">
            <Card>
              <div className="detail-section-title">
                <h2>Pending entitlement requests</h2>
              </div>
              <DataTable
                columns={PENDING_COLUMNS}
                rows={data.pendingEntitlements}
                emptyMessage="Nothing is waiting on approval right now."
              />
            </Card>

            <div className="dashboard-side">
              <ShelvesPanel feedSettings={data.feedSettings} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
