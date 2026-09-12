import KpiCard from '../ui/KpiCard.jsx';

/**
 * Read-only details for one institution: its catalogue version, and — when the server sends
 * them — how many entitlements it has and how many books it can reach. Same KpiCard the
 * Institutions list's own banner uses, rather than a bare `<dl>` with no styling of its own.
 */
export default function InstitutionSummaryPanel({ institution }) {
  if (!institution) {
    return null;
  }

  const summary = institution.summary;

  return (
    <div className="kpi-grid kpi-grid-3">
      <KpiCard
        label="Catalogue version"
        value={institution.catalogueVersion}
        icon="sync"
        helper="Rises whenever a change takes effect"
      />
      <KpiCard
        label="Active entitlements"
        value={summary ? summary.entitlementCount : '—'}
        icon="verified_user"
        accent
      />
      <KpiCard
        label="Accessible books"
        value={summary ? summary.accessibleItemCount : '—'}
        icon="auto_stories"
      />
    </div>
  );
}
