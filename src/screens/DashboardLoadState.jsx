import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

/** What every scope's dashboard shows while loading or on failure — the same loading/error
 * shape every other screen in this app already uses, so a dashboard reads as one more page in
 * this console rather than a special case. Renders nothing once there's real data. */
export default function DashboardLoadState({ loading, error, onRetry }) {
  if (loading) {
    return <p className="muted">Loading your dashboard...</p>;
  }
  if (error) {
    return (
      <Card>
        <h1>Cannot load the dashboard</h1>
        <p className="muted">{error.friendly ?? error.message ?? 'Something went wrong.'}</p>
        {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
        <Button onClick={onRetry}>Try again</Button>
      </Card>
    );
  }
  return null;
}
