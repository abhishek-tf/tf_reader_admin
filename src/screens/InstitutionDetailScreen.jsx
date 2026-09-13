import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DataTable from '../ui/DataTable.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import InstitutionSummaryPanel from './InstitutionSummaryPanel.jsx';
import { useInstitutionEntitlements } from './useInstitutionEntitlements.js';
import { ENTITLEMENT_COLUMNS } from './entitlementColumns.jsx';
import { getColumns } from './bookColumns.jsx';
import { getInstitution } from '../api/institution.js';

// Up to two letters for the hero avatar, from the institution's code — same rule as its table
// row: a code is always present and short, where a name is neither guaranteed nor bounded.
function initialsOf(code) {
  return (code ?? '').slice(0, 2).toUpperCase();
}

/**
 * One institution's own page: who they are, their entitlements, and the books those
 * entitlements resolve to. Reached by clicking an institution's name on the list, replacing
 * what used to be an inline summary card at the bottom of that same list.
 */
export default function InstitutionDetailScreen() {
  const { institutionId } = useParams();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);
  const entitlements = useInstitutionEntitlements(institutionId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getInstitution(institutionId)
      .then((loaded) => {
        if (!cancelled) setInstitution(loaded);
      })
      .catch((failure) => {
        if (!cancelled) setError(failure);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [institutionId, reloadCount]);

  if (loading) {
    return <p className="muted">Loading the institution...</p>;
  }

  if (error) {
    return (
      <Card>
        <h1>Cannot show this institution</h1>
        <p className="muted">{error.friendly}</p>
        {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
        <div className="row-buttons">
          <Button onClick={() => setReloadCount((count) => count + 1)}>Try again</Button>
          <Link className="btn" to="/institutions">
            Back to institutions
          </Link>
        </div>
      </Card>
    );
  }

  if (!institution) {
    return null;
  }

  return (
    <div className="stack">
      <Card>
        <div className="detail-hero-top">
          <Button as={Link} variant="ghost" size="sm" icon="arrow_back" to="/institutions">
            Back to institutions
          </Button>
        </div>
        <div className="detail-hero-main">
          {institution.branding?.logoUrl ? (
            <span className="table-entity-logo detail-hero-avatar" aria-hidden="true">
              <img src={institution.branding.logoUrl} alt="" />
            </span>
          ) : (
            <span className="table-entity-avatar detail-hero-avatar" aria-hidden="true">
              {initialsOf(institution.code)}
            </span>
          )}
          <div className="detail-hero-body">
            <h1 className="detail-hero-title">{institution.name}</h1>
            <div className="detail-hero-meta">
              <span className="code-chip">{institution.code}</span>
              <span className="type-chip">{institution.type}</span>
              <StatusBadge status={institution.status} />
            </div>
            <p className="detail-hero-description">
              {[institution.city, institution.country].filter(Boolean).join(', ')}
            </p>
          </div>
          <div className="detail-hero-actions">
            <Button
              as={Link}
              variant="primary"
              icon="edit"
              to={`/institutions/${institution.id}/edit`}
            >
              Edit
            </Button>
          </div>
        </div>
      </Card>

      <InstitutionSummaryPanel institution={institution} />

      <Card>
        <div className="detail-section-title">
          <h2>Entitlements</h2>
        </div>
        <DataTable
          columns={ENTITLEMENT_COLUMNS}
          rows={entitlements.entitlements}
          loading={entitlements.loadingEntitlements}
          error={entitlements.entitlementsError}
          emptyMessage="This institution holds no entitlements yet."
          onRetry={entitlements.reload}
        />
      </Card>

      <Card>
        <div className="detail-section-title">
          <h2>Books under these entitlements</h2>
        </div>
        <DataTable
          columns={getColumns(() => {})}
          rows={entitlements.books}
          loading={entitlements.loadingEntitlements || entitlements.loadingBooks}
          error={entitlements.entitlementsError}
          emptyMessage="No books are reachable through this institution's entitlements yet."
          onRetry={entitlements.reload}
        />
      </Card>
    </div>
  );
}
