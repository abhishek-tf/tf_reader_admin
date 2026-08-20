/**
 * Read-only details for the selected institution: its catalogue version, and — when the server
 * sends them — how many entitlements it has, how many books it can reach, and a link to its feed.
 */
export default function InstitutionSummaryPanel({ institution }) {
  if (!institution) {
    return null;
  }

  const summary = institution.summary;

  return (
    <div className="institution-summary-panel">
      <dl>
        <dt>Catalogue version</dt>
        <dd>{institution.catalogueVersion}</dd>
      </dl>
      <p className="muted small">
        This number rises whenever what this institution&rsquo;s members can see changes. It is the
        fastest way to confirm a change actually took effect.
      </p>

      {summary && (
        <dl>
          <dt>Active entitlements</dt>
          <dd>{summary.entitlementCount}</dd>
          <dt>Accessible books</dt>
          <dd>{summary.accessibleItemCount}</dd>
          <dt>Feed</dt>
          <dd>
            <a href={summary.feedUrl} target="_blank" rel="noopener noreferrer">
              {summary.feedUrl}
            </a>
          </dd>
        </dl>
      )}
    </div>
  );
}
