import { Link } from 'react-router-dom';

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
    <div className="card">
      <h1>Cannot open this record</h1>
      <p className="muted">{error.friendly ?? error.message ?? 'Something went wrong.'}</p>
      {error.traceId ? <p className="trace">Trace {error.traceId}</p> : null}
      <div className="row-buttons">
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
        <Link className="btn" to={backTo}>
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
