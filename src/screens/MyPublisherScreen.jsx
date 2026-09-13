import { Outlet, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import DashboardStatStrip from '../ui/DashboardStatStrip.jsx';
import RouteErrorBoundary from '../ui/RouteErrorBoundary.jsx';
import { PublishersDecoration } from '../ui/pageDecorations.jsx';
import PublisherCollections from './PublisherCollections.jsx';
import { usePublisherAdminDashboard } from './usePublisherAdminDashboard.js';
import DashboardLoadState from './DashboardLoadState.jsx';

function initialsOf(code) {
  return (code ?? '').slice(0, 3).toUpperCase();
}

/**
 * A PUBLISHER_ADMIN's own view of the Publishers page: their one imprint, not a catalogue of
 * every publisher. There is nothing to browse or filter here, so this is a purpose-built screen
 * rather than the SUPER_ADMIN catalogue table scaled down to one row — see
 * PublisherCatalogueScreen.jsx for that. Reuses usePublisherAdminDashboard for the same
 * already-scoped data the dashboard shows, since both screens describe the same one publisher.
 */
export default function MyPublisherScreen({ publisherId }) {
  const { loading, error, data, reload } = usePublisherAdminDashboard(publisherId);
  const location = useLocation();

  return (
    <div className="stack">
      <PageHeader
        title="Your publisher"
        subtitle="The imprint you manage, its collections, and what's in the catalogue."
        decoration={<PublishersDecoration />}
      />

      <DashboardLoadState loading={loading} error={error} onRetry={reload} />

      {data ? (
        <>
          <Card>
            <div className="detail-hero-main">
              <span className="table-entity-avatar detail-hero-avatar" aria-hidden="true">
                {initialsOf(data.publisher.code)}
              </span>
              <div className="detail-hero-body">
                <h1 className="detail-hero-title">{data.publisher.name}</h1>
                <div className="detail-hero-meta">
                  <span className="code-chip">{data.publisher.code}</span>
                  <StatusBadge status={data.publisher.status} />
                </div>
                {data.publisher.description ? (
                  <p className="detail-hero-description">{data.publisher.description}</p>
                ) : null}
              </div>
              <div className="detail-hero-actions">
                <Button
                  as={Link}
                  variant="primary"
                  icon="edit"
                  to={`/publishers/${data.publisher.id}/edit`}
                >
                  Edit
                </Button>
              </div>
            </div>
          </Card>

          <DashboardStatStrip
            stats={[
              { label: 'Catalogue Items', value: data.totalItems },
              { label: 'Published', value: data.publishedCount },
              { label: 'Drafts', value: data.draftCount },
              {
                label: 'Needs Attention',
                value: data.attentionTotal,
                helper: 'queued, processing or failed',
                highlight: data.attentionTotal > 0,
              },
            ]}
          />

          <div id="collections">
            <PublisherCollections publisherId={data.publisher.id} />
          </div>
        </>
      ) : null}

      {/* Same reasoning as PublisherCatalogueScreen's own Outlet: the edit form is a nested
          route rendered as a modal over this page, and `reload` refreshes this screen's own
          already-scoped data after a save instead of relying on a remount that no longer
          happens. */}
      <RouteErrorBoundary resetKey={location.pathname} fallbackTo="/publishers">
        <Outlet context={{ reload }} />
      </RouteErrorBoundary>
    </div>
  );
}
