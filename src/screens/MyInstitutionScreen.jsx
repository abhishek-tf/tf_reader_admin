import { Outlet, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import DashboardStatStrip from '../ui/DashboardStatStrip.jsx';
import RouteErrorBoundary from '../ui/RouteErrorBoundary.jsx';
import { InstitutionsDecoration } from '../ui/pageDecorations.jsx';
import { useInstitutionAdminDashboard } from './useInstitutionAdminDashboard.js';
import DashboardLoadState from './DashboardLoadState.jsx';

function initialsOf(code) {
  return (code ?? '').slice(0, 2).toUpperCase();
}

/**
 * An INSTITUTION_ADMIN's own profile page: their one institution, not a catalogue of every
 * institution in the system. There's nothing to browse or filter, so this is a purpose-built
 * screen rather than the SUPER_ADMIN catalogue table scaled down to one row — see
 * InstitutionCatalogueScreen.jsx for that. Entitlements live on their own page (see the
 * "Entitlements" sidebar entry) rather than here.
 */
export default function MyInstitutionScreen({ institutionId }) {
  const { loading, error, data, reload } = useInstitutionAdminDashboard(institutionId);
  const location = useLocation();

  return (
    <div className="stack">
      <PageHeader
        title="Your institution"
        subtitle="Who you are and your curated shelves."
        decoration={<InstitutionsDecoration />}
      />

      <DashboardLoadState loading={loading} error={error} onRetry={reload} />

      {data ? (
        <>
          <Card>
            <div className="detail-hero-main">
              {data.institution.branding?.logoUrl ? (
                <span className="table-entity-logo detail-hero-avatar" aria-hidden="true">
                  <img src={data.institution.branding.logoUrl} alt="" />
                </span>
              ) : (
                <span className="table-entity-avatar detail-hero-avatar" aria-hidden="true">
                  {initialsOf(data.institution.code)}
                </span>
              )}
              <div className="detail-hero-body">
                <h1 className="detail-hero-title">{data.institution.name}</h1>
                <div className="detail-hero-meta">
                  <span className="code-chip">{data.institution.code}</span>
                  <span className="type-chip">{data.institution.type}</span>
                  <StatusBadge status={data.institution.status} />
                </div>
                <p className="detail-hero-description">
                  {[data.institution.city, data.institution.country].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="detail-hero-actions">
                <Button
                  as={Link}
                  variant="primary"
                  icon="edit"
                  to={`/institutions/${data.institution.id}/edit`}
                >
                  Edit
                </Button>
              </div>
            </div>
          </Card>

          <DashboardStatStrip
            stats={[
              {
                label: 'Accessible Items',
                value: data.institution.summary?.accessibleItemCount ?? '—',
                helper: 'across active grants',
              },
              { label: 'Catalogue Version', value: data.institution.catalogueVersion },
            ]}
          />
        </>
      ) : null}

      {/* Same reasoning as MyPublisherScreen's own Outlet: the edit form is a nested route
          rendered as a modal over this page. */}
      <RouteErrorBoundary resetKey={location.pathname} fallbackTo="/institutions">
        <Outlet context={{ reload }} />
      </RouteErrorBoundary>
    </div>
  );
}
