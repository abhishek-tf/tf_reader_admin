import { Link } from 'react-router-dom';

/**
 * A mistyped address. Without this, an unknown path renders nothing and looks like a crash.
 */
export default function NotFound() {
  return (
    <div className="card">
      <h1>Page not found</h1>
      <p className="muted">That address does not exist in the console.</p>
      <Link className="btn" to="/">
        Back to the start
      </Link>
    </div>
  );
}
