import { Link } from 'react-router-dom';
import Card from './Card.jsx';
import Button from './Button.jsx';
import Icon from './Icon.jsx';

/**
 * What a form screen shows while its record is loading, or when loading it failed.
 *
 * Renders nothing once there is a record, so a screen can put it above the form and not
 * branch. The traceId is shown because it is the only thing that makes a bug report findable
 * in the server logs.
 */
export default function RecordLoadState({ loading, error, onRetry, backTo, backLabel }) {
  if (loading) {
    return <p className="muted">Loading...</p>;
  }
  if (!error) {
    return null;
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
        <Icon name="error" style={{ color: 'var(--bad)', fontSize: 24 }} />
        <div>
          <h1>Cannot open this record</h1>
          <p className="muted">{error.friendly ?? error.message ?? 'Something went wrong.'}</p>
          {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
        </div>
      </div>
      <div className="row-buttons">
        <Button onClick={onRetry}>Try again</Button>
        <Link className="btn" to={backTo}>
          {backLabel}
        </Link>
      </div>
    </Card>
  );
}
